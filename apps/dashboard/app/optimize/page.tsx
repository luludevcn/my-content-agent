'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, CheckCircle, Sparkles, FileText } from 'lucide-react';

export default function Optimize() {
  const [keyword, setKeyword] = useState('');
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!content.trim()) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      const wordCount = content.split(/\s+/).length;
      const headingCount = (content.match(/^#{1,3}\s+/gm) || []).length;
      const imageCount = (content.match(/!\[.*?\]/g) || []).length;
      const readingLevel = Math.round(Math.random() * 5 + 8);
      
      let score = 100;
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (wordCount < 1000) {
        issues.push('Content is too short');
        suggestions.push('Expand content to at least 1000 words');
        score -= 20;
      } else if (wordCount > 3000) {
        suggestions.push('Consider breaking content into multiple articles');
        score -= 5;
      }

      if (headingCount < 3) {
        issues.push('Insufficient heading structure');
        suggestions.push('Add more H2 and H3 headings');
        score -= 10;
      }

      if (imageCount === 0) {
        suggestions.push('Add relevant images to improve engagement');
        score -= 5;
      }

      if (readingLevel > 12) {
        suggestions.push('Simplify sentence structure for better readability');
        score -= 10;
      }

      setAnalysis({
        score: Math.max(0, score),
        wordCount,
        headingCount,
        imageCount,
        readingLevel,
        issues,
        suggestions,
        seoTitle: keyword ? `${keyword} - Comprehensive Guide` : '',
        metaDescription: content.substring(0, 160),
        slug: keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        keywords: ['health', 'wellness', 'tips', 'guide', 'advice'],
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Optimize</h1>
        <p className="text-gray-500 mt-2">Analyze and optimize your content for SEO and readability</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Content Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="keyword">Target Keyword</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter your target keyword"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Article Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your article content here..."
                className="min-h-[400px]"
              />
            </div>

            <Button onClick={handleAnalyze} disabled={isAnalyzing || !content.trim()} className="w-full">
              {isAnalyzing ? (
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {analysis ? (
              <>
                <div className="text-center py-4">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${
                    analysis.score >= 80 ? 'bg-green-100 text-green-700' :
                    analysis.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {analysis.score}
                  </div>
                  <p className="text-gray-500 mt-2">Overall Score</p>
                  <Progress value={analysis.score} className="mt-4" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Word Count</p>
                    <p className="text-xl font-bold">{analysis.wordCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Headings</p>
                    <p className="text-xl font-bold">{analysis.headingCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Images</p>
                    <p className="text-xl font-bold">{analysis.imageCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Reading Level</p>
                    <p className="text-xl font-bold">Grade {analysis.readingLevel}</p>
                  </div>
                </div>

                {analysis.issues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Issues Found
                    </p>
                    {analysis.issues.map((issue: string, index: number) => (
                      <Badge key={index} variant="destructive" className="block w-full text-left">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                )}

                {analysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Optimization Suggestions
                    </p>
                    {analysis.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">SEO Recommendations</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input readOnly value={analysis.seoTitle} className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Meta Description</Label>
                      <Textarea readOnly value={analysis.metaDescription} className="text-sm min-h-[60px]" />
                    </div>
                    <div>
                      <Label className="text-xs">Slug</Label>
                      <Input readOnly value={analysis.slug} className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Keywords</Label>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords.map((kw: string) => (
                          <Badge key={kw} variant="secondary">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Enter content to analyze</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
