import { createOllamaClient } from '@health-content-ai/agents';
import { createEmbeddingClient } from '@health-content-ai/embeddings';
import { createRAGClient } from '@health-content-ai/rag';

async function checkServices() {
  console.log('=== Health Content AI Service Check ===\n');

  const ollamaClient = createOllamaClient();
  const ollamaOnline = await ollamaClient.checkHealth();
  console.log(`Ollama: ${ollamaOnline ? '✅ Online' : '❌ Offline'}`);

  const embeddingClient = createEmbeddingClient();
  const embeddingOnline = await embeddingClient.checkHealth();
  console.log(`Embedding Model: ${embeddingOnline ? '✅ Online' : '❌ Offline'}`);

  const ragClient = createRAGClient();
  const ragOnline = await ragClient.checkHealth();
  console.log(`Qdrant: ${ragOnline ? '✅ Online' : '❌ Offline'}`);

  if (ragOnline) {
    const count = await ragClient.getDocumentCount();
    console.log(`Qdrant Documents: ${count}`);
  }

  console.log('\n=== Check Complete ===');
}

checkServices().catch(console.error);
