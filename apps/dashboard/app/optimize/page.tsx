'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ArrowRight, FileSearch } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  createdAt: string;
}

export default function OptimizeHome() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/articles?limit=50');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectArticle = (articleId: string) => {
    router.push(`/optimize/${articleId}/analyze`);
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Optimize</h1>
        <p className="text-gray-500 mt-2">Select an article to analyze and optimize</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-blue-600" />
            Select Article
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading articles...</div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-8">
              <FileSearch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-400">No articles found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleSelectArticle(article.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{article.title}</h4>
                    <p className="text-sm text-gray-500">{article.slug}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSearch className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg">Analyze</h3>
            <p className="text-sm text-gray-500 mt-2">AI scans your article for SEO, readability, and medical accuracy issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-lg">Optimize</h3>
            <p className="text-sm text-gray-500 mt-2">Apply AI suggestions one by one with real-time preview</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg">SEO & Publish</h3>
            <p className="text-sm text-gray-500 mt-2">Optimize meta tags, preview in search, and export in multiple formats</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
