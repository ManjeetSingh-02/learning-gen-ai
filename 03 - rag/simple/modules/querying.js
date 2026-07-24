// internal-imports
import { vectorRetriever } from '../utils/vector.js';

// external-imports
import { OpenAI } from 'openai';

// create an instance of the OpenAI client
const openai = new OpenAI();

export async function querying(query) {
  // call the OpenAI API with the system prompt and query to get enhanced query
  const enhancedQuery = await openai.responses.create({
    model: 'gpt-4.1-mini',
    instructions: `You are expert in understanding what user is asking. Simple enhance the user query with more context and detalils. Don't answer the query, just enhance it and return output in text format.`,
    input: query,
  });

  // query the vector store for relevant documents based on the enhanced query
  const results = await vectorRetriever.invoke(enhancedQuery.output_text);

  // system prompt with the relevant documents
  const SYSTEM_PROMPT = `You are expert in answering user based query on the provided context about the documents. Don't answer anything outside the context of the documents. You will be provided with the relevant documents. Use the relevant documents to answer the user query. If you don't find any relevant information in the documents, just say "I don't know". Don't try to make up an answer. Always provide the page number of the content and name of the book in your answer.
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

  // call the OpenAI API with the system prompt and enhanced query to get a response
  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    instructions: SYSTEM_PROMPT,
    input: enhancedQuery.output_text,
  });

  // log the response from the OpenAI API
  console.log(response.output_text);
}
