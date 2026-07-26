// internal-imports
import { vectorStore } from '../utils/vector.js';

// external-imports
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

export async function indexing(files) {
  await Promise.all(
    files.map(async fp => {
      // load the PDF document using the PDFLoader
      const loader = new PDFLoader(fp);
      const docs = await loader.load();

      // add the loaded documents to the vector store
      await vectorStore.addDocuments(docs);
    })
  );
}
