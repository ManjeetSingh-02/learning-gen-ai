// external-imports
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';

// create vector embeddings using OpenAI's embedding model
const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
});

// create a Qdrant vector store and add the embeddings to it
export const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  collectionName: 'book-docs',
  url: 'http://localhost:6333',
});

// create a retriever to query the vector store
export const vectorRetriever = vectorStore.asRetriever({
  k: 3,
});
