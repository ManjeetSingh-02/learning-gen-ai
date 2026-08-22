// external-imports
import { Agent } from '@openai/agents';
import { z } from 'zod';

export const githubPRReviewAgent = new Agent({
  name: 'GitHub PR Review Agent',
  instructions: `You are an expert AI Code Reviewer.
  You will be given a GitHub Pull Request info and changes.
  Give a detailed review of the PR as content, provide suggestions for improvement, and provide any fixes if possible.`,
  outputType: z.object({
    content: z.string().trim(),
    fixes: z.array(z.string().trim()).optional().nullable(),
    suggestions: z.array(z.string().trim()).optional().nullable(),
  }),
});
