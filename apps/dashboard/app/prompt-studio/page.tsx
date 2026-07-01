'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Play, Save, X, Copy, CheckCircle } from 'lucide-react';

const prompts = [
  {
    id: 'writer',
    name: 'Writer Prompt',
    description: 'Main prompt for content writing',
    category: 'Writing',
    content: `You are an expert health content writer specializing in senior health and wellness.

Write a comprehensive, medically accurate article about: "{{keyword}}"

Target Audience: {{audience}}
Tone: {{tone}}
Category: {{category}}
Target Length: {{length}} words

Article Structure (FOLLOW THIS EXACTLY):
1. What is it? - Definition and general overview
2. Common causes - List and explain causes
3. Symptoms - Describe symptoms clearly
4. When to see a doctor - Warning signs and recommendations
5. What may help - Evidence-based treatments, remedies, and lifestyle changes
6. Key takeaway - Summary of the most important points

IMPORTANT GUIDELINES:
- Use clear, accessible language suitable for seniors
- Include practical tips and actionable advice
- Cite general medical principles without making specific medical claims
- Use "may help" instead of "cures" or "treats"
- Structure content with clear headings and subheadings
- Include bullet points and numbered lists where appropriate
- Write in English only
- Do NOT include SEO meta tags, FAQ section, or schema markup`,
  },
  {
    id: 'outline',
    name: 'Outline Prompt',
    description: 'Prompt for generating article outlines',
    category: 'Structure',
    content: `Create a detailed article outline for: "{{keyword}}"

Intent Analysis:
{{intentAnalysis}}

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
  "sections": [...],
  "faq": [...],
  "summary": "Brief summary"
}`,
  },
  {
    id: 'seo',
    name: 'SEO Prompt',
    description: 'Prompt for SEO optimization',
    category: 'SEO',
    content: `Optimize the following article for SEO:

Article:
{{article}}

Output ONLY a JSON object with the following structure:
{
  "title": "SEO optimized title (50-60 characters)",
  "metaDescription": "Meta description (150-160 characters)",
  "slug": "URL-friendly slug",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`,
  },
];

export default function PromptStudio() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSelectPrompt = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      setSelectedPrompt(id);
      setContent(prompt.content);
      setIsEditing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Prompt Studio</h1>
        <p className="text-gray-500 mt-2">Manage and customize AI prompts without coding</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-600" />
              Available Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleSelectPrompt(prompt.id)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedPrompt === prompt.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{prompt.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{prompt.description}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {prompt.category}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-600" />
              {selectedPrompt ? prompts.find(p => p.id === selectedPrompt)?.name : 'Select a Prompt'}
            </CardTitle>
            {selectedPrompt && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={() => setIsEditing(false)}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button onClick={() => {}}>
                      <Play className="w-4 h-4 mr-2" />
                      Test
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedPrompt ? (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{prompts.find(p => p.id === selectedPrompt)?.category}</Badge>
                  <Badge variant="outline">Variables: {'{'}{'{'}keyword{'}'}{'}'}, {'{'}{'{'}audience{'}'}{'}'}, {'{'}{'{'}tone{'}'}{'}'}, {'{'}{'{'}category{'}'}{'}'}, {'{'}{'{'}length{'}'}{'}'}</Badge>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!isEditing}
                  className="min-h-[500px] font-mono text-sm"
                />
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a prompt from the list to view or edit</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
