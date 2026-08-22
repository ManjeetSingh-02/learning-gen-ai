// internal-imports
import { inngest } from '../lib/inngest.js';
import { githubPullRequestReview } from './inngest/github-pr-review.js';

// external-imports
import express from 'express';
import { serve } from 'inngest/express';

// function to create application
export function createApp() {
  // create express application
  const app = express();

  // attach middlewares
  app.use(express.json()).use(express.urlencoded({ extended: true }));

  // attach routes
  app
    .use('/api/inngest', serve({ client: inngest, functions: [githubPullRequestReview] }))
    .post('/webhook/github', async (req, res) => {
      // check if the request is a pull request opened event
      if (req.body.pull_request && req.body.action === 'opened')
        await inngest.send({
          name: 'github/pullrequest.review',
          data: {
            owner: req.body.repository.owner.login,
            pull_number: req.body.pull_request.number,
            repo: req.body.repository.name,
          },
        });

      // return a 200 response
      return res.status(200);
    });

  return app;
}
