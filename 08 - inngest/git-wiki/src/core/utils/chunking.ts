import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

type File = {
  content: string;
  path: string;
};

export async function chunkFiles(files: File[], repoKey: string) {
  const documents = [];
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

  for (const file of files) {
    const chunks = await splitter.createDocuments(
      [file.content],
      [{ path: file.path, repo: repoKey }]
    );
    documents.push(...chunks);
  }

  return documents;
}
