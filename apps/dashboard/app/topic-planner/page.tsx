'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, TrendingUp, Brain, ArrowRight, Sparkles } from 'lucide-react';

const topics = [
  { id: 1, title: 'Knee Pain Relief Exercises', category: 'Arthritis', status: 'pending', searchVolume: 1200 },
  { id: 2, title: 'How to Improve Balance for Seniors', category: 'Balance', status: 'completed', searchVolume: 850 },
  { id: 3, title: 'Best Foods for Joint Health', category: 'Nutrition', status: 'pending', searchVolume: 2100 },
  { id: 4, title: 'Fall Prevention Strategies', category: 'Fall Prevention', status: 'in-progress', searchVolume: 1500 },
  { id: 5, title: 'Walking After 70', category: 'Mobility', status: 'completed', searchVolume: 3200 },
  { id: 6, title: 'Chronic Pain Management', category: 'Chronic Pain', status: 'pending', searchVolume: 1800 },
];

const categories = ['All', 'Arthritis', 'Heart Health', 'Mobility', 'Balance', 'Nutrition', 'Exercise', 'Mental Health', 'Elderly Care', 'Chronic Pain', 'Fall Prevention'];

export default function TopicPlanner() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || topic.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Topic Planner</h1>
        <p className="text-gray-500 mt-2">Plan and organize your content topics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Topic List
            </CardTitle>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Export Calendar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.title)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedTopic === topic.title ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{topic.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{topic.category}</Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <TrendingUp className="w-3 h-3" />
                          {topic.searchVolume.toLocaleString()} searches/mo
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={
                          topic.status === 'completed' ? 'bg-green-100 text-green-700' :
                          topic.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {topic.status === 'completed' ? 'Done' : topic.status === 'in-progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Add New Topic</Label>
              <Input placeholder="Enter topic title" />
              <Button className="w-full">Add Topic</Button>
            </div>

            <div className="space-y-3">
              <Label>Topic Cluster</Label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Current Cluster: Mobility</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Walking After 70</Badge>
                  <Badge variant="secondary">Balance Exercises</Badge>
                  <Badge variant="secondary">Joint Health</Badge>
                  <Badge variant="outline">+ Add</Badge>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-700 mb-2">Suggested Topics</p>
              <div className="space-y-2">
                {['Strength Training for Seniors', 'Yoga for Joint Pain', 'Nutrition for Mobility'].map((topic) => (
                  <button key={topic} className="w-full text-left text-sm text-blue-600 hover:underline py-1">
                    <ArrowRight className="inline w-3 h-3 mr-1" />
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
