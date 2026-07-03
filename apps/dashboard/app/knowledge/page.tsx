'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { List, Database, FolderOpen, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface RagStatus {
  documentCount: number;
  storageMode: string;
  availableFiles: number;
}

interface IndexResult {
  success: boolean;
  indexedCount: number;
  skippedCount: number;
  totalDocumentCount: number;
  message: string;
}

export default function Knowledge() {
  const [status, setStatus] = useState<RagStatus | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [progress, setProgress] = useState(0);

  const fetchStatus = async () => {
    const response = await fetch('/api/rag-index');
    const data = await response.json();
    setStatus(data);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleIndex = async (source: 'database' | 'files') => {
    setIsIndexing(true);
    setProgress(0);
    setIndexResult(null);

    const response = await fetch('/api/rag-index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    });

    const data = await response.json();
    setIndexResult(data);
    setProgress(100);
    setIsIndexing(false);
    await fetchStatus();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="text-gray-500 mt-2">Manage your RAG vector database and index articles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5 text-blue-600" />
              Vector Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Storage Mode</span>
                  <Badge variant="outline">{status.storageMode}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Indexed Documents</span>
                  <span className="text-sm font-medium text-gray-900">{status.documentCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Available Markdown Files</span>
                  <span className="text-sm font-medium text-gray-900">{status.availableFiles}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Info className="w-3 h-3" />
                  <span>Vectors are stored in SQLite database</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                Loading status...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" />
              Index from Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Index articles that have been previously generated and stored in the database.
                This will create vector embeddings for each article.
              </p>
              <Button
                onClick={() => handleIndex('database')}
                disabled={isIndexing}
                className="w-full"
              >
                {isIndexing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                {isIndexing ? 'Indexing...' : 'Index Database Articles'}
              </Button>
              {isIndexing && (
                <Progress value={progress} className="h-2" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-orange-600" />
              Index from Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Index Markdown files from the content directory.
                This will create vector embeddings for each file.
              </p>
              <Button
                onClick={() => handleIndex('files')}
                disabled={isIndexing}
                variant="outline"
                className="w-full"
              >
                {isIndexing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FolderOpen className="w-4 h-4 mr-2" />
                )}
                {isIndexing ? 'Indexing...' : 'Index Markdown Files'}
              </Button>
              {isIndexing && (
                <Progress value={progress} className="h-2" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {indexResult && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              indexResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {indexResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${
                  indexResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {indexResult.message}
                </p>
                {indexResult.success && (
                  <p className="text-sm text-gray-500 mt-1">
                    Total indexed documents: {indexResult.totalDocumentCount}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}