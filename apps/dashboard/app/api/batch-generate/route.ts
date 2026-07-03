import { NextRequest, NextResponse } from 'next/server';
import { ArticleGenerationRequest } from '@health-content-ai/shared';
import { ArticleGenerator, createOllamaClient } from '@health-content-ai/agents';
import {
  createTask,
  updateTaskStatus,
  updateTaskProgress,
  updateTaskError,
  addTaskLog,
  createArticle,
} from '@health-content-ai/database';
import fs from 'fs';
import path from 'path';

interface BatchGenerationRequest {
  requests: ArticleGenerationRequest[];
  sequential?: boolean;
}

async function saveArticleToFile(result: any): Promise<string> {
  const markdown = `---
title: "${result.metadata.title}"
metaTitle: "${result.metadata.metaTitle}"
metaDescription: "${result.metadata.metaDescription}"
excerpt: "${result.metadata.excerpt}"
slug: "${result.metadata.slug}"
category: "${result.metadata.category}"
tags: ${JSON.stringify(result.metadata.tags)}
---

${result.content}

## FAQ

${result.faq.map((faq: any) => `### ${faq.question}\n\n${faq.answer}\n`).join('\n')}

---

*This article is for informational purposes only and should not be taken as medical advice. Always consult with a qualified healthcare professional.*
`;

  const outputDir = path.join(process.cwd(), '../content');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${result.metadata.slug}.md`);
  fs.writeFileSync(outputPath, markdown);
  return outputPath;
}

export async function POST(request: NextRequest) {
  try {
    const { requests, sequential = true } = await request.json() as BatchGenerationRequest;

    if (!requests || requests.length === 0) {
      return NextResponse.json(
        { error: 'No generation requests provided' },
        { status: 400 }
      );
    }

    const client = createOllamaClient();
    const generator = new ArticleGenerator(client);
    const results: { success: boolean; keyword: string; taskId?: string; error?: string }[] = [];

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      const task = await createTask({
        keyword: req.keyword,
        audience: req.audience,
        length: req.length,
        category: req.category,
        tone: req.tone,
      });

      await updateTaskStatus(task.id, 'running');
      await addTaskLog(task.id, 'Batch Generation', `Starting article ${i + 1}/${requests.length}: ${req.keyword}`, 'info');

      try {
        const result = await generator.generate(req);

        await updateTaskStatus(task.id, 'completed');
        await updateTaskProgress(task.id, 100);

        await createArticle(task.id, {
          title: result.metadata.title,
          slug: result.metadata.slug,
          content: result.content,
          category: result.metadata.category,
          tags: result.metadata.tags,
          metaTitle: result.metadata.metaTitle,
          metaDescription: result.metadata.metaDescription,
          excerpt: result.metadata.excerpt,
          seoTitle: result.seo.title,
          seoKeywords: result.seo.keywords,
          seoSchema: result.schema,
        });

        const filePath = await saveArticleToFile(result);
        await addTaskLog(task.id, 'Complete', `Article saved: ${filePath}`, 'info');

        results.push({ success: true, keyword: req.keyword, taskId: task.id });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Generation failed';
        
        await updateTaskError(task.id, errorMessage);
        await addTaskLog(task.id, 'Error', errorMessage, 'error');

        results.push({ success: false, keyword: req.keyword, taskId: task.id, error: errorMessage });
      }

      if (!sequential) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      total: requests.length,
      successCount,
      failureCount,
      results,
      message: `Batch generation completed: ${successCount} succeeded, ${failureCount} failed`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoints: {
      POST: '/api/batch-generate',
      description: 'Generate multiple articles in batch',
      requestFormat: {
        requests: [
          {
            keyword: 'string',
            audience: 'string',
            length: 'number',
            category: 'string',
            tone: 'string',
          },
        ],
        sequential: 'boolean (default: true)',
      },
      responseFormat: {
        success: 'boolean',
        total: 'number',
        successCount: 'number',
        failureCount: 'number',
        results: [
          {
            success: 'boolean',
            keyword: 'string',
            taskId: 'string | undefined',
            error: 'string | undefined',
          },
        ],
        message: 'string',
      },
    },
  });
}