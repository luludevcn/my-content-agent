'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, Cpu, Shield, Bell, Save, CheckCircle, Server } from 'lucide-react';

export default function Settings() {
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [model, setModel] = useState('qwen3:14b');
  const [temperature, setTemperature] = useState('0.7');
  const [qdrantUrl, setQdrantUrl] = useState('http://localhost:6333');
  const [collectionName, setCollectionName] = useState('health_articles');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">Configure your AI content generation settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-8">
            <div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  LLM Settings
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ollama-url">Ollama Base URL</Label>
                  <Input
                    id="ollama-url"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onChange={(e) => setModel(e.target.value)}>
                    <option value="">Select model</option>
                    <option value="qwen3:14b">Qwen3 14B</option>
                    <option value="qwen3:7b">Qwen3 7B</option>
                    <option value="llama3:8b">Llama 3 8B</option>
                    <option value="mistral:7b">Mistral 7B</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                  />
                  <p className="text-xs text-gray-500">Lower = more deterministic, Higher = more creative</p>
                </div>
              </div>
            </div>

            <div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                  Vector Database Settings
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qdrant-url">Qdrant URL</Label>
                  <Input
                    id="qdrant-url"
                    value={qdrantUrl}
                    onChange={(e) => setQdrantUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collection">Collection Name</Label>
                  <Input
                    id="collection"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Server className="w-5 h-5 text-blue-600" />
                  Output Settings
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Default Audience</Label>
                  <Select defaultValue="Seniors">
                    <option value="Seniors">Seniors</option>
                    <option value="Caregivers">Caregivers</option>
                    <option value="General">General Audience</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Length</Label>
                  <Select defaultValue="2000">
                    <option value="1500">1500 words</option>
                    <option value="2000">2000 words</option>
                    <option value="3000">3000 words</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Tone</Label>
                  <Select defaultValue="friendly">
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="authoritative">Authoritative</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave}>
                {saved ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saved ? 'Saved!' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-700">Ollama</span>
              </div>
              <Badge className="bg-green-100 text-green-700">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-700">Qdrant</span>
              </div>
              <Badge className="bg-green-100 text-green-700">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm font-medium text-yellow-700">Embedding Model</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-700">BGE-M3</Badge>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">System Info</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Documents in DB</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Articles</span>
                  <span className="font-medium">128</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Generation Time</span>
                  <span className="font-medium">45s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-blue-600" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Generation Complete</p>
                  <p className="text-sm text-gray-500">Notify when article generation is complete</p>
                </div>
                <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Duplicate Detection</p>
                  <p className="text-sm text-gray-500">Notify when similar articles are detected</p>
                </div>
                <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Medical Issues</p>
                  <p className="text-sm text-gray-500">Notify when medical review finds issues</p>
                </div>
                <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
