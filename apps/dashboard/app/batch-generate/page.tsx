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
import { CheckCircle, AlertCircle, Loader2, Plus, Trash2, FileText, ArrowRight, Sparkles } from 'lucide-react';
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

interface BatchItem {
  id: string;
  keyword: string;
  audience: string;
  length: number;
  category: Category;
  tone: Tone;
}

interface BatchResult {
  keyword: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export default function BatchGenerate() {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([
    { id: '1', keyword: '', audience: 'Seniors', length: 2000, category: 'mobility', tone: 'friendly' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sequential, setSequential] = useState(true);

  const addItem = () => {
    const newId = Date.now().toString();
    setBatchItems(prev => [...prev, {
      id: newId,
      keyword: '',
      audience: 'Seniors',
      length: 2000,
      category: 'mobility',
      tone: 'friendly',
    }]);
  };

  const removeItem = (id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BatchItem, value: string | number) => {
    setBatchItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleBatchGenerate = async () => {
    const validItems = batchItems.filter(item => item.keyword.trim());
    if (validItems.length === 0) return;

    setIsGenerating(true);
    setResults(validItems.map(item => ({
      keyword: item.keyword,
      status: 'pending' as const,
    })));
    setProgress(0);
    setCurrentIndex(0);

    const requests: ArticleGenerationRequest[] = validItems.map(item => ({
      keyword: item.keyword.trim(),
      audience: item.audience,
      length: item.length,
      category: item.category,
      tone: item.tone,
    }));

    try {
      const response = await fetch('/api/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests, sequential }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results.map((r: any) => ({
          keyword: r.keyword,
          status: r.success ? 'completed' as const : 'failed' as const,
          error: r.error,
        })));
        setProgress(100);
      } else {
        throw new Error(data.error || 'Batch generation failed');
      }
    } catch (error) {
      setResults(prev => prev.map((r, i) => ({
        ...r,
        status: i === 0 ? 'failed' as const : r.status,
        error: i === 0 ? (error as Error).message : undefined,
      })));
    } finally {
      setIsGenerating(false);
    }
  };

  const validItemCount = batchItems.filter(item => item.keyword.trim()).length;
  const totalProgress = results.length > 0 
    ? (results.filter(r => r.status === 'completed').length / results.length) * 100 
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Batch Generate Articles</h1>
        <p className="text-gray-500 mt-2">Generate multiple articles at once</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Article Queue
                <Badge variant="outline">{batchItems.length} items</Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={isGenerating}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Article
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {batchItems.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Article {index + 1}</span>
                  {batchItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={isGenerating}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`keyword-${item.id}`}>Keyword</Label>
                    <Input
                      id={`keyword-${item.id}`}
                      value={item.keyword}
                      onChange={(e) => updateItem(item.id, 'keyword', e.target.value)}
                      placeholder="e.g., Best Exercises for Seniors"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      disabled={isGenerating}
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select
                      value={item.audience}
                      onChange={(e) => updateItem(item.id, 'audience', e.target.value)}
                      disabled={isGenerating}
                    >
                      {audiences.map((aud) => (
                        <option key={aud} value={aud}>
                          {aud}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select
                      value={item.tone}
                      onChange={(e) => updateItem(item.id, 'tone', e.target.value)}
                      disabled={isGenerating}
                    >
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
                          onClick={() => updateItem(item.id, 'length', len)}
                          disabled={isGenerating}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                            item.length === len
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {len} words
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sequential}
                    onChange={(e) => setSequential(e.target.checked)}
                    disabled={isGenerating}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Sequential mode (one at a time)</span>
                </label>
              </div>
              <Button
                onClick={handleBatchGenerate}
                disabled={isGenerating || validItemCount === 0}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGenerating ? 'Generating...' : `Generate ${validItemCount} Articles`}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Generation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="space-y-4">
                <Progress value={totalProgress} className="h-2" />
                <div className="text-sm text-gray-500">
                  {results.filter(r => r.status === 'completed').length}/{results.length} articles completed
                </div>
                <div className="space-y-2">
                  {results.slice(0, 10).map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        result.status === 'completed' ? 'bg-green-50' :
                        result.status === 'failed' ? 'bg-red-50' :
                        result.status === 'running' ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      {result.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : result.status === 'failed' ? (
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      ) : result.status === 'running' ? (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm truncate flex-1 ${
                        result.status === 'completed' ? 'text-green-700' :
                        result.status === 'failed' ? 'text-red-700' :
                        result.status === 'running' ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {result.keyword}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      {results.filter(r => r.status === 'completed').length} succeeded
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">
                      {results.filter(r => r.status === 'failed').length} failed
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        result.status === 'completed' ? 'bg-green-50 border border-green-200' :
                        'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          result.status === 'completed' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.keyword}
                        </span>
                      </div>
                      {result.error && (
                        <p className="text-xs text-red-500 mt-1">{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No batch generation in progress</p>
                <p className="text-sm mt-1">Add articles to the queue and click Generate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}