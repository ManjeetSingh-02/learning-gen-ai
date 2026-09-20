// external-imports
import { Octokit } from '@octokit/rest';

// create octokit instance
export const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  userAgent: 'Git Wiki',
});
