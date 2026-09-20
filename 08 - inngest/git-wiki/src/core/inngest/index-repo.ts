import { inngest } from '../lib/inngest.js';
import { fetchGitHubRepoFiles } from '../utils/github.js';
import { chunkFiles } from '../utils/chunking.js';
import { saveChunks } from '../utils/vector-store.js';

export const indexRepo = inngest.createFunction(
  {
    id: 'index-repo',
    triggers: [{ event: 'repo/index' }],
  },
  async ({ event, step }) => {
    const { owner, repo } = event.data;
    const repoKey = `${owner}/${repo}`;

    const files = await step.run('fetch-repo-files', async () => fetchGitHubRepoFiles(owner, repo));

    const documents = await step.run('chunk-files', async () => chunkFiles(files, repoKey));

    const data = await step.run('save-chunks', async () => saveChunks(documents, repoKey));

    return { repo: repoKey, chunks: data.chunks, saved: data.saved };
  }
);
