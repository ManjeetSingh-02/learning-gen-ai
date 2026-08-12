// external-imports
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';

// type for the memory response
type MemoryResponse = {
  episodes: { content: string }[];
  facts: { action: 'create' | 'update'; id: string; content: string }[];
};

// create a Qdrant vector store and add the embeddings to it
const vectorStore = await QdrantVectorStore.fromExistingCollection(
  new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY, model: 'text-embedding-3-small' }),
  { collectionName: 'custom-memory', url: 'http://localhost:6333' }
);

// function to retrieve docs from the vector store
export async function retrieveDocs(query: string, userID: string) {
  // get the last 3 relevant documents from the vector store
  const docs = await vectorStore.similaritySearch(query, 3, {
    must: [{ key: 'metadata.userID', match: { value: userID } }],
  });

  // return the documents in the required format
  return docs.map(d => ({ id: d.id, content: d.pageContent, metadata: d.metadata }));
}

// function to store docs in the vector store
export async function storeDocs(memory: MemoryResponse, userID: string): Promise<void> {
  // delete old Qdrant points for updated facts
  for (const f of memory.facts.filter(f => f.action === 'update')) {
    await vectorStore.client.delete('custom-memory', { wait: true, points: [f.id] });
  }

  // prepare new memories
  const newMemories = [
    ...memory.facts.map(f => ({
      pageContent: f.content,
      metadata: { type: 'fact', userID },
    })),
    ...memory.episodes.map(e => ({
      pageContent: e.content,
      metadata: { type: 'episode', userID },
    })),
  ];

  // store the new memories in the vector store if there are any
  if (newMemories.length > 0) await vectorStore.addDocuments(newMemories);
}
