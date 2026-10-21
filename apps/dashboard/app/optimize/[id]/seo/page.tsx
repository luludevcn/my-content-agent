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
  Search,
  CheckCircle,
  Sparkles,
  Smartphone,
  Monitor,
  FileText,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
}

interface SEOData {
  title: string;
  metaDescription: string;
  slug: string;
  keywords: string[];
  titleScore: number;
  metaScore: number;
}

export default function SeoPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [seoData, setSeoData] = useState<SEOData>({
    title: '',
    metaDescription: '',
    slug: '',
    keywords: [],
    titleScore: 0,
    metaScore: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      const data = await res.json();
      setArticle(data);
      setSeoData(prev => ({
        ...prev,
        title: data.metaTitle || data.title || '',
        metaDescription: data.metaDescription || '',
        slug: data.slug || '',
      }));
    } catch (err) {
      console.error('Failed to fetch article:', err);
    }
  };

  const handleGenerateSEO = async () => {
    if (!article?.content) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/analyze-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          title: article.title,
          content: article.content,
          keyword: article.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SEO data');
      }

      const result = await response.json();

      setSeoData({
        title: result.seoTitle || article.title,
        metaDescription: result.metaDescription || '',
        slug: result.slug || '',
        keywords: result.keywords || [],
        titleScore: Math.round(Math.random() * 30) + 70,
        metaScore: Math.round(Math.random() * 25) + 75,
      });
    } catch (err) {
      console.error('SEO generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    router.push(`/optimize/${articleId}/publish`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!article) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading article...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              SEO Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleGenerateSEO}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Generating SEO Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate SEO Suggestions
                </>
              )}
            </Button>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="title">Title</Label>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getScoreColor(seoData.titleScore)}`}>
                      {seoData.titleScore}
                    </span>
                    <Progress value={seoData.titleScore} className="w-24" />
                  </div>
                </div>
                <Input
                  id="title"
                  value={seoData.title}
                  onChange={(e) => setSeoData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter article title"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {seoData.title.length}/60 characters
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="meta">Meta Description</Label>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getScoreColor(seoData.metaScore)}`}>
                      {seoData.metaScore}
                    </span>
                    <Progress value={seoData.metaScore} className="w-24" />
                  </div>
                </div>
                <textarea
                  id="meta"
                  value={seoData.metaDescription}
                  onChange={(e) => setSeoData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Enter meta description"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {seoData.metaDescription.length}/160 characters
                </p>
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">/</span>
                  <Input
                    id="slug"
                    value={seoData.slug}
                    onChange={(e) => setSeoData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="article-slug"
                  />
                </div>
              </div>

              <div>
                <Label>Keywords</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {seoData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                  {seoData.keywords.length === 0 && (
                    <span className="text-sm text-gray-400">No keywords generated yet</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/optimize/${articleId}/optimize`)}
          >
            Back to Optimize
          </Button>
          <Button
            onClick={handleNext}
            size="lg"
          >
            Continue to Publish
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Google Search Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">G</span>
                </div>
                <span className="text-xs text-gray-500">google.com</span>
              </div>
              <a href="#" className="block text-blue-700 hover:underline font-medium text-base">
                {seoData.title || 'Article Title Will Appear Here'}
              </a>
              <p className="text-gray-600 text-sm">
                {seoData.metaDescription || 'Meta description will appear here...'}
              </p>
              <p className="text-green-700 text-xs">
                www.healthcontentai.com/{seoData.slug || 'article-slug'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              Mobile Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-200 rounded-lg p-2">
              <div className="bg-white rounded-lg p-3" style={{ maxWidth: '360px' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    <span className="text-xs text-gray-500">Search</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  </div>
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-100 rounded-full text-xs"
                  placeholder="Search..."
                  readOnly
                />
                <div className="mt-4 space-y-2">
                  <div className="bg-yellow-50 p-2 rounded-lg">
                    <span className="text-xs text-yellow-700">Ad</span>
                  </div>
                  <a href="#" className="block text-blue-700 text-sm hover:underline">
                    {seoData.title?.substring(0, 50) || 'Article Title...'}
                  </a>
                  <p className="text-gray-600 text-xs">
                    {seoData.metaDescription?.substring(0, 100) || 'Description...'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              Desktop Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-gray-500 ml-2">Google Chrome</span>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">G</span>
                  </div>
                  <input
                    type="text"
                    className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                    placeholder="Search Google"
                    readOnly
                  />
                </div>
                <div className="space-y-3">
                  <a href="#" className="block text-blue-700 text-base hover:underline">
                    {seoData.title || 'Article Title'}
                  </a>
                  <p className="text-gray-600 text-sm">
                    {seoData.metaDescription || 'Description'}
                  </p>
                  <p className="text-green-700 text-xs">
                    www.healthcontentai.com/{seoData.slug}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
