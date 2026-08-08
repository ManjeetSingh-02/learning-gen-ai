// external-imports
import 'dotenv/config';

// function to get environment variables
function createEnv() {
  return {
    MONGODB_URI: String(process.env.MONGODB_URI),
    OPENAI_API_KEY: String(process.env.OPENAI_API_KEY),
    PAGEINDEX_API_KEY: String(process.env.PAGEINDEX_API_KEY),
  };
}

export const env = createEnv();
