import { NextResponse } from 'next/server';
import { ArticleGenerationRequest } from '@health-content-ai/shared';
import { ArticleGenerator, createOllamaClient } from '@health-content-ai/agents';

export async function POST(request: Request) {
  try {
    const body: ArticleGenerationRequest = await request.json();
    
    const client = createOllamaClient();
    const generator = new ArticleGenerator(client);

    const result = await generator.generate(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}
