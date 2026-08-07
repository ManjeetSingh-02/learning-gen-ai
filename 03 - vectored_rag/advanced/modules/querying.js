// internal-imports
import { vectorRetriever } from '../utils/vector.js';

// external-imports
import { OpenAI } from 'openai';

// create an instance of the OpenAI client
const openai = new OpenAI();

export async function querying(query) {
  // initialize an empty object to store the answer and related queries
  const ans = {
    queries: {},
    responses: [],
    finalResponse: null,
  };

  // get step-back, enhanced and sub queries from the user query
  const q = await openai.responses.create({
    model: 'gpt-4.1-mini',
    input: query,
    instructions: `You are an expert in answering user queries. You will be provided with a user query. Your task is to break down the user query into four parts:
    1. HyDE query: A question that provides context and background information related to the user query. 
    2. Step-back query: A question that takes a step back and looks at the bigger picture of the user query.
    3. Enhanced query: A refined version of the user query that is more specific and focused.
    4. Sub-queries: A list of smaller, more specific questions (up to 3) that can help answer the enhanced query.
    Please provide your response in the following JSON format:
    {
      "hydeQuery": "<hyde-query>",
      "stepBackQuery": "<step-back-query>",
      "enhancedQuery": "<enhanced-query>",
      "subQueries": ["<sub-query-1>", "<sub-query-2>", ...]
    }
    `,
  });

  // parse the response from the OpenAI API
  const qJSON = JSON.parse(q.output_text);

  // add the queries to the ans object for debugging purposes
  ans.queries = qJSON;

  // set a maximum number of retries for the query
  let maxRetries = 3;

  while (maxRetries > 0) {
    // query the vector store for relevant documents
    const hydeDocs = await vectorRetriever.invoke(qJSON.hydeQuery);
    const stepBackDocs = await vectorRetriever.invoke(qJSON.stepBackQuery);
    const enhancedDocs = await vectorRetriever.invoke(qJSON.enhancedQuery);
    const subQueryDocs = await Promise.all(qJSON.subQueries.map(sq => vectorRetriever.invoke(sq)));

    // top 5 docs based on reciprocal rank fusion
    const docs = reciprocalRankFusion(
      [hydeDocs, stepBackDocs, enhancedDocs, ...subQueryDocs],
      5,
      60
    );

    // call the OpenAI API with the system prompt and enhanced query to get a response
    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: qJSON.enhancedQuery,
      instructions: `You are expert in answering user based query on the provided context about the documents. Don't answer anything outside the context of the documents. You will be provided with the relevant documents. Use the relevant documents to answer the user query. If you don't find any relevant information in the documents, just say "I don't know". Don't try to make up an answer. Always provide the page number of the content and name of the book in your answer.
      
      User Documents: ${docs
        .map(d =>
          JSON.stringify({
            book: d.metadata.source,
            content: d.content,
            page: d.metadata.loc.pageNumber,
          })
        )
        .join('\n\n')}`,
    });

    // c-rag implementation
    const cResponse = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: JSON.stringify({
        userQuery: query,
        enhancedQuery: qJSON.enhancedQuery,
        OpenAIResponse: response.output_text,
      }),
      instructions: `You are an expert in answering user queries. You will be provided with a user query, enhanced query and a response from the OpenAI API. Your task is to rate the response out of 10 and return a simple JSON object. If score is less than 7, also provide a new query that is more specific and focused with keywords that can improve the score. Please provide your response in the following JSON format:
      Output Format: { score: <score>, newQuery(if present else dont add this): <new-query> }
      `,
    });

    // parse the response from the OpenAI API
    const cResponseJson = JSON.parse(cResponse.output_text);

    // add the response and score to the ans object for debugging purposes
    ans.responses.push({ ...cResponseJson, response: response.output_text });

    // if the score is greater than 8, set the final response and break the loop
    if (cResponseJson.score > 8) {
      ans.finalResponse = response.output_text;
      break;
    }

    // update the query and retry
    query = cResponseJson.newQuery;
    maxRetries--;
  }

  return ans;
}

function reciprocalRankFusion(lists, topK, k) {
  const scores = new Map();

  for (const list of lists) {
    list.forEach((doc, rank) => {
      const id = `${doc.metadata.source}:${doc.metadata.loc.pageNumber}:${doc.content}`;
      const score = 1 / (k + rank + 1);

      if (scores.has(id)) scores.get(id).score += score;
      else scores.set(id, { doc, score });
    });
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ doc }) => doc);
}
