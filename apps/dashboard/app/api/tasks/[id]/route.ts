import { NextResponse } from 'next/server';
import { getTask, cancelTask } from '@health-content-ai/database';
import { abortTask } from '@health-content-ai/agents';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

async function stopOllamaModel(): Promise<void> {
  try {
    await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Failed to stop Ollama model:', error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const task = await getTask(params.id);
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { action } = await request.json();
  
  if (action === 'cancel') {
    try {
      const task = await getTask(params.id);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      
      abortTask(params.id);
      
      await stopOllamaModel();
      
      const cancelledTask = await cancelTask(params.id);
      
      return NextResponse.json({ 
        ...cancelledTask, 
        message: 'Task cancelled successfully. Ollama model has been stopped.' 
      });
    } catch (error) {
      console.error('Failed to cancel task:', error);
      return NextResponse.json({ error: 'Failed to cancel task', details: (error as Error).message }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
