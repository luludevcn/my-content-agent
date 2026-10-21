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

export type AnalysisCategory = 
  | 'seo'
  | 'readability'
  | 'eeat'
  | 'medical'
  | 'ai-search'
  | 'conversion'
  | 'accessibility';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AnalysisIssue {
  id: string;
  category: AnalysisCategory;
  severity: Severity;
  title: string;
  description: string;
  why: string;
  impact: string;
  difficulty: Difficulty;
  estimatedScoreGain: number;
  confidence: number;
}

export interface AnalysisSuggestion {
  id: string;
  issueId: string;
  category: AnalysisCategory;
  title: string;
  description: string;
  confidence: number;
  estimatedScoreGain: number;
  difficulty: Difficulty;
  actionType: 'add' | 'modify' | 'delete' | 'rewrite';
  targetSection?: string;
}

export interface CategoryScore {
  category: AnalysisCategory;
  score: number;
  maxScore: number;
  label: string;
}

export interface AnalysisResult {
  id: string;
  articleId: string;
  articleTitle: string;
  overallScore: number;
  categoryScores: CategoryScore[];
  issues: AnalysisIssue[];
  suggestions: AnalysisSuggestion[];
  createdAt: string;
}

export interface SEORecommendation {
  title: string;
  metaDescription: string;
  slug: string;
  keywords: string[];
  schema: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

export interface OptimizeDiff {
  suggestionId: string;
  before: string;
  after: string;
  changes: string[];
  applied: boolean;
}
