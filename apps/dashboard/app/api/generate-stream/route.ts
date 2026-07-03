import { NextRequest } from 'next/server';
import { ArticleGenerationRequest } from '@health-content-ai/shared';
import { ArticleGenerator, createOllamaClient, registerTask, unregisterTask } from '@health-content-ai/agents';
import {
  createTask,
  updateTaskStatus,
  updateTaskProgress,
  updateTaskError,
  addTaskLog,
  createArticle,
  getTask,
} from '@health-content-ai/database';
import fs from 'fs';
import path from 'path';

const MAX_GENERATION_TIME_MS = 5 * 60 * 1000;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

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

async function releaseOllamaResources(model: string): Promise<void> {
  try {
    await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'DELETE',
    });
    console.log(`Released Ollama resources for model: ${model}`);
  } catch (error) {
    console.warn('Failed to release Ollama resources:', error);
  }
}

function sendEvent(type: string, data: any) {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, taskId: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Task ${taskId} timed out after ${ms / 1000} seconds`));
    }, ms);
  });
  return Promise.race([promise, timeout]);
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json() as ArticleGenerationRequest;

    const task = await createTask({
      keyword: requestBody.keyword,
      audience: requestBody.audience,
      length: requestBody.length,
      category: requestBody.category,
      tone: requestBody.tone,
    });

    await updateTaskStatus(task.id, 'running');

    const abortController = new AbortController();
    const client = createOllamaClient();
    const generator = new ArticleGenerator(client);
    
    registerTask(task.id, abortController, client.getModel());
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isCancelled = false;
        
        try {
          const result = await withTimeout(
            generator.generate(
              requestBody,
              async (step) => {
                if (isCancelled) return;
                
                const currentTask = await getTask(task.id);
                if (currentTask?.status === 'cancelled') {
                  isCancelled = true;
                  abortController.abort();
                  return;
                }

                if (isCancelled) return;

                controller.enqueue(encoder.encode(
                  sendEvent('step', {
                    stepId: step.id,
                    status: step.status,
                    name: step.name,
                    taskId: task.id,
                    output: step.output,
                  })
                ));

                if (step.status === 'running') {
                  await addTaskLog(task.id, step.name, 'Starting...', 'info');
                  controller.enqueue(encoder.encode(
                    sendEvent('log', {
                      step: step.name,
                      level: 'info',
                      message: 'Starting...',
                      timestamp: new Date().toISOString(),
                      taskId: task.id,
                    })
                  ));
                } else if (step.status === 'completed') {
                  await addTaskLog(task.id, step.name, step.output || 'Completed', 'info');
                  controller.enqueue(encoder.encode(
                    sendEvent('log', {
                      step: step.name,
                      level: 'info',
                      message: step.output || 'Completed',
                      timestamp: new Date().toISOString(),
                      taskId: task.id,
                    })
                  ));
                } else if (step.status === 'failed') {
                  await addTaskLog(task.id, step.name, step.output || 'Failed', 'error');
                  controller.enqueue(encoder.encode(
                    sendEvent('log', {
                      step: step.name,
                      level: 'error',
                      message: step.output || 'Failed',
                      timestamp: new Date().toISOString(),
                      taskId: task.id,
                    })
                  ));
                }
              },
              {
                signal: abortController.signal,
              }
            ),
            MAX_GENERATION_TIME_MS,
            task.id
          );

          if (isCancelled) return;

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

          await addTaskLog(task.id, 'Complete', 'Article saved to database', 'info');

          const filePath = await saveArticleToFile(result);
          await addTaskLog(task.id, 'Complete', `Article saved to file: ${filePath}`, 'info');

          controller.enqueue(encoder.encode(
            sendEvent('result', { data: result, taskId: task.id, filePath })
          ));

          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Generation failed';
          
          if (errorMessage.includes('cancelled') || errorMessage.includes('aborted') || errorMessage.includes('Cancelled')) {
            console.log(`Task ${task.id} was cancelled`);
            isCancelled = true;
          } else {
            console.error('generate-stream internal error:', error);
          }
          
          if (!isCancelled) {
            await updateTaskError(task.id, errorMessage);
            await addTaskLog(task.id, 'Error', errorMessage, 'error');

            controller.enqueue(encoder.encode(
              sendEvent('error', {
                message: errorMessage,
                taskId: task.id,
              })
            ));
          }
          controller.close();
        } finally {
          unregisterTask(task.id);
          try {
            await releaseOllamaResources(client.getModel());
          } catch {
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('generate-stream request error:', error);
    return new Response(
      JSON.stringify({ type: 'error', message: 'Invalid request', details: (error as Error).message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}