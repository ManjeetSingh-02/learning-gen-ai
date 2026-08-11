// internal-imports
import { createApp } from './app/express.js';
import { connectToDatabase } from './core/db/connect.js';

// external-imports
import http from 'http';

// function to start the server
async function startServer(): Promise<void> {
  // connect to the database
  await connectToDatabase();

  // create http server
  const server = http.createServer(createApp());

  // promise to attach event listeners
  await new Promise<void>((resolve, reject) =>
    server.once('error', reject).once('listening', resolve).listen(process.env.PORT)
  );
}

// start the server
startServer().catch(error => {
  console.error(error);
  process.exit(1);
});
