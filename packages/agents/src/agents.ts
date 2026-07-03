import { OllamaClient } from './ollama';
import {
  buildIntentPrompt,
  buildOutlinePrompt,
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
  OutlineSection
} from '@health-content-ai/shared';
import { formatSchema } from '@health-content-ai/markdown';

export interface SectionContent {
  title: string;
  content: string;
  reviewed: boolean;
}

export class IntentAgent {
  // 使用规则映射替代LLM调用，节省一次完整的LLM调用
  analyze(keyword: string): IntentAnalysisResult {
    const lowerKeyword = keyword.toLowerCase();
    
    let intent: IntentAnalysisResult['intent'] = 'informational';
    
    // 规则映射
    if (lowerKeyword.includes('how to') || lowerKeyword.includes('how do')) {
      intent = 'how-to';
    } else if (lowerKeyword.includes(' vs ') || lowerKeyword.includes('compared to')) {
      intent = 'comparison';
    } else if (lowerKeyword.includes('symptom') || lowerKeyword.includes('symptoms')) {
      intent = 'symptoms';
    } else if (lowerKeyword.includes('treatment') || lowerKeyword.includes('treat')) {
      intent = 'treatment';
    } else if (lowerKeyword.includes('buy') || lowerKeyword.includes('best') || 
               lowerKeyword.includes('review') || lowerKeyword.includes('product')) {
      intent = 'commercial';
    }

    // 提取实体和相关主题（简化版）
    const entities = this.extractEntities(keyword);
    const relatedTopics = this.extractRelatedTopics(keyword, intent);

    return {
      intent,
      targetAudience: 'seniors and caregivers',
      entities,
      relatedTopics,
    };
  }

  private extractEntities(keyword: string): string[] {
    const healthEntities = [
      'arthritis', 'joint pain', 'heart health', 'blood pressure', 'hypertension',
      'diabetes', 'fall prevention', 'balance', 'mobility', 'exercise',
      'nutrition', 'diet', 'chronic pain', 'mental health', 'memory',
      'sleep', 'anxiety', 'depression', 'osteoporosis', 'vitamin',
      'supplement', 'medication', 'caregiver', 'elderly', 'senior'
    ];
    return healthEntities.filter(entity => 
      keyword.toLowerCase().includes(entity.toLowerCase())
    );
  }

  private extractRelatedTopics(keyword: string, intent: string): string[] {
    const relatedMap: Record<string, string[]> = {
      'how-to': ['tips', 'guide', 'steps', 'exercises'],
      'symptoms': ['causes', 'diagnosis', 'warning signs'],
      'treatment': ['medications', 'therapy', 'lifestyle changes'],
      'comparison': ['benefits', 'side effects', 'differences'],
      'commercial': ['reviews', 'products', 'best'],
      'informational': ['overview', 'facts', 'research'],
    };
    return relatedMap[intent] || ['overview', 'tips'];
  }
}

export class RAGAgent {
  private ragClient: RAGClient;

  constructor(ragClient?: RAGClient) {
    this.ragClient = ragClient || createRAGClient();
  }

  async search(keyword: string, limit: number = 5): Promise<string[]> {
    try {
      const isHealthy = await this.ragClient.checkHealth();
      if (!isHealthy) {
        console.warn('RAG Client not healthy - Qdrant may not be running');
        return [];
      }
      const docCount = await this.ragClient.getDocumentCount();
      if (docCount === 0) {
        console.warn('RAG collection is empty - no documents to search');
        return [];
      }
      const results = await this.ragClient.search(keyword, limit);
      return results.map((r) => r.document.title);
    } catch (error) {
      console.error('RAG search error:', error);
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

  async generate(keyword: string, intentAnalysis: IntentAnalysisResult, signal?: AbortSignal): Promise<OutlineResult> {
    const prompt = buildOutlinePrompt(keyword, JSON.stringify(intentAnalysis));
    const result = await this.client.generateJSON(prompt, undefined, signal);
    return result;
  }
}

export class ArticleWriterAgent {
  private client: OllamaClient;

  constructor(client: OllamaClient) {
    this.client = client;
  }

  async writeFullArticle(
    request: ArticleGenerationRequest,
    outline: OutlineResult,
    ragResults: string[] = [],
    signal?: AbortSignal
  ): Promise<string> {
    const toneDescription = {
      friendly: 'Warm, approachable, supportive',
      professional: 'Expert, knowledgeable, proper terminology',
      authoritative: 'Confident, trustworthy, citing medical principles',
      conversational: 'Casual, engaging, like a conversation',
      empathetic: 'Understanding, compassionate, acknowledging challenges'
    }[request.tone];

    const sectionsText = outline.sections.map(s => 
      s.subsections && s.subsections.length > 0 
        ? `- ${s.title}\n  - ${s.subsections.join('\n  - ')}`
        : `- ${s.title}`
    ).join('\n');

    const prompt = `Write a comprehensive health article about "${request.keyword}".

Audience: ${request.audience}
Tone: ${toneDescription}

Structure (follow this exactly):
${sectionsText}

Requirements:
- Write in English only
- Use Markdown format with proper headings (## for sections, ### for subsections)
- Approximately ${request.length} words total
- Use cautious language: "may help" instead of "cures" or "treats"
- Include practical tips and actionable advice
- Target reading level: Grade 6 (simple, clear sentences)
- Do not use AI phrases like "As an AI" or "I cannot provide medical advice"

${ragResults.length > 0 ? `Related articles for reference:\n${ragResults.join('\n')}` : ''}

Start with a compelling introduction and end with key takeaways.
Do NOT include a table of contents or summary section.`;

    const result = await this.client.generate(prompt, undefined, signal);
    return result.trim();
  }
}

export class SEOAgent {
  private analyzer: SEOAnalyzer;

  constructor() {
    this.analyzer = createSEOAnalyzer();
  }

  optimize(keyword: string, article: string): SEOData {
    // 使用本地SEOAnalyzer，完全移除LLM调用
    return this.analyzer.generateSEOData(keyword, article);
  }

  analyzeContent(content: string) {
    return this.analyzer.analyzeContent(content);
  }
}

export class LocalMedicalChecker {
  private reviewer: MedicalReviewer;

  constructor() {
    this.reviewer = createMedicalReviewer();
  }

  check(content: string): string {
    const result = this.reviewer.review(content);
    return result.reviewedContent;
  }

  getIssues(content: string) {
    return this.reviewer.review(content);
  }
}

export class LocalInternalLinker {
  private ragAgent: RAGAgent;

  constructor(ragAgent?: RAGAgent) {
    this.ragAgent = ragAgent || new RAGAgent();
  }

  // 复用初始RAG搜索结果，避免重复embedding+搜索
  async suggest(keyword: string, article: string, existingResults?: string[]): Promise<InternalLink[]> {
    if (existingResults && existingResults.length > 0) {
      // 直接使用已有结果，无需再次搜索
      return existingResults.map((title, index) => ({
        title,
        url: `/articles/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        relevance: Math.round((1 - index * 0.15) * 100) / 100,
      }));
    }
    return await this.ragAgent.suggestInternalLinks(keyword, article);
  }
}

export interface GenerationOptions {
  skipRAG?: boolean;
  skipMedicalCheck?: boolean;
  skipSEO?: boolean;
  signal?: AbortSignal;
}

export class ArticleGenerator {
  private client: OllamaClient;
  private intentAgent: IntentAgent;
  private ragAgent: RAGAgent;
  private outlineAgent: OutlineAgent;
  private writerAgent: ArticleWriterAgent;
  private seoAgent: SEOAgent;
  private medicalChecker: LocalMedicalChecker;
  private internalLinker: LocalInternalLinker;

  constructor(client: OllamaClient) {
    this.client = client;
    this.intentAgent = new IntentAgent(); // 不再需要client参数
    this.ragAgent = new RAGAgent();
    this.outlineAgent = new OutlineAgent(client);
    this.writerAgent = new ArticleWriterAgent(client);
    this.seoAgent = new SEOAgent(); // 不再需要client参数
    this.medicalChecker = new LocalMedicalChecker();
    this.internalLinker = new LocalInternalLinker(this.ragAgent);
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
      onStep({ id: 'rag', name: 'RAG Search', status: 'running' });
    }

    const intent = this.intentAgent.analyze(request.keyword);
    
    let ragResults: string[] = [];
    let ragStatus: 'completed' | 'failed' = 'completed';
    let ragOutput = '';
    
    if (!options.skipRAG) {
      try {
        ragResults = await this.ragAgent.search(request.keyword, 5);
        ragOutput = ragResults.length > 0 
          ? `Found ${ragResults.length} related articles` 
          : 'No related articles found (collection may be empty or Qdrant not running)';
      } catch (error) {
        ragStatus = 'failed';
        ragOutput = `RAG search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else {
      ragOutput = 'RAG search skipped';
    }

    if (onStep) {
      onStep({ id: 'intent', name: 'Intent Analysis', status: 'completed', output: JSON.stringify(intent) });
      onStep({ id: 'rag', name: 'RAG Search', status: ragStatus, output: ragOutput });
    }

    if (onStep) {
      onStep({ id: 'outline', name: 'Outline Generation', status: 'running' });
    }

    const outline = await this.outlineAgent.generate(request.keyword, intent, options.signal);
    
    if (onStep) {
      onStep({ id: 'outline', name: 'Outline Generation', status: 'completed', output: JSON.stringify(outline) });
    }

    if (onStep) {
      onStep({ id: 'write', name: 'Article Writing', status: 'running' });
    }

    let articleContent = await this.writerAgent.writeFullArticle(request, outline, ragResults, options.signal);

    if (onStep) {
      const preview = articleContent.length > 200 ? articleContent.substring(0, 200) + '...' : articleContent;
      onStep({ id: 'write', name: 'Article Writing', status: 'completed', output: preview });
    }

    if (!options.skipMedicalCheck) {
      if (onStep) {
        onStep({ id: 'medical', name: 'Medical Check', status: 'running' });
      }

      const medicalResult = this.medicalChecker.getIssues(articleContent);
      articleContent = medicalResult.reviewedContent;

      if (onStep) {
        const issuesSummary = medicalResult.issues.length > 0
          ? `Found ${medicalResult.issues.length} issues: ${medicalResult.issues.map(i => i.explanation).join(', ')}`
          : 'No issues found';
        onStep({ id: 'medical', name: 'Medical Check', status: 'completed', output: issuesSummary });
      }
    }

    let seo: SEOData;
    
    if (!options.skipSEO) {
      if (onStep) {
        onStep({ id: 'seo', name: 'SEO Optimization', status: 'running' });
      }

      seo = await this.seoAgent.optimize(request.keyword, articleContent);
      
      if (onStep) {
        onStep({ id: 'seo', name: 'SEO Optimization', status: 'completed', output: JSON.stringify(seo) });
      }
    } else {
      const analyzed = this.seoAgent.analyzeContent(articleContent);
      seo = {
        title: request.keyword,
        metaDescription: articleContent.substring(0, 160),
        slug: request.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        keywords: [],
      };
    }

    if (onStep) {
      onStep({ id: 'links', name: 'Internal Links', status: 'running' });
    }

    // 复用初始RAG搜索结果，避免重复embedding+搜索
    const internalLinks = await this.internalLinker.suggest(request.keyword, articleContent, ragResults);
    
    if (onStep) {
      onStep({ id: 'links', name: 'Internal Links', status: 'completed', output: JSON.stringify(internalLinks) });
      onStep({ id: 'publish', name: 'Markdown Export', status: 'running' });
    }

    const schema = formatSchema(seo.title, seo.metaDescription, outline.faq || []);

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
      content: articleContent,
      seo,
      faq: outline.faq || [],
      internalLinks,
      schema
    };
  }
}