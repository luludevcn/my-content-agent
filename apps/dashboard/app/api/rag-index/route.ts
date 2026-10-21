import { NextResponse } from 'next/server';
import { createRAGClient } from '@health-content-ai/rag';
import { getArticles } from '@health-content-ai/database';
import fs from 'fs';
import path from 'path';

interface IndexRequest {
  source: 'database' | 'files';
  directoryPath?: string;
}

function findAllMdFiles(dir: string): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findAllMdFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

export async function POST(request: Request) {
  try {
    const { source, directoryPath } = await request.json() as IndexRequest;
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
      const contentDir = directoryPath || path.join(process.cwd(), '../content');
      
      if (!fs.existsSync(contentDir)) {
        return NextResponse.json(
          { error: `Directory not found: ${contentDir}` },
          { status: 404 }
        );
      }

      if (!fs.statSync(contentDir).isDirectory()) {
        return NextResponse.json(
          { error: `Path is not a directory: ${contentDir}` },
          { status: 400 }
        );
      }

      const mdFiles = findAllMdFiles(contentDir);
      
      for (const filePath of mdFiles) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          const relativePath = path.relative(contentDir, filePath);
          const slug = relativePath.replace(/\\/g, '/').replace('.md', '');
          
          let title = slug.replace(/-/g, ' ').replace(/\//g, ' - ');
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

export async function GET(request: Request) {
  try {
    const ragClient = createRAGClient();
    const documentCount = await ragClient.getDocumentCount();
    
    const searchParams = new URL(request.url).searchParams;
    const directoryPath = searchParams.get('directoryPath');
    
    const contentDir = directoryPath || path.join(process.cwd(), '../content');
    const hasContentDir = fs.existsSync(contentDir);
    const mdFileCount = hasContentDir && fs.statSync(contentDir).isDirectory()
      ? findAllMdFiles(contentDir).length
      : 0;

    return NextResponse.json({
      documentCount,
      storageMode: ragClient.getStorageMode(),
      availableFiles: mdFileCount,
      directoryPath: contentDir,
    });
  } catch (error) {
    return NextResponse.json(
      { documentCount: 0, storageMode: 'sqlite', availableFiles: 0, error: (error as Error).message },
      { status: 500 }
    );
  }
}