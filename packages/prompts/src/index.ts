import fs from 'fs';
import path from 'path';
import { ArticleGenerationRequest, Tone, Category } from '@health-content-ai/shared';

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

export function buildWriterPrompt(
  request: ArticleGenerationRequest,
  outline: string,
  ragResults: string[] = []
): string {
  const toneDescription = getToneDescription(request.tone);
  const categoryDescription = getCategoryDescription(request.category);

  let prompt = `You are an expert health content writer specializing in senior health and wellness.

Write a comprehensive, medically accurate article about: "${request.keyword}"

Target Audience: ${request.audience}
Tone: ${toneDescription}
Category: ${categoryDescription}
Target Length: ${request.length} words

Article Structure (FOLLOW THIS EXACTLY):
1. What is it? - Definition and general overview
2. Common causes - List and explain causes
3. Symptoms - Describe symptoms clearly
4. When to see a doctor - Warning signs and recommendations
5. What may help - Evidence-based treatments, remedies, and lifestyle changes
6. Key takeaway - Summary of the most important points

${outline ? `Article Outline:\n${outline}\n` : ''}

${ragResults.length > 0 ? `Related Articles (avoid repetition):\n${ragResults.join('\n')}\n` : ''}

IMPORTANT GUIDELINES:
- Use clear, accessible language suitable for seniors
- Include practical tips and actionable advice
- Cite general medical principles without making specific medical claims
- Use "may help" instead of "cures" or "treats"
- Structure content with clear headings and subheadings
- Include bullet points and numbered lists where appropriate
- Write in English only
- Do NOT include SEO meta tags, FAQ section, or schema markup - these will be added separately

Start writing the article now:`;

  return prompt;
}

export function buildIntentPrompt(keyword: string): string {
  return `Analyze the search intent for this health topic: "${keyword}"

Output ONLY a JSON object with the following structure:
{
  "intent": "informational" | "commercial" | "comparison" | "symptoms" | "treatment" | "how-to",
  "targetAudience": "who the content is for (e.g., seniors, caregivers, general audience)",
  "entities": ["list of key medical entities and concepts"],
  "relatedTopics": ["list of related health topics"]
}

Do NOT include any explanations or additional text.`;
}

export function buildOutlinePrompt(keyword: string, intentAnalysis: string): string {
  return `Create a detailed article outline for: "${keyword}"

Intent Analysis:
${intentAnalysis}

The outline MUST follow this fixed structure:
- What is it?
- Common causes
- Symptoms
- When to see a doctor
- What may help
- Key takeaway

Include H2 and H3 headings. Also include FAQ questions (5-7) and a summary.

Output ONLY a JSON object with the following structure:
{
  "h1": "main title",
  "sections": [
    {"title": "What is it?", "subsections": ["subheading 1", "subheading 2"]},
    {"title": "Common causes", "subsections": [...]},
    {"title": "Symptoms", "subsections": [...]},
    {"title": "When to see a doctor", "subsections": [...]},
    {"title": "What may help", "subsections": [...]},
    {"title": "Key takeaway", "subsections": []}
  ],
  "faq": [
    {"question": "FAQ question 1?", "answer": "Brief answer"},
    {"question": "FAQ question 2?", "answer": "Brief answer"}
  ],
  "summary": "Brief summary of the article"
}

Do NOT include any explanations or additional text.`;
}

export function buildSEOPrompt(keyword: string, article: string): string {
  return `Optimize the following article for SEO:

Article:
${article.substring(0, 3000)}

Output ONLY a JSON object with the following structure:
{
  "title": "SEO optimized title (50-60 characters)",
  "metaDescription": "Meta description (150-160 characters)",
  "slug": "URL-friendly slug in lowercase with hyphens",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Do NOT include any explanations or additional text.`;
}

export function buildMedicalReviewPrompt(article: string): string {
  return `Review the following health article for medical accuracy and safety:

Article:
${article}

Your task is to:
1. Identify any potentially misleading or inaccurate medical claims
2. Replace absolute statements with cautious language (e.g., "may help" instead of "cures")
3. Ensure recommendations are general and not specific medical advice
4. Add appropriate disclaimers where necessary

Output ONLY the revised article text. Do NOT include any explanations or additional text.`;
}

export function buildInternalLinkPrompt(keyword: string, article: string, existingArticles: string[]): string {
  return `Suggest internal links for an article about: "${keyword}"

Current article content:
${article.substring(0, 2000)}

Existing articles:
${existingArticles.join('\n')}

Output ONLY a JSON object with the following structure:
{
  "links": [
    {"title": "Article Title", "url": "/article-slug", "relevance": 0.85}
  ]
}

Do NOT include any explanations or additional text.`;
}

function getToneDescription(tone: Tone): string {
  const descriptions: Record<Tone, string> = {
    friendly: 'Warm, approachable, and supportive',
    professional: 'Expert and knowledgeable, using proper terminology',
    authoritative: 'Confident and trustworthy, citing medical principles',
    conversational: 'Casual and engaging, like a conversation',
    empathetic: 'Understanding and compassionate, acknowledging challenges'
  };
  return descriptions[tone];
}

function getCategoryDescription(category: Category): string {
  const descriptions: Record<Category, string> = {
    arthritis: 'Joint inflammation and related conditions',
    'heart-health': 'Cardiovascular health and disease prevention',
    mobility: 'Movement and physical activity',
    balance: 'Balance, stability, and fall prevention',
    nutrition: 'Diet, supplements, and healthy eating',
    exercise: 'Physical activity and fitness',
    'mental-health': 'Emotional well-being and cognitive health',
    'elderly-care': 'Caregiving and senior wellness',
    'chronic-pain': 'Long-term pain management',
    'fall-prevention': 'Preventing falls and maintaining safety'
  };
  return descriptions[category];
}
