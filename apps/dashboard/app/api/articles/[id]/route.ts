import { NextResponse } from 'next/server';
import { getArticleById } from '@health-content-ai/database';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await getArticleById(params.id);
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}
