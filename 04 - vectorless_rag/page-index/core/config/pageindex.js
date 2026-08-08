// internal-imports
import { env } from './env.js';

// external-imports
import { PageIndexClient } from '@pageindex/sdk';

// create an instance of the PageIndex client
export const pageIndexClient = new PageIndexClient({ apiKey: env.PAGEINDEX_API_KEY });
