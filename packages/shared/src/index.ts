export type SearchIntent = 
  | 'informational'
  | 'commercial'
  | 'comparison'
  | 'symptoms'
  | 'treatment'
  | 'how-to';

export type Tone = 
  | 'friendly'
  | 'professional'
  | 'authoritative'
  | 'conversational'
  | 'empathetic';

export type Category = 
  | 'arthritis'
  | 'heart-health'
  | 'mobility'
  | 'balance'
  | 'nutrition'
  | 'exercise'
  | 'mental-health'
  | 'elderly-care'
  | 'chronic-pain'
  | 'fall-prevention';

export interface IntentAnalysisResult {
  intent: SearchIntent;
  targetAudience: string;
  entities: string[];
  relatedTopics: string[];
}

export interface OutlineSection {
  title: string;
  subsections?: string[];
}

export interface OutlineResult {
  h1: string;
  sections: OutlineSection[];
  faq: { question: string; answer: string }[];
  summary: string;
}

export interface SEOData {
  title: string;
  metaDescription: string;
  slug: string;
  keywords: string[];
}

export interface InternalLink {
  title: string;
  url: string;
  relevance: number;
}

export interface ArticleMetadata {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  slug: string;
  category: Category;
  tags: string[];
}

export interface ArticleGenerationRequest {
  keyword: string;
  audience: string;
  length: number;
  category: Category;
  tone: Tone;
}

export interface ArticleGenerationResult {
  metadata: ArticleMetadata;
  content: string;
  seo: SEOData;
  faq: { question: string; answer: string }[];
  internalLinks: InternalLink[];
  schema: string;
}

export interface GenerationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  icon?: any;
}
