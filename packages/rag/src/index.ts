import { EmbeddingClient, createEmbeddingClient } from '@health-content-ai/embeddings';
import { InternalLink } from '@health-content-ai/shared';

export interface RAGConfig {
  qdrantUrl?: string;
  collectionName?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  url: string;
  category: string;
}

export interface SearchResult {
  document: Document;
  score: number;
}

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const DEFAULT_COLLECTION = 'health_articles';

export class RAGClient {
  private qdrantUrl: string;
  private collectionName: string;
  private embeddingClient: EmbeddingClient;

  constructor(config?: Partial<RAGConfig>) {
    this.qdrantUrl = config?.qdrantUrl || QDRANT_URL;
    this.collectionName = config?.collectionName || DEFAULT_COLLECTION;
    this.embeddingClient = createEmbeddingClient();
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.qdrantUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response.json();
  }

  async initCollection(): Promise<void> {
    try {
      const collections = await this.request('/collections') as { collections: { name: string }[] };
      const exists = collections.collections.some(
        (c: any) => c.name === this.collectionName
      );

      if (!exists) {
        await this.request(`/collections/${this.collectionName}`, {
          method: 'PUT',
          body: JSON.stringify({
            vectors: {
              size: 768,
              distance: 'Cosine',
            },
          }),
        });

        await this.request(`/collections/${this.collectionName}/index`, {
          method: 'PUT',
          body: JSON.stringify({
            field_name: 'title',
            field_schema: 'keyword',
          }),
        });

        await this.request(`/collections/${this.collectionName}/index`, {
          method: 'PUT',
          body: JSON.stringify({
            field_name: 'category',
            field_schema: 'keyword',
          }),
        });
      }
    } catch {
      console.warn('Qdrant initialization failed');
    }
  }

  async addDocument(document: Document): Promise<void> {
    try {
      const embeddingResult = await this.embeddingClient.embed(
        `${document.title} ${document.content.substring(0, 500)}`
      );

      await this.request(`/collections/${this.collectionName}/points`, {
        method: 'PUT',
        body: JSON.stringify({
          points: [{
            id: document.id,
            vector: embeddingResult.embedding,
            payload: {
              title: document.title,
              content: document.content,
              url: document.url,
              category: document.category,
            },
          }],
        }),
      });
    } catch {
      console.warn('Failed to add document');
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      await this.addDocument(doc);
    }
  }

  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const embeddingResult = await this.embeddingClient.embed(query);

      const results = await this.request(`/collections/${this.collectionName}/points/search`, {
        method: 'POST',
        body: JSON.stringify({
          vector: embeddingResult.embedding,
          limit,
          with_payload: true,
        }),
      }) as { result: Array<{ id: string; payload: { title?: string; content?: string; url?: string; category?: string }; score: number }> };

      return results.result.map((result) => ({
        document: {
          id: result.id as string,
          title: result.payload?.title as string,
          content: result.payload?.content as string,
          url: result.payload?.url as string,
          category: result.payload?.category as string,
        },
        score: result.score || 0,
      }));
    } catch {
      console.warn('RAG search failed');
      return [];
    }
  }

  async searchInternalLinks(keyword: string, articleContent: string): Promise<InternalLink[]> {
    const results = await this.search(`${keyword} ${articleContent.substring(0, 200)}`, 5);
    
    return results.map((result) => ({
      title: result.document.title,
      url: result.document.url,
      relevance: Math.round(result.score * 100) / 100,
    }));
  }

  async checkExistingSimilar(keyword: string, threshold: number = 0.8): Promise<SearchResult[]> {
    const results = await this.search(keyword, 3);
    return results.filter((r) => r.score >= threshold);
  }

  async getDocumentCount(): Promise<number> {
    try {
      const info = await this.request(`/collections/${this.collectionName}`) as { points_count?: number };
      return info.points_count || 0;
    } catch {
      return 0;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.request('/collections');
      return true;
    } catch {
      return false;
    }
  }
}

export const createRAGClient = (config?: Partial<RAGConfig>) => {
  return new RAGClient(config);
};
