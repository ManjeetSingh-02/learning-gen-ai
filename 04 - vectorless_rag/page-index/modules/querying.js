// internal-imports
import { openAIClient } from '../core/config/openai.js';
import { pageIndexClient } from '../core/config/pageindex.js';

export async function querying(query) {
  // get all the documents from the PageIndex
  const { documents } = await pageIndexClient.api.listDocuments();

  // call the OpenAI with the user query and list of docs to get relevant documents
  const relevantDocs = await openAIClient.responses.create({
    model: 'gpt-4.1-mini',
    instructions: `You are an expert document router. You will be provided with a user query and a list of document metadata (id, name, description, status).
    
    RULES:
    - You will be provided with a user query and a list of documents metadata(id, name, description, status).
    - Your task is to identify the most relevant documents from the list and return the relevant documents.
    - If a document is relevant and status is completed, return the document id.
    - If a document is relevant but status is not completed, return []
    - If you don't find any relevant documents, return []
    - Return ONLY a valid JSON array.

    EXAMPLE:
    - ["doc_id_1", "doc_id_2"]
    - []
    
    Documents Metadata:
    ${documents
      .map(d =>
        JSON.stringify({
          id: d.id,
          name: d.name,
          description: d.description,
          status: d.status,
        })
      )
      .join('\n\n')}
    `,
    input: query,
  });

  // parse the response from OpenAI
  const relevantDocsIDs = JSON.parse(relevantDocs.output_text);

  // if no relevant documents found, log a message
  if (relevantDocsIDs.length === 0) return console.log('No relevant documents found.');

  // call the PageIndex for final response
  const response = await pageIndexClient.api.chatCompletions({
    messages: [{ role: 'user', content: query }],
    doc_id: relevantDocsIDs,
    stream: true,
  });

  // stream the response from the PageIndex
  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content ?? '';
    if (content) process.stdout.write(content);
  }
}
