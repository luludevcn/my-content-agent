import { NextResponse } from 'next/server';
import { ArticleGenerator, createOllamaClient } from '@health-content-ai/agents';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { keyword } = body;

    const client = createOllamaClient();
    const generator = new ArticleGenerator(client);

    const result = await generator.checkDuplicate(keyword);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Duplicate check error:', error);
    return NextResponse.json(
      { exists: false, similarArticles: [] },
      { status: 200 }
    );
  }
}
