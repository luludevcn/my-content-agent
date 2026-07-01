import { NextRequest } from 'next/server';
import { ArticleGenerationRequest } from '@health-content-ai/shared';
import { ArticleGenerator, createOllamaClient } from '@health-content-ai/agents';

function sendEvent(type: string, data: any) {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json() as ArticleGenerationRequest;

    const client = createOllamaClient();
    const generator = new ArticleGenerator(client);
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await generator.generate(
            requestBody,
            (step) => {
              controller.enqueue(encoder.encode(
                sendEvent('step', {
                  stepId: step.id,
                  status: step.status,
                  name: step.name,
                })
              ));
            }
          );

          controller.enqueue(encoder.encode(
            sendEvent('result', { data: result })
          ));

          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(
            sendEvent('error', {
              message: error instanceof Error ? error.message : 'Generation failed',
            })
          ));
          controller.close();
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
    return new Response(
      JSON.stringify({ type: 'error', message: 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
