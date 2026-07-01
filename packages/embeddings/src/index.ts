export interface EmbeddingConfig {
  model: string;
  maxTokens?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'BGE-M3';

export class EmbeddingClient {
  private model: string;

  constructor(config?: Partial<EmbeddingConfig>) {
    this.model = config?.model || EMBEDDING_MODEL;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    try {
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'bge-m3',
          prompt: text,
          options: {
            encoding_format: 'float',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json() as { embedding: number[] };
      return {
        embedding: data.embedding,
        text,
      };
    } catch {
      return this.fallbackEmbed(text);
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      const result = await this.embed(text);
      results.push(result);
    }
    return results;
  }

  private fallbackEmbed(text: string): EmbeddingResult {
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const embedding: number[] = [];
    for (let i = 0; i < 768; i++) {
      embedding.push(((hash * (i + 1)) % 100) / 100 - 0.5);
    }
    return { embedding, text };
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) return false;
      const data = await response.json() as { models?: { name: string }[] };
      return data.models?.some((m) => m.name.includes('bge')) ?? false;
    } catch {
      return false;
    }
  }
}

export const createEmbeddingClient = (config?: Partial<EmbeddingConfig>) => {
  return new EmbeddingClient(config);
};
