'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import {
  Wrench,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Undo2,
  Eye,
} from 'lucide-react';
import { AnalysisResult, AnalysisSuggestion, AnalysisIssue, AnalysisCategory, Severity, Difficulty } from '@health-content-ai/shared';

interface Article {
  id: string;
  title: string;
  content: string;
}

interface AppliedDiff {
  suggestionId: string;
  before: string;
  after: string;
  changes: string[];
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'border-red-300 bg-red-50',
  high: 'border-orange-300 bg-orange-50',
  medium: 'border-yellow-300 bg-yellow-50',
  low: 'border-blue-300 bg-blue-50',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  hard: 'text-red-600 bg-red-100',
};

const CATEGORY_COLORS: Record<AnalysisCategory, string> = {
  seo: 'text-blue-600 bg-blue-100',
  readability: 'text-green-600 bg-green-100',
  eeat: 'text-purple-600 bg-purple-100',
  medical: 'text-red-600 bg-red-100',
  'ai-search': 'text-cyan-600 bg-cyan-100',
  conversion: 'text-orange-600 bg-orange-100',
  accessibility: 'text-pink-600 bg-pink-100',
};

export default function OptimizePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = params.id as string;
  const analysisId = searchParams.get('analysisId');

  const [article, setArticle] = useState<Article | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [appliedDiffs, setAppliedDiffs] = useState<AppliedDiff[]>([]);
  const [expandedSuggestions, setExpandedSuggestions] = useState<string[]>([]);
  const [currentDiff, setCurrentDiff] = useState<AppliedDiff | null>(null);

  useEffect(() => {
    fetchArticle();
    fetchAnalysis();
  }, [articleId, analysisId]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      const data = await res.json();
      setArticle(data);
      setContent(data.content);
      setOriginalContent(data.content);
    } catch (err) {
      console.error('Failed to fetch article:', err);
    }
  };

  const fetchAnalysis = async () => {
    if (!analysisId) return;
    try {
      const res = await fetch(`/api/analyze-seo/${analysisId}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedSuggestions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getIssueForSuggestion = (suggestion: AnalysisSuggestion): AnalysisIssue | undefined => {
    return analysis?.issues.find(i => i.id === suggestion.issueId);
  };

  const handleApplySuggestion = async (suggestion: AnalysisSuggestion) => {
    if (!content.trim()) return;

    setIsOptimizing(true);

    try {
      const response = await fetch('/api/optimize-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          keyword: article?.title || '',
          suggestions: [suggestion],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize');
      }

      const result = await response.json();

      const diff: AppliedDiff = {
        suggestionId: suggestion.id,
        before: content,
        after: result.optimizedContent,
        changes: result.appliedSuggestions || [],
      };

      setAppliedDiffs(prev => [...prev, diff]);
      setContent(result.optimizedContent);
      setCurrentDiff(diff);
      setSelectedSuggestions(prev => prev.filter(id => id !== suggestion.id));
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplySelected = async () => {
    if (!content.trim() || selectedSuggestions.length === 0) return;

    const suggestions = analysis?.suggestions.filter(s => selectedSuggestions.includes(s.id)) || [];
    if (suggestions.length === 0) return;

    setIsOptimizing(true);

    try {
      const response = await fetch('/api/optimize-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          keyword: article?.title || '',
          suggestions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize');
      }

      const result = await response.json();

      suggestions.forEach(suggestion => {
        const diff: AppliedDiff = {
          suggestionId: suggestion.id,
          before: content,
          after: result.optimizedContent,
          changes: result.appliedSuggestions || [],
        };
        setAppliedDiffs(prev => [...prev, diff]);
      });

      setContent(result.optimizedContent);
      setSelectedSuggestions([]);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRevert = () => {
    setContent(originalContent);
    setAppliedDiffs([]);
    setCurrentDiff(null);
  };

  const handleNext = () => {
    router.push(`/optimize/${articleId}/seo`);
  };

  if (!article) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading article...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <Card className="lg:sticky lg:top-8 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {analysis?.suggestions.length || 0} suggestions
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplySelected}
              disabled={isOptimizing || selectedSuggestions.length === 0}
            >
              Apply Selected ({selectedSuggestions.length})
            </Button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {analysis?.suggestions.map((suggestion) => {
              const issue = getIssueForSuggestion(suggestion);
              const isSelected = selectedSuggestions.includes(suggestion.id);
              const isExpanded = expandedSuggestions.includes(suggestion.id);
              const isApplied = appliedDiffs.some(d => d.suggestionId === suggestion.id);

              return (
                <div
                  key={suggestion.id}
                  className={`rounded-lg border p-3 ${
                    isApplied
                      ? 'border-green-200 bg-green-50'
                      : isSelected
                      ? 'border-blue-200 bg-blue-50'
                      : issue
                      ? SEVERITY_COLORS[issue.severity]
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSuggestion(suggestion.id)}
                      disabled={isApplied}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isApplied
                          ? 'bg-green-500 border-green-500'
                          : isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {(isSelected || isApplied) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={CATEGORY_COLORS[suggestion.category]}>
                          {suggestion.category}
                        </Badge>
                        <Badge variant="secondary" className={DIFFICULTY_COLORS[suggestion.difficulty]}>
                          {suggestion.difficulty}
                        </Badge>
                        {isApplied && (
                          <Badge className="bg-green-100 text-green-700">Applied</Badge>
                        )}
                      </div>

                      <h4 className="font-medium mt-1 text-sm">{suggestion.title}</h4>

                      <button
                        onClick={() => toggleExpand(suggestion.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 mt-1 hover:text-gray-700"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        {isExpanded ? 'Hide details' : 'Show details'}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2 text-xs">
                          <p className="text-gray-600">{suggestion.description}</p>
                          <div className="flex items-center gap-2 text-gray-500">
                            <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                            <span className="text-blue-600">+{suggestion.estimatedScoreGain} score</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => !isApplied && handleApplySuggestion(suggestion)}
                      disabled={isOptimizing || isApplied}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                      title={isApplied ? 'Already applied' : 'Apply this suggestion'}
                    >
                      {isApplied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Plus className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Applied Changes</span>
              <span className="text-sm text-gray-500">{appliedDiffs.length}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevert}
              disabled={appliedDiffs.length === 0}
              className="w-full"
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Revert All Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Article Editor
              </div>
              <Badge className={content !== originalContent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                {content !== originalContent ? 'Modified' : 'Original'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
              placeholder="Article content..."
            />
          </CardContent>
        </Card>

        {currentDiff && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Change Preview
                </div>
                <button
                  onClick={() => setCurrentDiff(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Before</Label>
                  <div className="p-4 bg-gray-50 rounded-lg text-sm font-mono max-h-[200px] overflow-y-auto">
                    {currentDiff.before.substring(0, 500)}...
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-green-600 mb-2 block">After</Label>
                  <div className="p-4 bg-green-50 rounded-lg text-sm font-mono max-h-[200px] overflow-y-auto">
                    {currentDiff.after.substring(0, 500)}...
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-2">Changes Made:</p>
                <ul className="text-sm text-blue-600 space-y-1">
                  {currentDiff.changes.map((change, index) => (
                    <li key={index}>• {change}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/optimize/${articleId}/analyze`)}
          >
            Back to Analyze
          </Button>
          <Button
            onClick={handleNext}
            size="lg"
          >
            Continue to SEO
          </Button>
        </div>
      </div>
    </div>
  );
}
