// internal-imports
import { Document } from '../core/db/model/document.js';
import { pageIndexClient } from '../core/config/pageindex.js';

// external-imports
import fs from 'fs/promises';

export async function indexing(files) {
  await Promise.all(
    files.map(async file => {
      // get file name
      const fileName = file.split('/').pop();

      // read file buffer
      const fileBuffer = await fs.readFile(file);

      // submit document to page index for indexing
      const { doc_id } = await pageIndexClient.api.submitDocument(fileBuffer, fileName);

      // create a new document record in the database
      await Document.create({ fileName, pageIndexDocId: doc_id });

      // log into console
      console.log(`Indexing Document: ${fileName}, doc_id: ${doc_id}`);
    })
  );
}
