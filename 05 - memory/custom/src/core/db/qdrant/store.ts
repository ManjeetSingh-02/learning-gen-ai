// external-imports
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';

// create vector embeddings using OpenAI's embedding model
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'text-embedding-3-small',
});

// create a Qdrant vector store and add the embeddings to it
export const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  collectionName: 'custom-memory',
  url: 'http://localhost:6333',
});
