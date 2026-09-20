// internal-imports
import { indexRepo } from '../core/inngest/index-repo.js';
import { queryRepo } from '../core/inngest/query-repo.js';
import { inngest } from '../core/lib/inngest.js';

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
  app.use('/api/inngest', serve({ client: inngest, functions: [indexRepo, queryRepo] }));

  app.post('/api/index', async (req, res) => {
    await inngest.send({ name: 'repo/index', data: req.body });
    return res.status(200).json({ message: 'Indexing started' });
  });

  app.post('/api/query', async (req, res) => {
    await inngest.send({ name: 'repo/query', data: req.body });
    return res.status(200).json({ message: 'Query started' });
  });

  // return the application
  return app;
}
