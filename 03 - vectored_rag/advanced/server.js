// internal-imports
import { indexing } from './modules/indexing.js';
import { querying } from './modules/querying.js';

// external-imports
import fs from 'fs/promises';

async function init() {
  await indexing(['./pdf/software.pdf', './pdf/dsa.pdf']);
  const ans = await querying('What is waterfall model?');

  // write the ans array to a JSON file for debugging purposes
  await fs.writeFile('querying_debug.json', JSON.stringify(ans, null, 2));

  // log the answer to the console
  console.log(ans.finalResponse);
}

await init();
