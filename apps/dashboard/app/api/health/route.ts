import { NextResponse } from 'next/server';
import { createOllamaClient } from '@health-content-ai/agents';
import { createRAGClient } from '@health-content-ai/rag';

export async function GET() {
  try {
    const ollamaClient = createOllamaClient();
    const ollamaOnline = await ollamaClient.checkHealth();

    const ragClient = createRAGClient();
    const qdrantOnline = await ragClient.checkHealth();

    return NextResponse.json({ ollamaOnline, qdrantOnline });
  } catch {
    return NextResponse.json({ ollamaOnline: false, qdrantOnline: false });
  }
}
