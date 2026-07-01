import { OllamaClient } from './ollama';
import {
  buildWriterPrompt,
  buildIntentPrompt,
  buildOutlinePrompt,
  buildSEOPrompt,
  buildMedicalReviewPrompt,
  buildInternalLinkPrompt
} from '@health-content-ai/prompts';
import { RAGClient, createRAGClient } from '@health-content-ai/rag';
import { SEOAnalyzer, createSEOAnalyzer } from '@health-content-ai/seo';
import { MedicalReviewer, createMedicalReviewer } from '@health-content-ai/medical';
import {
  IntentAnalysisResult,
  OutlineResult,
  SEOData,
  InternalLink,
  ArticleGenerationRequest,
  ArticleGenerationResult,
  GenerationStep,
  Category
} from '@health-content-ai/shared';
import { generateMarkdown, formatSchema } from '@health-content-ai/markdown';

export class IntentAgent {
  private client: OllamaClient;

  constructor(client: OllamaClient) {
    this.client = client;
  }

  async analyze(keyword: string): Promise<IntentAnalysisResult> {
    const prompt = buildIntentPrompt(keyword);
    const result = await this.client.generateJSON(prompt);
    return result;
  }
}

export class RAGAgent {
  private ragClient: RAGClient;

  constructor(ragClient?: RAGClient) {
    this.ragClient = ragClient || createRAGClient();
  }

  async search(keyword: string, limit: number = 10): Promise<string[]> {
    try {
      const results = await this.ragClient.search(keyword, limit);
      return results.map((r) => r.document.title);
    } catch {
      return [];
    }
  }

  async checkSimilar(keyword: string, threshold: number = 0.8): Promise<{ exists: boolean; articles: string[] }> {
    try {
      const results = await this.ragClient.checkExistingSimilar(keyword, threshold);
      return {
        exists: results.length > 0,
        articles: results.map((r) => r.document.title),
      };
    } catch {
      return { exists: false, articles: [] };
    }
  }

  async suggestInternalLinks(keyword: string, content: string): Promise<InternalLink[]> {
    try {
      return await this.ragClient.searchInternalLinks(keyword, content);
    } catch {
      return [];
    }
  }

  async getDocumentCount(): Promise<number> {
    return this.ragClient.getDocumentCount();
  }
}

export class OutlineAgent {
  private client: OllamaClient;

  constructor(client: OllamaClient) {
    this.client = client;
  }

  async generate(keyword: string, intentAnalysis: IntentAnalysisResult): Promise<OutlineResult> {
    const prompt = buildOutlinePrompt(keyword, JSON.stringify(intentAnalysis));
    const result = await this.client.generateJSON(prompt);
    return result;
  }
}

export class WriterAgent {
  private client: OllamaClient;

  constructor(client: OllamaClient) {
    this.client = client;
  }

  async write(request: ArticleGenerationRequest, outline: OutlineResult, ragResults: string[] = []): Promise<string> {
    const outlineStr = JSON.stringify(outline, null, 2);
    const prompt = buildWriterPrompt(request, outlineStr, ragResults);
    const result = await this.client.generate(prompt);
    return result;
  }

  async writeStream(
    request: ArticleGenerationRequest,
    outline: OutlineResult,
    callback: (chunk: string) => void,
    ragResults: string[] = []
  ): Promise<void> {
    const outlineStr = JSON.stringify(outline, null, 2);
    const prompt = buildWriterPrompt(request, outlineStr, ragResults);
    await this.client.generateStream(prompt, callback);
  }
}

export class SEOAgent {
  private client: OllamaClient;
  private analyzer: SEOAnalyzer;

  constructor(client: OllamaClient) {
    this.client = client;
    this.analyzer = createSEOAnalyzer();
  }

  async optimize(keyword: string, article: string): Promise<SEOData> {
    const prompt = buildSEOPrompt(keyword, article);
    const aiResult = await this.client.generateJSON(prompt);
    
    const analyzed = this.analyzer.generateSEOData(keyword, article);
    
    return {
      title: aiResult.title || analyzed.title,
      metaDescription: aiResult.metaDescription || analyzed.metaDescription,
      slug: aiResult.slug || analyzed.slug,
      keywords: aiResult.keywords || analyzed.keywords,
    };
  }

  analyzeContent(content: string) {
    return this.analyzer.analyzeContent(content);
  }
}

export class MedicalReviewAgent {
  private client: OllamaClient;
  private reviewer: MedicalReviewer;

  constructor(client: OllamaClient) {
    this.client = client;
    this.reviewer = createMedicalReviewer();
  }

  async review(article: string): Promise<string> {
    const prompt = buildMedicalReviewPrompt(article);
    const aiResult = await this.client.generate(prompt);
    
    const reviewed = this.reviewer.review(aiResult);
    
    return reviewed.reviewedContent;
  }

  getReviewIssues(article: string) {
    return this.reviewer.review(article);
  }
}

export class InternalLinkAgent {
  private client: OllamaClient;
  private ragAgent: RAGAgent;

  constructor(client: OllamaClient, ragAgent?: RAGAgent) {
    this.client = client;
    this.ragAgent = ragAgent || new RAGAgent();
  }

  async suggest(keyword: string, article: string, existingArticles: string[]): Promise<InternalLink[]> {
    const ragLinks = await this.ragAgent.suggestInternalLinks(keyword, article);
    
    if (ragLinks.length > 0) {
      return ragLinks;
    }

    const prompt = buildInternalLinkPrompt(keyword, article, existingArticles);
    try {
      const result = await this.client.generateJSON(prompt);
      return result.links || [];
    } catch {
      return [];
    }
  }
}

export interface GenerationOptions {
  skipRAG?: boolean;
  skipMedicalReview?: boolean;
  skipSEO?: boolean;
}

export class ArticleGenerator {
  private client: OllamaClient;
  private intentAgent: IntentAgent;
  private ragAgent: RAGAgent;
  private outlineAgent: OutlineAgent;
  private writerAgent: WriterAgent;
  private seoAgent: SEOAgent;
  private medicalReviewAgent: MedicalReviewAgent;
  private internalLinkAgent: InternalLinkAgent;

  constructor(client: OllamaClient) {
    this.client = client;
    this.intentAgent = new IntentAgent(client);
    this.ragAgent = new RAGAgent();
    this.outlineAgent = new OutlineAgent(client);
    this.writerAgent = new WriterAgent(client);
    this.seoAgent = new SEOAgent(client);
    this.medicalReviewAgent = new MedicalReviewAgent(client);
    this.internalLinkAgent = new InternalLinkAgent(client, this.ragAgent);
  }

  async checkDuplicate(keyword: string): Promise<{ exists: boolean; similarArticles: string[] }> {
    const result = await this.ragAgent.checkSimilar(keyword);
    return { exists: result.exists, similarArticles: result.articles };
  }

  async generate(
    request: ArticleGenerationRequest,
    onStep?: (step: GenerationStep) => void,
    options: GenerationOptions = {}
  ): Promise<ArticleGenerationResult> {
    if (onStep) {
      onStep({ id: 'intent', name: 'Intent Analysis', status: 'running' });
    }

    const intent = await this.intentAgent.analyze(request.keyword);
    
    if (onStep) {
      onStep({ id: 'intent', name: 'Intent Analysis', status: 'completed', output: JSON.stringify(intent) });
    }

    let ragResults: string[] = [];
    if (!options.skipRAG) {
      if (onStep) {
        onStep({ id: 'rag', name: 'RAG Search', status: 'running' });
      }

      ragResults = await this.ragAgent.search(request.keyword, 10);
      
      if (onStep) {
        onStep({ id: 'rag', name: 'RAG Search', status: 'completed', output: `Found ${ragResults.length} related articles` });
      }
    }

    if (onStep) {
      onStep({ id: 'outline', name: 'Outline Generation', status: 'running' });
    }

    const outline = await this.outlineAgent.generate(request.keyword, intent);
    
    if (onStep) {
      onStep({ id: 'outline', name: 'Outline Generation', status: 'completed', output: JSON.stringify(outline) });
      onStep({ id: 'writer', name: 'Content Writing', status: 'running' });
    }

    let content = await this.writerAgent.write(request, outline, ragResults);
    
    if (onStep) {
      onStep({ id: 'writer', name: 'Content Writing', status: 'completed', output: content.substring(0, 500) + '...' });
    }

    if (!options.skipMedicalReview) {
      if (onStep) {
        onStep({ id: 'medical', name: 'Medical Review', status: 'running' });
      }

      content = await this.medicalReviewAgent.review(content);
      
      if (onStep) {
        onStep({ id: 'medical', name: 'Medical Review', status: 'completed', output: content.substring(0, 500) + '...' });
      }
    }

    if (!options.skipSEO) {
      if (onStep) {
        onStep({ id: 'seo', name: 'SEO Optimization', status: 'running' });
      }

      const seo = await this.seoAgent.optimize(request.keyword, content);
      
      if (onStep) {
        onStep({ id: 'seo', name: 'SEO Optimization', status: 'completed', output: JSON.stringify(seo) });
      }
    } else {
      const analyzed = this.seoAgent.analyzeContent(content);
      const seo: SEOData = {
        title: request.keyword,
        metaDescription: content.substring(0, 160),
        slug: request.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        keywords: [],
      };
    }

    const seo = await this.seoAgent.optimize(request.keyword, content);

    if (onStep) {
      onStep({ id: 'links', name: 'Internal Links', status: 'running' });
    }

    const internalLinks = await this.internalLinkAgent.suggest(request.keyword, content, ragResults);
    
    if (onStep) {
      onStep({ id: 'links', name: 'Internal Links', status: 'completed', output: JSON.stringify(internalLinks) });
      onStep({ id: 'publish', name: 'Markdown Export', status: 'running' });
    }

    const schema = formatSchema(seo.title, seo.metaDescription, outline.faq);

    const metadata = {
      title: outline.h1,
      metaTitle: seo.title,
      metaDescription: seo.metaDescription,
      excerpt: seo.metaDescription.substring(0, 150),
      slug: seo.slug,
      category: request.category,
      tags: seo.keywords
    };

    if (onStep) {
      onStep({ id: 'publish', name: 'Markdown Export', status: 'completed' });
    }

    return {
      metadata,
      content,
      seo,
      faq: outline.faq,
      internalLinks,
      schema
    };
  }
}
