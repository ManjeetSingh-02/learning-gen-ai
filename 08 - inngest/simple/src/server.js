// internal-imports
import { inngest, functions } from './inngest/client.js';

// external-imports
import express from 'express';
import { serve } from 'inngest/express';

const app = express();

app.use(express.json());
app.use('/api/inngest', serve({ client: inngest, functions }));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
