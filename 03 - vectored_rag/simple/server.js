// internal-imports
import { indexing } from './modules/indexing.js';
import { querying } from './modules/querying.js';

async function init() {
  await indexing(['./pdf/software.pdf', './pdf/dsa.pdf']);
  await querying('What is waterfall model?');
}

await init();
