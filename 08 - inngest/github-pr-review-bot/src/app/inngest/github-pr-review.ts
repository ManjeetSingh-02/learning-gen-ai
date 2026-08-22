// internal-imports
import { inngest } from '../../lib/inngest.js';
import { octokit } from '../../lib/octokit.js';
import { githubPRReviewAgent } from '../agents/github-pr-review.js';

// external-imports
import { run } from '@openai/agents';

// function to handle github pull request review
export const githubPullRequestReview = inngest.createFunction(
  { id: 'github-pr-review', triggers: [{ event: 'github/pullrequest.review' }] },
  async function ({ event, step }) {
    // extract data from event
    const { owner, pull_number, repo } = event.data;

    // step to fetch pull request information
    const pr = await step.run('pr/fetch-info', async function () {
      // fetch pull request information
      const { data } = await octokit.pulls.get({ owner, pull_number, repo });

      // return pull request information
      return {
        id: data.id,
        title: data.title,
        state: data.state,
        number: data.number,
        comments: data.comments,
        url: data.url,
        diff_url: data.diff_url,
        changes_url: data.changed_files,
        commits: data.commits,
        head: { ref: data.head.ref, sha: data.head.sha },
      };
    });

    // check if pull request is closed
    if (pr.state === 'closed') return { message: 'Pull request is closed' };

    // step to fetch pull request changes
    const changes = await step.run('pr/fetch-changes', async function () {
      // fetch pull request changes
      const data = await octokit.paginate(octokit.pulls.listFiles, {
        owner,
        pull_number,
        repo,
        per_page: 10,
      });

      // return pull request changes
      return data.map(c => ({
        filename: c.filename,
        status: c.status,
        changes: c.changes,
        patch: c.patch,
        additions: c.additions,
        deletions: c.deletions,
        previous_filename: c.previous_filename,
      }));
    });

    // check if there are no changes
    if (changes.length === 0) return { message: 'No changes found for this pull request' };

    // step to analyze pull request and changes using AI agent
    const ai = await step.run('ai/analyze-changes', async function () {
      // call the agent to analyze the pull request and changes
      const res = await run(
        githubPRReviewAgent,
        `Pull Request Information: ${JSON.stringify(pr, null, 2)}\nPull Request Changes: ${JSON.stringify(changes, null, 2)}`
      );

      // return the agent response
      return res.finalOutput;
    });

    // step to add a comment to the pull request
    await step.run('pr/add-comment', async function () {
      // add a comment to the pull request
      await octokit.pulls.createReview({
        body: `${ai!.content}\n\n**Critical Fixes:**\n${ai!.fixes!.join('\n')}\n\n**Suggestions**:\n${ai!.suggestions!.join('\n')}`,
        commit_id: pr.head.sha,
        event: 'COMMENT',
        owner,
        pull_number,
        repo,
      });
    });
  }
);
