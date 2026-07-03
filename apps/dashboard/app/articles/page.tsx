'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import {
  FileText,
  Search,
  ArrowRight,
  Calendar,
  Tag,
  Eye,
  Copy,
  CheckCircle,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  createdAt: string;
}

const categories = [
  'all',
  'arthritis',
  'heart-health',
  'mobility',
  'balance',
  'nutrition',
  'exercise',
  'mental-health',
  'elderly-care',
  'chronic-pain',
  'fall-prevention',
];

const categoryLabels: Record<string, string> = {
  'all': 'All Categories',
  'arthritis': 'Arthritis',
  'heart-health': 'Heart Health',
  'mobility': 'Mobility',
  'balance': 'Balance',
  'nutrition': 'Nutrition',
  'exercise': 'Exercise',
  'mental-health': 'Mental Health',
  'elderly-care': 'Elderly Care',
  'chronic-pain': 'Chronic Pain',
  'fall-prevention': 'Fall Prevention',
};

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [searchTerm, selectedCategory]);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles?limit=100');
      const data = await res.json();
      let filtered = data.articles || [];

      if (searchTerm) {
        filtered = filtered.filter((a: Article) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedCategory !== 'all') {
        filtered = filtered.filter((a: Article) => a.category === selectedCategory);
      }

      setArticles(filtered);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    }
  };

  const handleCopyMarkdown = (article: Article) => {
    const markdown = `---
title: "${article.title}"
metaTitle: "${article.metaTitle}"
metaDescription: "${article.metaDescription}"
excerpt: "${article.excerpt}"
slug: "${article.slug}"
category: "${article.category}"
tags: ${JSON.stringify(article.tags)}
---

${article.content}

---

*This article is for informational purposes only and should not be taken as medical advice. Always consult with a qualified healthcare professional.*`;

    navigator.clipboard.writeText(markdown);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
        <p className="text-gray-500 mt-2">View and manage your generated articles</p>
      </div>

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Article List
              <Badge variant="secondary">{articles.length} articles</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-48">
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </option>
                ))}
              </Select>
            </div>

            {articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{article.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.excerpt}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{categoryLabels[article.category] || article.category}</Badge>
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} className="text-xs">{tag}</Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{article.tags.length - 3} more</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(article.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedArticle(article)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyMarkdown(article)}
                        >
                          {copiedId === article.id ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No articles found</p>
                <p className="text-sm mt-1">Generate articles to see them here</p>
              </div>
            )}
          </CardContent>
      </Card>

      <Dialog open={!!selectedArticle} onClose={() => setSelectedArticle(null)}>
          <DialogContent className="max-w-7xl max-h-[90vh]">
            <DialogHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <DialogTitle>{selectedArticle?.title}</DialogTitle>
                <DialogDescription className="text-sm">
                  {categoryLabels[selectedArticle?.category || ''] || selectedArticle?.category}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyMarkdown(selectedArticle!)}
              >
                {copiedId === selectedArticle?.id ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copiedId === selectedArticle?.id ? 'Copied!' : 'Copy'}
              </Button>
            </DialogHeader>
            {selectedArticle && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{selectedArticle.metaDescription}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{categoryLabels[selectedArticle.category] || selectedArticle.category}</Badge>
                  {selectedArticle.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedArticle.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Tabs defaultValue="preview">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown Source</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="max-h-[60vh] overflow-y-auto">
                    <MarkdownRenderer content={selectedArticle.content} />
                  </TabsContent>
                  <TabsContent value="markdown" className="max-h-[60vh] overflow-y-auto">
                    <Textarea
                      className="min-h-[500px] font-mono text-sm"
                      readOnly
                      value={selectedArticle.content}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
}
