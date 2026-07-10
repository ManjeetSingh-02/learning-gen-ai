import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { OpenAI } from 'openai';

// define constants for the Qdrant collection name and URL
const QDRANT_COLLECTION_NAME = 'book-docs';
const QDRANT_URL = 'http://localhost:6333';

// create vector embeddings using OpenAI's embedding model
const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
  apiKey: process.env.OPENAI_API_KEY,
});

// create a Qdrant vector store and add the embeddings to it
const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: QDRANT_URL,
  collectionName: QDRANT_COLLECTION_NAME,
});

// create a retriever to query the vector store
const vectorRetriever = vectorStore.asRetriever({ k: 3 });

// create an instance of the OpenAI API client
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function indexing(files) {
  await Promise.all(
    files.map(async fp => {
      // load the PDF document using the PDFLoader
      const loader = new PDFLoader(fp);
      const docs = await loader.load();

      // add the loaded documents to the vector store
      await vectorStore.addDocuments(docs);
    })
  );
}

async function querying(query) {
  // query the vector store for relevant documents based on the user query
  const results = await vectorRetriever.invoke(query);

  // system prompt with the relevant documents
  const SYSTEM_PROMPT = `You are expert in answering user based query on the provided context about the documents. Don't answer anything outside the context of the documents. Always answer in short and also provide page number of the content and name of the book. If you don't know the answer, just say "I don't know". Don't try to make up an answer.
  User Documents:
    ${results
      .map((d, i) =>
        JSON.stringify({
          pageContent: d.pageContent,
          pageNumber: d.metadata.loc.pageNumber,
          bookName: d.metadata.source,
        })
      )
      .join('\n\n')}`;

  // call the OpenAI API with the system prompt and user query to get a response
  const response = await openAIClient.responses.create({
    model: 'gpt-4.1-mini',
    instructions: SYSTEM_PROMPT,
    input: query,
  });

  // log the response from the OpenAI API
  console.log(response.output_text);
}

await indexing(['./software.pdf', './dsa.pdf']);
await querying('What is waterfall model?');
