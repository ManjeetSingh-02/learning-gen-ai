// external-imports
import { MemoryClient } from 'mem0ai';

// mem0ai instance
export const mem0ai = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY ?? 'your-api-key-here',
});
