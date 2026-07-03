import { NextResponse } from 'next/server';
import { getArticles, getArticleCount } from '@health-content-ai/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const articles = await getArticles(limit, offset);
    const count = await getArticleCount();
    
    return NextResponse.json({ articles, count });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
