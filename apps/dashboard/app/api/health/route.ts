import { NextResponse } from 'next/server';
import { createOllamaClient } from '@health-content-ai/agents';
import { createRAGClient } from '@health-content-ai/rag';
import { createEmbeddingClient } from '@health-content-ai/embeddings';

export async function GET() {
  try {
    const ollamaClient = createOllamaClient();
    const ollamaOnline = await ollamaClient.checkHealth();

    const ragClient = createRAGClient();
    const vectorDbOnline = await ragClient.checkHealth();
    const documentCount = await ragClient.getDocumentCount();
    const storageMode = ragClient.getStorageMode();

    const embeddingClient = createEmbeddingClient();
    const embeddingModelAvailable = await embeddingClient.checkHealth();

    return NextResponse.json({ 
      ollamaOnline, 
      vectorDbOnline,
      storageMode,
      documentCount,
      embeddingModelAvailable,
      collectionName: process.env.QDRANT_COLLECTION_NAME || 'health_articles',
    });
  } catch (error) {
    return NextResponse.json({ 
      ollamaOnline: false, 
      vectorDbOnline: false,
      storageMode: 'sqlite',
      documentCount: 0,
      embeddingModelAvailable: false,
      error: (error as Error).message 
    });
  }
}
