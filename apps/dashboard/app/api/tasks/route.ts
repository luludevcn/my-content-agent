import { NextResponse } from 'next/server';
import { getTasks, getTaskCount } from '@health-content-ai/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const tasks = await getTasks(status || undefined);
    const count = await getTaskCount(status || undefined);
    
    return NextResponse.json({ tasks, count });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks', details: (error as Error).message }, { status: 500 });
  }
}