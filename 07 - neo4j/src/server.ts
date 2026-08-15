// internal-imports
import { createApp } from './app/express.js';
import { runNeo4jSyncWorker } from './core/bg-workers/sync-neo4j.js';

// external-imports
import http from 'http';

// function to run the server
async function runServer(): Promise<void> {
  // create http server
  const server = http.createServer(createApp());

  // promise to attach event listeners
  await new Promise<void>((resolve, reject) =>
    server.once('error', reject).once('listening', resolve).listen(process.env.PORT)
  );
}

// run the server
await runServer().catch(error => {
  console.error(error);
  process.exit(1);
});

// run the background workers
setInterval(runNeo4jSyncWorker, 60 * 1000);
