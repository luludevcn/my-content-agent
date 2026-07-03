import { EmbeddingClient, createEmbeddingClient } from '@health-content-ai/embeddings';
import { InternalLink } from '@health-content-ai/shared';
import {
  addRagDocument,
  getRagDocuments,
  getRagDocumentCount,
  searchRagDocuments,
} from '@health-content-ai/database';

export interface RAGConfig {
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

export class RAGClient {
  private collectionName: string;
  private embeddingClient: EmbeddingClient;

  constructor(config?: Partial<RAGConfig>) {
    this.collectionName = config?.collectionName || 'health_articles';
    this.embeddingClient = createEmbeddingClient();
  }

  async initCollection(): Promise<void> {
    try {
      const count = await getRagDocumentCount();
      console.log(`RAG collection initialized with ${count} documents`);
    } catch (error) {
      console.warn('RAG initialization failed:', error);
    }
  }

  async addDocument(document: Document): Promise<void> {
    try {
      const embeddingResult = await this.embeddingClient.embed(
        `${document.title} ${document.content.substring(0, 500)}`
      );

      await addRagDocument({
        id: document.id,
        title: document.title,
        content: document.content,
        url: document.url,
        category: document.category,
        embedding: embeddingResult.embedding,
      });
    } catch (error) {
      console.warn('Failed to add document:', error);
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
      
      if (!embeddingResult.embedding || embeddingResult.embedding.length === 0) {
        console.warn('RAG search failed: Empty embedding result');
        return [];
      }

      const results = await searchRagDocuments(embeddingResult.embedding, limit);

      return results.map((result) => ({
        document: {
          id: result.id,
          title: result.title,
          content: result.content,
          url: result.url,
          category: result.category,
        },
        score: result.score || 0,
      }));
    } catch (error) {
      console.error('RAG search failed:', error);
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
      return await getRagDocumentCount();
    } catch {
      return 0;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await getRagDocumentCount();
      return true;
    } catch {
      return false;
    }
  }

  getStorageMode(): 'sqlite' {
    return 'sqlite';
  }
}

export const createRAGClient = (config?: Partial<RAGConfig>) => {
  return new RAGClient(config);
};