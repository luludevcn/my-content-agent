'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Circle,
  Copy,
  FileText,
  Search,
  ArrowRight,
  X,
  Play,
  Clock,
  Trash2,
  ChevronRight,
  ScrollText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ArticleGenerationRequest, Category, Tone } from '@health-content-ai/shared';

interface Task {
  id: string;
  keyword: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  audience: string;
  length: number;
  category: string;
  tone: string;
  progress: number;
  error?: string;
  createdAt: string;
  logs?: Array<{
    id: string;
    step: string;
    message: string;
    level: string;
    timestamp: string;
  }>;
}

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

const initialSteps = [
  { id: 'intent', name: 'Intent Analysis' },
  { id: 'rag', name: 'RAG Search' },
  { id: 'outline', name: 'Outline Generation' },
  { id: 'write', name: 'Article Writing' },
  { id: 'medical', name: 'Medical Check' },
  { id: 'seo', name: 'SEO Optimization' },
];

export default function NewArticle() {
  const [keyword, setKeyword] = useState('');
  const [audience, setAudience] = useState('Seniors');
  const [length, setLength] = useState(2000);
  const [category, setCategory] = useState<Category>('mobility');
  const [tone, setTone] = useState<Tone>('friendly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [stepStatus, setStepStatus] = useState<Record<string, 'pending' | 'running' | 'completed' | 'failed'>>({});
  const [currentSteps, setCurrentSteps] = useState(initialSteps);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLogs, setCurrentLogs] = useState<Array<{
    step: string;
    level: string;
    message: string;
    timestamp: string;
  }>>([]);
  const [stepResults, setStepResults] = useState<Record<string, string>>({});
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const formatJsonOutput = (output: string): string => {
    try {
      const parsed = JSON.parse(output);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return output;
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!showLogs || !selectedTask?.id) return;

    const timer = setInterval(() => {
      fetchTaskDetails(selectedTask.id);
    }, 1000);

    return () => clearInterval(timer);
  }, [showLogs, selectedTask]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchTaskDetails = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      setSelectedTask(data);
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    }
  };

  const cancelTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      await fetchTasks();
    } catch (error) {
      console.error('Failed to cancel task:', error);
    }
  };

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
    setError(null);
    setCurrentSteps(initialSteps);
    setStepStatus(initialSteps.reduce((acc, step) => ({ ...acc, [step.id]: 'pending' }), {}));

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
              if (data.taskId) {
                setCurrentTaskId(data.taskId);
              }
              setStepStatus(prev => ({
                ...prev,
                [data.stepId]: data.status as 'pending' | 'running' | 'completed' | 'failed',
              }));
              setCurrentSteps(prev => {
                const exists = prev.some(s => s.id === data.stepId);
                if (!exists) {
                  return [...prev, { id: data.stepId, name: data.name }];
                }
                return prev;
              });
              if (data.output) {
                setStepResults(prev => ({
                  ...prev,
                  [data.stepId]: data.output,
                }));
              }
            } else if (data.type === 'log') {
              setCurrentLogs(prev => [...prev, {
                step: data.step,
                level: data.level,
                message: data.message,
                timestamp: data.timestamp,
              }]);
            } else if (data.type === 'result') {
              setResult(data.data);
              if (data.taskId) {
                setCurrentTaskId(data.taskId);
              }
            } else if (data.type === 'error') {
              setError(data.message);
              throw new Error(data.message);
            }
          } catch {
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      if (!error) {
        setError('Generation failed unexpectedly');
      }
    } finally {
      setIsGenerating(false);
      await fetchTasks();
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
  const totalSteps = Object.keys(stepStatus).length || currentSteps.length;
  const progress = isGenerating ? (completedSteps / totalSteps) * 100 : 0;

  const runningTasks = tasks.filter(t => t.status === 'running');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Article</h1>
        <p className="text-gray-500 mt-2">Generate high-quality health content with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {isGenerating ? 'Generation Progress' : result ? 'Results' : 'Task Queue'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 mt-2">{error}</p>
              </div>
            )}
            {isGenerating ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    color="red"
                    size="sm"
                    onClick={() => currentTaskId && cancelTask(currentTaskId)}
                    disabled={!currentTaskId}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel Task
                  </Button>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-sm text-gray-500">
                  {completedSteps}/{totalSteps} steps completed
                </div>
                <div className="space-y-2">
                  {currentSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`rounded-lg border transition-all ${
                        stepStatus[step.id] === 'completed'
                          ? 'border-green-200 bg-green-50'
                          : stepStatus[step.id] === 'running'
                          ? 'border-blue-200 bg-blue-50'
                          : stepStatus[step.id] === 'failed'
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="w-full p-3 flex items-center gap-3 text-left"
                      >
                        {stepStatus[step.id] === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : stepStatus[step.id] === 'running' ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : stepStatus[step.id] === 'failed' ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`font-medium ${
                          stepStatus[step.id] === 'completed'
                            ? 'text-green-700'
                            : stepStatus[step.id] === 'running'
                            ? 'text-blue-700'
                            : stepStatus[step.id] === 'failed'
                            ? 'text-red-700'
                            : 'text-gray-500'
                        }`}>
                          {step.name}
                        </span>
                        {stepResults[step.id] && (
                          <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                            {expandedSteps.has(step.id) ? 'Hide' : 'View'} Result
                            {expandedSteps.has(step.id) ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </button>
                      {stepResults[step.id] && expandedSteps.has(step.id) && (
                        <div className="px-6 pb-3">
                          <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap">
                            {formatJsonOutput(stepResults[step.id])}
                          </div>
                        </div>
                      )}
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
              <div className="space-y-4">
                {runningTasks.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 mb-2">Running Tasks</h3>
                    <div className="space-y-2">
                      {runningTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-blue-50 rounded-lg"
                          onClick={() => {
                            fetchTaskDetails(task.id);
                            setShowLogs(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                              <span className="text-sm font-medium text-blue-700 truncate">{task.keyword}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelTask(task.id);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <Progress value={task.progress} className="h-1 mt-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {completedTasks.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 mb-2">Completed Tasks</h3>
                    <div className="space-y-2">
                      {completedTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-green-50 rounded-lg flex items-center justify-between"
                          onClick={() => {
                            fetchTaskDetails(task.id);
                            setShowLogs(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 truncate">{task.keyword}</span>
                          </div>
                          <Clock className="w-4 h-4 text-green-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {failedTasks.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-red-500 mb-2">Failed Tasks</h3>
                    <div className="space-y-2">
                      {failedTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-red-50 rounded-lg"
                          onClick={() => {
                            fetchTaskDetails(task.id);
                            setShowLogs(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-700 truncate">{task.keyword}</span>
                          </div>
                          {task.error && (
                            <p className="text-xs text-red-500 mt-1 truncate">{task.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tasks.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No tasks in queue</p>
                    <p className="text-sm mt-1">Enter article settings and click Generate</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <Dialog open={showLogs} onClose={() => setShowLogs(false)}>
          <DialogContent className="max-w-7xl max-h-[85vh]">
            <DialogHeader className="flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-gray-500" />
                  Task Logs
                </DialogTitle>
                {selectedTask && (
                  <DialogDescription className="text-sm">
                    {selectedTask.keyword} - {selectedTask.status}
                  </DialogDescription>
                )}
              </div>
              {selectedTask?.status === 'running' && (
                <Button
                  variant="outline"
                  color="red"
                  size="sm"
                  onClick={() => cancelTask(selectedTask.id)}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel Task
                </Button>
              )}
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">{selectedTask.keyword}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      selectedTask.status === 'running' ? 'default' :
                      selectedTask.status === 'completed' ? 'secondary' : 'outline'
                    } className="text-xs">
                      {selectedTask.status}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(selectedTask.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Progress value={selectedTask.progress} className="h-1 mt-2" />
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {(() => {
                    const logsByStep: Record<string, typeof selectedTask.logs> = {};
                    (selectedTask?.logs || []).forEach((log) => {
                      const step = log.step;
                      if (!logsByStep[step]) logsByStep[step] = [];
                      logsByStep[step].push(log);
                    });

                    return Object.entries(logsByStep).map(([stepName, stepLogs]) => {
                      if (!stepLogs || stepLogs.length === 0) return null;
                      
                      const hasError = stepLogs.some(l => l.level === 'error');
                      const isCompleted = stepLogs.some(l => l.message.includes('Completed'));
                      const isRunning = selectedTask.status === 'running' && stepLogs[stepLogs.length - 1]?.level === 'info' && !stepLogs[stepLogs.length - 1]?.message.includes('Completed');
                      
                      return (
                        <div
                          key={stepName}
                          className={`rounded-lg border transition-all ${
                            isCompleted ? 'border-green-200 bg-green-50' :
                            isRunning ? 'border-blue-200 bg-blue-50' :
                            hasError ? 'border-red-200 bg-red-50' :
                            'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="w-full p-3 flex items-center gap-3">
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : isRunning ? (
                              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            ) : hasError ? (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                            <span className={`font-medium ${
                              isCompleted ? 'text-green-700' :
                              isRunning ? 'text-blue-700' :
                              hasError ? 'text-red-700' :
                              'text-gray-500'
                            }`}>
                              {stepName}
                            </span>
                            <span className="ml-auto text-xs text-gray-400">
                              {stepLogs.length} logs
                            </span>
                          </div>
                          <div className="px-6 pb-3 space-y-1">
                            {stepLogs.map((log) => (
                              <div key={log.id} className="flex items-start gap-3 p-2 bg-white rounded-lg border border-gray-100">
                                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  log.level === 'error' ? 'bg-red-500' :
                                  log.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">
                                      {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                    <Badge variant="outline" className="text-xs px-2">
                                      {log.level}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-600 mt-0.5 font-mono text-xs whitespace-pre-wrap">
                                    {formatJsonOutput(log.message)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }).filter(Boolean);
                  })()}
                  {isGenerating && currentLogs.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm font-medium text-blue-600">Live Logs</span>
                      </div>
                      {currentLogs.map((log, index) => (
                        <div key={`live-${index}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            log.level === 'error' ? 'bg-red-500' :
                            log.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">{log.step}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <Badge variant="outline" className="text-xs px-2">
                                {log.level}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5 font-mono text-xs whitespace-pre-wrap">
                              {formatJsonOutput(log.message)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
}
