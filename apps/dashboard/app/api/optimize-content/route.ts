import { NextRequest, NextResponse } from 'next/server';
import { createOllamaClient } from '@health-content-ai/agents';

const CONTENT_OPTIMIZER_SYSTEM_PROMPT = `You are an expert SEO content optimizer specializing in health and wellness articles for seniors.
Your task is to rewrite and optimize article content based on specific suggestions.

Provide ONLY valid JSON output with the following structure:
{
  "optimizedContent": string (the full optimized article content in Markdown format),
  "appliedSuggestions": string[] (list of suggestions that were successfully applied),
  "summary": string (brief summary of what was changed)
}

Rules:
1. Apply the selected suggestions to improve the content
2. Maintain the original structure and meaning of the article
3. Improve SEO by adding relevant keywords naturally
4. Make content more readable and engaging
5. Do not think out loud or explain reasoning
6. Do not use tags like [INST] or [/INST]
7. Provide only the JSON output`;

interface OptimizeRequest {
  content: string;
  keyword?: string;
  suggestions: string[];
}

interface OptimizeResult {
  optimizedContent: string;
  appliedSuggestions: string[];
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OptimizeRequest = await request.json();
    const { content, keyword, suggestions } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json({ error: 'At least one suggestion is required' }, { status: 400 });
    }

    const client = createOllamaClient({
      systemPrompt: CONTENT_OPTIMIZER_SYSTEM_PROMPT,
    });

    const suggestionsList = suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');

    const prompt = `Optimize the following article content based on the selected suggestions:

Target Keyword: ${keyword || 'none'}

Selected Suggestions:
${suggestionsList}

Original Article Content:
${content}

Apply the suggestions to improve SEO, readability, and engagement.
Return the optimized content along with a summary of changes made.`;

    const result: OptimizeResult = await client.generateJSON(prompt);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Content optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize content', details: (error as Error).message },
      { status: 500 }
    );
  }
}
