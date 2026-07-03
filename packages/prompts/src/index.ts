import fs from 'fs';
import path from 'path';
import { ArticleGenerationRequest, Tone, Category, OutlineSection, OutlineResult } from '@health-content-ai/shared';

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
}

const promptsDir = path.join(__dirname, '../../..', 'knowledge');

export async function loadPrompt(id: string): Promise<string> {
  const filePath = path.join(promptsDir, `${id}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt template not found: ${id}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

export async function loadKnowledge(baseName: string): Promise<string> {
  const filePath = path.join(promptsDir, `${baseName}.md`);
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

export function buildIntentPrompt(keyword: string): string {
  return `Analyze search intent for: "${keyword}"

Output ONLY JSON:
{
  "intent": "informational" | "commercial" | "comparison" | "symptoms" | "treatment" | "how-to",
  "targetAudience": "who the content is for",
  "entities": ["key medical entities"],
  "relatedTopics": ["related health topics"]
}`;
}

export function buildOutlinePrompt(keyword: string, intentAnalysis: string): string {
  return `Create article outline for: "${keyword}"

Intent: ${intentAnalysis}

Fixed structure:
- What is it?
- Common causes
- Symptoms
- When to see a doctor
- What may help
- Key takeaway

Output ONLY JSON:
{
  "h1": "main title",
  "sections": [{"title": "section title", "subsections": ["subheading 1", "subheading 2"]}],
  "faq": [{"question": "FAQ question?", "answer": "Brief answer"}],
  "summary": "Brief summary"
}`;
}

export function buildSEOPrompt(keyword: string, article: string): string {
  return `Optimize article for SEO:

Article:
${article.substring(0, 2000)}

Output ONLY JSON:
{
  "title": "SEO title (50-60 chars)",
  "metaDescription": "Meta description (150-160 chars)",
  "slug": "URL-friendly slug",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;
}