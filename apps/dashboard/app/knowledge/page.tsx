'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  List, Database, FolderOpen, RefreshCw, CheckCircle, AlertCircle, 
  Info, Settings, X, ChevronRight, ChevronLeft, Home, HardDrive 
} from 'lucide-react';

interface RagStatus {
  documentCount: number;
  storageMode: string;
  availableFiles: number;
  directoryPath?: string;
}

interface IndexResult {
  success: boolean;
  indexedCount: number;
  skippedCount: number;
  totalDocumentCount: number;
  message: string;
  error?: string;
}

interface DirectoryItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
}

interface BrowseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

function BrowseDialog({ isOpen, onClose, onSelect }: BrowseDialogProps) {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDirectory = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/browse-directory?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      setItems(data.items || []);
      setCurrentPath(data.currentPath || path);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchDirectory('/');
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    if (path === '..') {
      const parts = currentPath.split('/').filter(p => p);
      parts.pop();
      const newPath = parts.length > 0 ? '/' + parts.join('/') : '/';
      fetchDirectory(newPath);
    } else {
      fetchDirectory(path);
    }
  };

  const handleSelect = () => {
    onSelect(currentPath);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Select Directory</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 p-4 border-b bg-gray-50">
          <button 
            onClick={() => fetchDirectory('/')}
            className="p-2 hover:bg-gray-200 rounded-lg"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleNavigate('..')}
            disabled={currentPath === '/'}
            className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 text-sm text-gray-600 truncate">
            {currentPath}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => item.type === 'directory' && handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg text-left"
                >
                  {item.type === 'directory' ? (
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                  ) : (
                    <HardDrive className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="flex-1">{item.name}</span>
                  {item.type === 'directory' && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ))}
              {items.length === 0 && (
                <p className="text-center text-gray-400 py-8">No items found</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSelect}>Select</Button>
        </div>
      </div>
    </div>
  );
}

export default function Knowledge() {
  const [status, setStatus] = useState<RagStatus | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [directoryPath, setDirectoryPath] = useState('');
  const [showBrowseDialog, setShowBrowseDialog] = useState(false);

  const handleFolderSelect = () => {
    setShowBrowseDialog(true);
  };

  const handleFolderSelected = (path: string) => {
    setDirectoryPath(path);
  };

  const clearDirectoryPath = () => {
    setDirectoryPath('');
  };

  const fetchStatus = async (dirPath?: string) => {
    let url = '/api/rag-index';
    if (dirPath) {
      url += `?directoryPath=${encodeURIComponent(dirPath)}`;
    }
    const response = await fetch(url);
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

    const body: { source: 'database' | 'files'; directoryPath?: string } = { source };
    if (source === 'files' && directoryPath) {
      body.directoryPath = directoryPath;
    }

    const response = await fetch('/api/rag-index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    setIndexResult(data);
    setProgress(100);
    setIsIndexing(false);
    await fetchStatus(source === 'files' && directoryPath ? directoryPath : undefined);
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
                Index Markdown files from a specified directory.
                This will recursively scan all subdirectories and create vector embeddings.
              </p>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  Directory Path
                </Label>
                <div className="relative">
                  <Button
                    onClick={handleFolderSelect}
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {directoryPath || 'Select a folder...'}
                  </Button>
                  {directoryPath && (
                    <button
                      onClick={clearDirectoryPath}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Leave empty to use default content/ directory
                </p>
              </div>
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
                  {indexResult.message || indexResult.error}
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

      <BrowseDialog
        isOpen={showBrowseDialog}
        onClose={() => setShowBrowseDialog(false)}
        onSelect={handleFolderSelected}
      />
    </div>
  );
}