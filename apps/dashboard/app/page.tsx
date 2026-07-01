import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, FileText, Clock, Zap, Activity, CheckCircle } from 'lucide-react';

const stats = [
  { label: 'Articles Generated', value: '128', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { label: 'Average Word Count', value: '2,450', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  { label: 'Generation Time', value: '45s', icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
  { label: 'Quality Score', value: '92%', icon: Zap, color: 'bg-purple-100 text-purple-600' },
];

const recentArticles = [
  { title: 'Why Does Knee Pain Get Worse at Night?', status: 'completed', category: 'Arthritis', date: 'Today' },
  { title: 'Walking After 70: Tips for Safe Mobility', status: 'completed', category: 'Mobility', date: 'Yesterday' },
  { title: 'How to Improve Balance in Seniors', status: 'generating', category: 'Balance', date: 'Today' },
  { title: 'Nutrition for Joint Health', status: 'pending', category: 'Nutrition', date: 'Today' },
];

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back! Here's your content generation overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
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
              {recentArticles.map((article) => (
                <div key={article.title} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{article.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{article.category}</Badge>
                      <span className="text-sm text-gray-500">{article.date}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={article.status === 'completed' ? 'default' : article.status === 'generating' ? 'outline' : 'secondary'}
                    className={article.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                  >
                    {article.status === 'completed' ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Done
                      </span>
                    ) : article.status === 'generating' ? (
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 animate-pulse" />
                        Generating
                      </span>
                    ) : (
                      'Pending'
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                <FileText className="w-5 h-5" />
                New Article
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                <TrendingUp className="w-5 h-5" />
                Optimize Content
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                <Clock className="w-5 h-5" />
                Topic Planner
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
