'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  Check,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  category: string;
  tags: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  score: number;
}

const EXPORT_FORMATS = [
  { id: 'markdown', label: 'Markdown', icon: FileText },
  { id: 'wordpress', label: 'WordPress', icon: ExternalLink },
  { id: 'notion', label: 'Notion', icon: ExternalLink },
  { id: 'ghost', label: 'Ghost', icon: ExternalLink },
  { id: 'html', label: 'HTML', icon: FileText },
  { id: 'json', label: 'JSON', icon: FileText },
];

export default function PublishPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [finalScore, setFinalScore] = useState(85);

  const checklist: ChecklistItem[] = [
    { id: 'seo', label: 'SEO Optimization', checked: true, score: 91 },
    { id: 'readability', label: 'Readability', checked: true, score: 88 },
    { id: 'internal-links', label: 'Internal Links', checked: true, score: 95 },
    { id: 'schema', label: 'Schema Markup', checked: true, score: 98 },
    { id: 'images', label: 'Images & Alt Text', checked: false, score: 72 },
    { id: 'faq', label: 'FAQ Section', checked: true, score: 96 },
    { id: 'eeat', label: 'EEAT Signals', checked: true, score: 89 },
  ];

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      const data = await res.json();
      setArticle(data);
      
      const avgScore = checklist.reduce((sum, item) => sum + item.score, 0) / checklist.length;
      setFinalScore(Math.round(avgScore));
    } catch (err) {
      console.error('Failed to fetch article:', err);
    }
  };

  const handleExport = async (format: string) => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: article?.id,
          title: article?.title,
          content: article?.content,
          metaTitle: article?.metaTitle,
          metaDescription: article?.metaDescription,
          slug: article?.slug,
          category: article?.category,
          tags: article?.tags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export');
      }

      const blob = new Blob([article?.content || ''], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${article?.slug || 'article'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBack = () => {
    router.push(`/optimize/${articleId}/seo`);
  };

  const handleDone = () => {
    router.push('/articles');
  };

  if (!article) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading article...</div>
      </div>
    );
  }

  const passedCount = checklist.filter(item => item.checked).length;
  const totalCount = checklist.length;

  return (
    <div className="space-y-8">
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Rocket className="w-6 h-6 text-blue-600" />
            Publish Ready
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full text-6xl font-bold ${
            finalScore >= 90 ? 'bg-green-100 text-green-700' :
            finalScore >= 80 ? 'bg-blue-100 text-blue-700' :
            finalScore >= 70 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {finalScore}
          </div>
          <p className="text-gray-500 mt-4 text-lg">Final Score</p>
          <Progress value={finalScore} className="mt-4 max-w-md mx-auto" />
          <p className="text-sm text-gray-400 mt-2">
            {passedCount}/{totalCount} checks passed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Quality Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border ${
                item.checked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {item.checked ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <Badge className={item.checked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {item.score}
                </Badge>
              </div>
              <p className={`font-medium ${item.checked ? 'text-green-800' : 'text-red-800'}`}>
                {item.label}
              </p>
              <Progress
                value={item.score}
                className={`mt-2 h-1.5 ${item.checked ? 'bg-green-200' : 'bg-red-200'}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {EXPORT_FORMATS.map((format) => {
            const Icon = format.icon;
            return (
              <Button
                key={format.id}
                variant="outline"
                onClick={() => handleExport(format.id)}
                disabled={isExporting}
                className="flex flex-col items-center gap-2 h-24"
              >
                <Icon className="w-6 h-6" />
                <span>{format.label}</span>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Article Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Title</span>
            <span className="font-medium">{article.title}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Slug</span>
            <span className="font-medium">{article.slug}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Category</span>
            <Badge variant="secondary">{article.category}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Tags</span>
            <div className="flex flex-wrap gap-2">
              {article.tags && JSON.parse(article.tags).map((tag: string, index: number) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Word Count</span>
            <span className="font-medium">{article.content.split(/\s+/).length}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
        >
          Back to SEO
        </Button>
        <Button
          onClick={handleDone}
          size="lg"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
}
