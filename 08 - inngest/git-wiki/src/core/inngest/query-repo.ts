import { inngest } from '../lib/inngest.js';
import { queryLLM } from '../utils/query-llm.js';
import { searchChunks } from '../utils/vector-store.js';

export const queryRepo = inngest.createFunction(
  {
    id: 'query-repo',
    triggers: [{ event: 'repo/query' }],
  },
  async ({ event, step }) => {
    const { owner, repo, query } = event.data;
    const repoKey = `${owner}/${repo}`;

    const documents = await step.run('search-chunks', async () => searchChunks(query, repoKey));

    const data = await step.run('query-llm', async () => queryLLM(documents, query));

    return { answer: data.answer, sources: data.sources };
  }
);
