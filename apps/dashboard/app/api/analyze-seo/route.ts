import { NextRequest, NextResponse } from 'next/server';
import { createOllamaClient } from '@health-content-ai/agents';
import { AnalysisResult, AnalysisIssue, AnalysisSuggestion, CategoryScore, AnalysisCategory, Severity, Difficulty } from '@health-content-ai/shared';

const CATEGORY_LABELS: Record<AnalysisCategory, string> = {
  seo: 'SEO',
  readability: 'Readability',
  eeat: 'EEAT',
  medical: 'Medical Accuracy',
  'ai-search': 'AI Search',
  conversion: 'Conversion',
  accessibility: 'Accessibility',
};

const SEO_AGENT_PROMPT = `You are an expert SEO analyst specializing in health and wellness articles.
Analyze the article for SEO issues and provide suggestions.

Return ONLY valid JSON with this structure:
{
  "score": number (0-100),
  "issues": [{
    "id": string,
    "category": "seo",
    "severity": "critical"|"high"|"medium"|"low",
    "title": string,
    "description": string,
    "why": string,
    "impact": string,
    "difficulty": "easy"|"medium"|"hard",
    "estimatedScoreGain": number,
    "confidence": number (0-1)
  }],
  "suggestions": [{
    "id": string,
    "issueId": string,
    "category": "seo",
    "title": string,
    "description": string,
    "confidence": number (0-1),
    "estimatedScoreGain": number,
    "difficulty": "easy"|"medium"|"hard",
    "actionType": "add"|"modify"|"delete"|"rewrite",
    "targetSection": string
  }]
}

Common SEO issues to check:
- Missing or weak title tag
- Meta description too short/long
- Lack of keyword usage
- Missing H1 tag
- Too many or too few headings
- No internal links
- No external links
- Image alt text missing
- Content length issues
- Keyword stuffing

Provide specific, actionable suggestions.`;

const READABILITY_AGENT_PROMPT = `You are an expert content readability analyst.
Analyze the article for readability issues and provide suggestions.

Return ONLY valid JSON with this structure:
{
  "score": number (0-100),
  "issues": [{
    "id": string,
    "category": "readability",
    "severity": "critical"|"high"|"medium"|"low",
    "title": string,
    "description": string,
    "why": string,
    "impact": string,
    "difficulty": "easy"|"medium"|"hard",
    "estimatedScoreGain": number,
    "confidence": number (0-1)
  }],
  "suggestions": [{
    "id": string,
    "issueId": string,
    "category": "readability",
    "title": string,
    "description": string,
    "confidence": number (0-1),
    "estimatedScoreGain": number,
    "difficulty": "easy"|"medium"|"hard",
    "actionType": "add"|"modify"|"delete"|"rewrite",
    "targetSection": string
  }]
}

Common readability issues to check:
- Long sentences
- Complex words
- Passive voice
- Reading level too high
- Lack of paragraphs
- No bullet points
- Dense text blocks
- Jargon overload

Provide specific, actionable suggestions.`;

const EEAT_AGENT_PROMPT = `You are an expert EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) analyst specializing in health content.
Analyze the article for EEAT issues and provide suggestions.

Return ONLY valid JSON with this structure:
{
  "score": number (0-100),
  "issues": [{
    "id": string,
    "category": "eeat",
    "severity": "critical"|"high"|"medium"|"low",
    "title": string,
    "description": string,
    "why": string,
    "impact": string,
    "difficulty": "easy"|"medium"|"hard",
    "estimatedScoreGain": number,
    "confidence": number (0-1)
  }],
  "suggestions": [{
    "id": string,
    "issueId": string,
    "category": "eeat",
    "title": string,
    "description": string,
    "confidence": number (0-1),
    "estimatedScoreGain": number,
    "difficulty": "easy"|"medium"|"hard",
    "actionType": "add"|"modify"|"delete"|"rewrite",
    "targetSection": string
  }]
}

Common EEAT issues to check:
- No author bio or credentials
- No references/citations
- No date or update date
- No about page link
- No expertise indicators
- No testimonials or reviews
- No trust signals

Provide specific, actionable suggestions.`;

const MEDICAL_AGENT_PROMPT = `You are an expert medical content reviewer specializing in senior health.
Analyze the article for medical accuracy issues and provide suggestions.

Return ONLY valid JSON with this structure:
{
  "score": number (0-100),
  "issues": [{
    "id": string,
    "category": "medical",
    "severity": "critical"|"high"|"medium"|"low",
    "title": string,
    "description": string,
    "why": string,
    "impact": string,
    "difficulty": "easy"|"medium"|"hard",
    "estimatedScoreGain": number,
    "confidence": number (0-1)
  }],
  "suggestions": [{
    "id": string,
    "issueId": string,
    "category": "medical",
    "title": string,
    "description": string,
    "confidence": number (0-1),
    "estimatedScoreGain": number,
    "difficulty": "easy"|"medium"|"hard",
    "actionType": "add"|"modify"|"delete"|"rewrite",
    "targetSection": string
  }]
}

Common medical issues to check:
- Absolute statements (cures, treats)
- Missing disclaimers
- Inaccurate medical claims
- Outdated information
- Missing "consult your doctor" warnings
- Dangerous advice
- Unsubstantiated claims

Provide specific, actionable suggestions.`;

interface AgentResult {
  score: number;
  issues: AnalysisIssue[];
  suggestions: AnalysisSuggestion[];
}

async function runAgent(client: any, systemPrompt: string, prompt: string): Promise<AgentResult> {
  try {
    const result = await client.generateJSON(prompt, systemPrompt);
    return {
      score: result.score || 0,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error('Agent error:', error);
    return {
      score: 0,
      issues: [],
      suggestions: [],
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, title, content, keyword } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const client = createOllamaClient();

    const agents = [
      { category: 'seo' as AnalysisCategory, prompt: SEO_AGENT_PROMPT, label: 'SEO' },
      { category: 'readability' as AnalysisCategory, prompt: READABILITY_AGENT_PROMPT, label: 'Readability' },
      { category: 'eeat' as AnalysisCategory, prompt: EEAT_AGENT_PROMPT, label: 'EEAT' },
      { category: 'medical' as AnalysisCategory, prompt: MEDICAL_AGENT_PROMPT, label: 'Medical' },
    ];

    const agentResults: Record<AnalysisCategory, AgentResult> = {} as Record<AnalysisCategory, AgentResult>;
    const allIssues: AnalysisIssue[] = [];
    const allSuggestions: AnalysisSuggestion[] = [];

    for (const agent of agents) {
      const prompt = `Analyze the following article for ${agent.label} issues:

Target Keyword: ${keyword || 'none'}

Article Title: ${title || 'none'}

Article Content:
${content}

Provide your analysis in JSON format with the required structure.`;

      const result = await runAgent(client, agent.prompt, prompt);
      agentResults[agent.category] = result;

      result.issues.forEach(issue => {
        issue.id = `${agent.category}-${issue.id || Date.now()}`;
        allIssues.push(issue);
      });

      result.suggestions.forEach(suggestion => {
        suggestion.id = `${agent.category}-${suggestion.id || Date.now()}`;
        allSuggestions.push(suggestion);
      });
    }

    const categoryScores: CategoryScore[] = agents.map(agent => ({
      category: agent.category,
      score: agentResults[agent.category]?.score || 0,
      maxScore: 100,
      label: CATEGORY_LABELS[agent.category],
    }));

    const weights: Record<AnalysisCategory, number> = {
      seo: 0.2,
      readability: 0.15,
      eeat: 0.2,
      medical: 0.25,
      'ai-search': 0.1,
      conversion: 0.05,
      accessibility: 0.05,
    };

    const overallScore = Math.round(categoryScores.reduce((sum, cs) => {
      return sum + (cs.score * (weights[cs.category] || 0.14));
    }, 0));

    const analysisId = `analysis-${Date.now()}`;

    const finalResult: AnalysisResult = {
      id: analysisId,
      articleId: articleId || '',
      articleTitle: title || '',
      overallScore,
      categoryScores,
      issues: allIssues,
      suggestions: allSuggestions,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error('SEO analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content', details: (error as Error).message },
      { status: 500 }
    );
  }
}
