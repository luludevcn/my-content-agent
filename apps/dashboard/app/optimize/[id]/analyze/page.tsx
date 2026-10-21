'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileSearch,
  AlertCircle,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { AnalysisResult, AnalysisIssue, AnalysisCategory, Severity } from '@health-content-ai/shared';

interface Article {
  id: string;
  title: string;
  content: string;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
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

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [keyword, setKeyword] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<string>('');

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      const data = await res.json();
      setArticle(data);
      setKeyword(data.title);
    } catch (err) {
      console.error('Failed to fetch article:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!article?.content.trim()) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);

    try {
      const response = await fetch('/api/analyze-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          title: article.title,
          content: article.content,
          keyword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze content');
      }

      const result: AnalysisResult = await response.json();
      setAnalysis(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (analysis) {
      router.push(`/optimize/${articleId}/optimize?analysisId=${analysis.id}`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const sortedIssues = analysis?.issues.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  }) || [];

  if (!article) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading article...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-blue-600" />
            Analyze Article
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Article Title</Label>
            <p className="text-lg font-medium text-gray-900">{article.title}</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="keyword">Target Keyword</Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter your target keyword"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Analyze Content
              </>
            )}
          </Button>

          {isAnalyzing && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Running analysis agents...</p>
              <div className="space-y-2">
                {['SEO', 'Readability', 'EEAT', 'Medical'].map((agent) => (
                  <div key={agent} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      currentAgent === agent ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                    }`} />
                    <span className={`text-sm ${
                      currentAgent === agent ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}>
                      {agent} Agent
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-medium">Analysis failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </div>
              <p className="text-gray-500 mt-4">Overall Score</p>
              <Progress value={analysis.overallScore} className="mt-4 max-w-xs mx-auto" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Scores</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {analysis.categoryScores.map((categoryScore) => (
                <div
                  key={categoryScore.category}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{categoryScore.label}</span>
                    <Badge className={CATEGORY_COLORS[categoryScore.category]}>
                      {categoryScore.score}
                    </Badge>
                  </div>
                  <Progress value={categoryScore.score} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Issues Found ({sortedIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedIssues.map((issue: AnalysisIssue) => (
                <div
                  key={issue.id}
                  className={`p-4 rounded-lg border ${SEVERITY_COLORS[issue.severity]}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={CATEGORY_COLORS[issue.category]}>
                          {issue.category}
                        </Badge>
                        <Badge variant="outline">{SEVERITY_LABELS[issue.severity]}</Badge>
                        <span className="text-xs text-gray-500">Confidence: {Math.round(issue.confidence * 100)}%</span>
                      </div>
                      <h4 className="font-medium mt-2">{issue.title}</h4>
                      <p className="text-sm mt-1">{issue.description}</p>
                      <div className="mt-2 text-xs space-y-1">
                        <p><span className="font-medium">Why: </span>{issue.why}</p>
                        <p><span className="font-medium">Impact: </span>{issue.impact}</p>
                        <p><span className="font-medium">Difficulty: </span>{issue.difficulty}</p>
                        <p><span className="font-medium">Estimated Score Gain: </span>+{issue.estimatedScoreGain}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {sortedIssues.length === 0 && (
                <p className="text-center text-gray-400 py-8">No issues found. Your article is well-optimized!</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/articles')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              size="lg"
            >
              Continue to Optimize
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
