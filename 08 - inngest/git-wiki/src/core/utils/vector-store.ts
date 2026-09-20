import type { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { createHash } from 'crypto';

const embeddings = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const UPSERT_BATCH_SIZE = 100;
const DEFAULT_TOP_K = 5;

function repoToNamespace(repo: string) {
  return repo.replace('/', '-');
}

function getIndex(namespace: string) {
  return pinecone.index({ name: process.env.PINECONE_INDEX_NAME }).namespace(namespace);
}

export async function saveChunks(documents: Document[], repoKey: string) {
  const chunks = documents
    .map(d => ({
      metadata: d.metadata ?? {},
      pageContent: typeof d.pageContent === 'string' ? d.pageContent : '',
    }))
    .filter(d => d.pageContent.trim().length > 0);

  if (chunks.length === 0) return { saved: false, chunks: 0 };

  const namespace = repoToNamespace(repoKey);
  const index = getIndex(namespace);

  const texts = chunks.map(d => d.pageContent);
  const vectors = await embeddings.embedDocuments(texts);

  const records = chunks.map((d, i) => ({
    id: createHash('sha256').update(`${repoKey}:${d.metadata.path}:${d.pageContent}`).digest('hex'),
    metadata: { text: d.pageContent, path: d.metadata.path, repo: repoKey },
    values: vectors[i],
  }));

  for (let i = 0; i < records.length; i += UPSERT_BATCH_SIZE) {
    await index.upsert({ records: records.slice(i, i + UPSERT_BATCH_SIZE) });
  }

  return { saved: true, chunks: records.length };
}

export async function searchChunks(query: string, repoKey: string) {
  const namespace = repoToNamespace(repoKey);
  const index = getIndex(namespace);

  const vector = await embeddings.embedQuery(query);

  const response = await index.query({
    vector,
    topK: DEFAULT_TOP_K,
    includeMetadata: true,
  });

  return (response.matches ?? [])
    .map(match => ({
      metadata: { path: match.metadata?.path, repo: match.metadata?.repo },
      pageContent: match.metadata?.text ?? '',
      score: match.score,
    }))
    .filter(doc => doc.pageContent.toString().trim().length > 0);
}
