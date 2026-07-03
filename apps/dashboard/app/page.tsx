'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, FileText, Clock, Zap, Activity, CheckCircle, ArrowRight } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  category: string;
  createdAt: string;
}

interface Stats {
  articleCount: number;
  taskCount: number;
  runningCount: number;
}

export default function Dashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats>({ articleCount: 0, taskCount: 0, runningCount: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [articlesRes, tasksRes] = await Promise.all([
        fetch('/api/articles?limit=5'),
        fetch('/api/tasks'),
      ]);

      const articlesData = await articlesRes.json();
      const tasksData = await tasksRes.json();

      setArticles(articlesData.articles || []);
      setStats({
        articleCount: articlesData.count || 0,
        taskCount: tasksData.count || 0,
        runningCount: (tasksData.tasks || []).filter((t: any) => t.status === 'running').length,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const statItems = [
    { label: 'Articles Generated', value: stats.articleCount, icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { label: 'Tasks in Queue', value: stats.taskCount, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Running Tasks', value: stats.runningCount, icon: Activity, color: 'bg-green-100 text-green-600' },
    { label: 'Quality Score', value: '92%', icon: Zap, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back! Here's your content generation overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statItems.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              Recent Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {articles.length > 0 ? (
                articles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{article.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{article.category}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Done
                      </span>
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No articles yet</p>
                  <p className="text-sm">Generate your first article to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/new-article" className="block">
                <Button className="w-full">
                  <FileText className="w-5 h-5 mr-2" />
                  New Article
                </Button>
              </Link>
              <Link href="/optimize" className="block">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Optimize Content
                </Button>
              </Link>
              <Link href="/topic-planner" className="block">
                <Button variant="outline" className="w-full">
                  <Clock className="w-5 h-5 mr-2" />
                  Topic Planner
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
