import { ChatOpenAI } from '@langchain/openai';

export async function queryLLM(docs: any[], query: string) {
  if (!docs.length) return { answer: 'No indexed content was found for this repo', sources: [] };

  const llm = new ChatOpenAI({ model: 'gpt-4o-mini' });

  const response = await llm.invoke(`Answer the user's query based on the given context.
    If the context does not contain the answer, respond with "I don't know".
    Query:${query}
    Context:${docs.map(doc => `File: ${doc.metadata.path}\n${doc.pageContent}`).join('\n\n')}`);

  return { answer: response.text, sources: [...new Set(docs.map(d => d.metadata.path))] };
}
