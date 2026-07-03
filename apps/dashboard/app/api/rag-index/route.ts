import { NextResponse } from 'next/server';
import { createRAGClient } from '@health-content-ai/rag';
import { getArticles } from '@health-content-ai/database';
import fs from 'fs';
import path from 'path';

interface IndexRequest {
  source: 'database' | 'files';
}

export async function POST(request: Request) {
  try {
    const { source } = await request.json() as IndexRequest;
    const ragClient = createRAGClient();
    
    let indexedCount = 0;
    let skippedCount = 0;

    if (source === 'database') {
      const articles = await getArticles(100, 0);
      
      for (const article of articles) {
        try {
          await ragClient.addDocument({
            id: article.id,
            title: article.title,
            content: article.content,
            url: `/articles/${article.slug}`,
            category: article.category,
          });
          indexedCount++;
        } catch {
          skippedCount++;
        }
      }
    } else if (source === 'files') {
      const contentDir = path.join(process.cwd(), '../content');
      if (!fs.existsSync(contentDir)) {
        return NextResponse.json(
          { error: 'Content directory not found' },
          { status: 404 }
        );
      }

      const mdFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
      
      for (const filename of mdFiles) {
        try {
          const filePath = path.join(contentDir, filename);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          const slug = filename.replace('.md', '');
          
          let title = slug.replace(/-/g, ' ');
          let category = 'general';
          
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const titleMatch = frontmatter.match(/title:\s*["']([^"']+)["']/);
            const categoryMatch = frontmatter.match(/category:\s*["']([^"']+)["']/);
            
            if (titleMatch) title = titleMatch[1];
            if (categoryMatch) category = categoryMatch[1];
          }
          
          const body = content.replace(/^---\n([\s\S]*?)\n---\n?/, '');
          
          await ragClient.addDocument({
            id: slug,
            title,
            content: body,
            url: `/articles/${slug}`,
            category,
          });
          indexedCount++;
        } catch {
          skippedCount++;
        }
      }
    }

    const totalCount = await ragClient.getDocumentCount();

    return NextResponse.json({
      success: true,
      indexedCount,
      skippedCount,
      totalDocumentCount: totalCount,
      message: `Indexed ${indexedCount} documents (${skippedCount} skipped)`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ragClient = createRAGClient();
    const documentCount = await ragClient.getDocumentCount();
    
    const contentDir = path.join(process.cwd(), '../content');
    const hasContentDir = fs.existsSync(contentDir);
    const mdFileCount = hasContentDir 
      ? fs.readdirSync(contentDir).filter(f => f.endsWith('.md')).length 
      : 0;

    return NextResponse.json({
      documentCount,
      storageMode: ragClient.getStorageMode(),
      availableFiles: mdFileCount,
    });
  } catch (error) {
    return NextResponse.json(
      { documentCount: 0, storageMode: 'sqlite', availableFiles: 0, error: (error as Error).message },
      { status: 500 }
    );
  }
}