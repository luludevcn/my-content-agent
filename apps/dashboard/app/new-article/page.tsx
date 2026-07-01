'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  FileText,
  Search,
  ArrowRight,
} from 'lucide-react';
import { ArticleGenerationRequest, Category, Tone } from '@health-content-ai/shared';

const categories: { value: Category; label: string }[] = [
  { value: 'arthritis', label: 'Arthritis' },
  { value: 'heart-health', label: 'Heart Health' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'balance', label: 'Balance' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'mental-health', label: 'Mental Health' },
  { value: 'elderly-care', label: 'Elderly Care' },
  { value: 'chronic-pain', label: 'Chronic Pain' },
  { value: 'fall-prevention', label: 'Fall Prevention' },
];

const tones: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'empathetic', label: 'Empathetic' },
];

const audiences = ['Seniors', 'Caregivers', 'General Audience', 'Healthcare Providers'];
const lengths = [1500, 2000, 3000];

const steps = [
  { id: 'intent', name: 'Intent Analysis' },
  { id: 'rag', name: 'RAG Search' },
  { id: 'outline', name: 'Outline' },
  { id: 'writer', name: 'Writer' },
  { id: 'seo', name: 'SEO' },
  { id: 'medical', name: 'Medical Review' },
  { id: 'links', name: 'Internal Links' },
  { id: 'publish', name: 'Markdown Export' },
];

export default function NewArticle() {
  const [keyword, setKeyword] = useState('');
  const [audience, setAudience] = useState('Seniors');
  const [length, setLength] = useState(2000);
  const [category, setCategory] = useState<Category>('mobility');
  const [tone, setTone] = useState<Tone>('friendly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepStatus, setStepStatus] = useState<Record<string, 'pending' | 'running' | 'completed' | 'failed'>>({});
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleKeywordChange = async (value: string) => {
    setKeyword(value);
    if (value.length >= 3) {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: value }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } else {
      setSuggestions([]);
    }
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) return;

    setIsGenerating(true);
    setResult(null);
    setStepStatus(steps.reduce((acc, step) => ({ ...acc, [step.id]: 'pending' }), {}));

    const request: ArticleGenerationRequest = {
      keyword: keyword.trim(),
      audience,
      length,
      category,
      tone,
    };

    try {
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunks = decoder.decode(value).split('\n').filter(Boolean);
        for (const chunk of chunks) {
          try {
            const data = JSON.parse(chunk.replace('data: ', ''));
            if (data.type === 'step') {
              setStepStatus(prev => ({
                ...prev,
                [data.stepId]: data.status as 'pending' | 'running' | 'completed' | 'failed',
              }));
            } else if (data.type === 'result') {
              setResult(data.data);
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch {
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const markdown = `---
title: "${result.metadata.title}"
metaTitle: "${result.seo.title}"
metaDescription: "${result.seo.metaDescription}"
excerpt: "${result.metadata.excerpt}"
slug: "${result.seo.slug}"
category: "${result.metadata.category}"
tags: ${JSON.stringify(result.seo.keywords)}
---

${result.content}

## FAQ

${result.faq?.map((faq: any) => `### ${faq.question}\n\n${faq.answer}\n`).join('\n') || ''}

---

*This article is for informational purposes only and should not be taken as medical advice. Always consult with a qualified healthcare professional.*`;

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedSteps = Object.values(stepStatus).filter(s => s === 'completed').length;
  const progress = isGenerating ? (completedSteps / steps.length) * 100 : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Article</h1>
        <p className="text-gray-500 mt-2">Generate high-quality health content with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Article Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  placeholder="e.g., Why Does Knee Pain Get Worse at Night?"
                  className="pl-10"
                />
              </div>
              {suggestions.length > 0 && (
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setKeyword(suggestion);
                        setSuggestions([]);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                      <ArrowRight className="inline w-3 h-3 mr-2" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="">Select audience</option>
                {audiences.map((aud) => (
                  <option key={aud} value={aud}>
                    {aud}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                <option value="">Select tone</option>
                {tones.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Length</Label>
              <div className="flex gap-2">
                {lengths.map((len) => (
                  <button
                    key={len}
                    onClick={() => setLength(len)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      length === len
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {len} words
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || !keyword.trim()} className="w-full">
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Article'}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {isGenerating ? 'Generation Progress' : 'Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="text-sm text-gray-500">
                  {completedSteps}/{steps.length} steps completed
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        stepStatus[step.id] === 'completed'
                          ? 'bg-green-50 text-green-700'
                          : stepStatus[step.id] === 'running'
                          ? 'bg-blue-50 text-blue-700'
                          : stepStatus[step.id] === 'failed'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {stepStatus[step.id] === 'completed' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : stepStatus[step.id] === 'running' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : stepStatus[step.id] === 'failed' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : null}
                      <span className="text-xs font-medium">{step.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : result ? (
              <Tabs defaultValue="preview">
                <TabsList className="mb-4">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="faq">FAQ</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="space-y-4">
                  <h2 className="text-xl font-bold">{result.metadata.title}</h2>
                  <p className="text-gray-500">{result.seo.metaDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{result.metadata.category}</Badge>
                    {result.seo.keywords?.map((kw: string) => (
                      <Badge key={kw} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: result.content }} />
                  {result.internalLinks?.length > 0 && (
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-700 mb-2">Internal Links</h3>
                      <div className="space-y-1">
                        {result.internalLinks.map((link: any) => (
                          <div key={link.url} className="flex items-center justify-between text-sm">
                            <span className="text-blue-600 hover:underline">{link.title}</span>
                            <span className="text-gray-400">{(link.relevance * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="markdown">
                  <Textarea
                    className="min-h-[400px] font-mono text-xs"
                    readOnly
                    value={`---
title: "${result.metadata.title}"
metaTitle: "${result.seo.title}"
metaDescription: "${result.seo.metaDescription}"
excerpt: "${result.metadata.excerpt}"
slug: "${result.seo.slug}"
category: "${result.metadata.category}"
tags: ${JSON.stringify(result.seo.keywords)}
---

${result.content}

## FAQ

${result.faq?.map((faq: any) => `### ${faq.question}\n\n${faq.answer}\n`).join('\n') || ''}

---

*This article is for informational purposes only and should not be taken as medical advice. Always consult with a qualified healthcare professional.*`}
                  />
                  <Button onClick={handleCopy} className="mt-4">
                    {copied ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div>
                    <Label>SEO Title</Label>
                    <Input readOnly value={result.seo.title} />
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <Textarea readOnly className="min-h-[100px]">{result.seo.metaDescription}</Textarea>
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input readOnly value={result.seo.slug} />
                  </div>
                  <div>
                    <Label>Keywords</Label>
                    <div className="flex flex-wrap gap-2">
                      {result.seo.keywords?.map((kw: string) => (
                        <Badge key={kw}>{kw}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Schema</Label>
                    <Textarea readOnly className="min-h-[200px] font-mono text-xs">{result.schema}</Textarea>
                  </div>
                </TabsContent>

                <TabsContent value="faq" className="space-y-4">
                  {result.faq?.map((faq: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium">{faq.question}</h3>
                      <p className="text-gray-600 mt-1">{faq.answer}</p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Enter article settings and click Generate to create content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
