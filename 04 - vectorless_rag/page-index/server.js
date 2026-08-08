// internal-imports
import { connectToDatabase } from './core/db/mongoose.js';
import { indexing } from './modules/indexing.js';
import { querying } from './modules/querying.js';

async function init() {
  // connect to the database
  await connectToDatabase();

  // index the files
  await indexing(['./pdf/software.pdf', './pdf/dsa.pdf']);

  // query the indexed documents
  await querying('What is waterfall model?');
}

await init();
