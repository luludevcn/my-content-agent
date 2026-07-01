import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createRAGClient, Document } from '@health-content-ai/rag';

async function importArticles() {
  const contentDir = path.join(__dirname, '../content');
  const ragClient = createRAGClient();

  await ragClient.initCollection();

  if (!fs.existsSync(contentDir)) {
    console.log('Content directory not found');
    return;
  }

  const files = fs.readdirSync(contentDir).filter((file) => file.endsWith('.md'));
  const documents: Document[] = [];

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = matter(content);

    documents.push({
      id: file.replace('.md', ''),
      title: result.data.title || file.replace('.md', '').replace(/-/g, ' '),
      content: result.content,
      url: `/articles/${file.replace('.md', '')}`,
      category: result.data.category || 'general',
    });
  }

  console.log(`Found ${documents.length} articles to import`);

  for (const doc of documents) {
    console.log(`Importing: ${doc.title}`);
    await ragClient.addDocument(doc);
  }

  const count = await ragClient.getDocumentCount();
  console.log(`Import completed. Total documents in Qdrant: ${count}`);
}

importArticles().catch(console.error);
