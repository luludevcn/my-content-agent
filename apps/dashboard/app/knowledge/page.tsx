'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, PenLine, Save, X, ChevronRight } from 'lucide-react';

const knowledgeDocs = [
  { id: 'style-guide', title: 'Style Guide', description: 'Writing style and formatting guidelines', category: 'Writing' },
  { id: 'medical-guidelines', title: 'Medical Guidelines', description: 'Medical accuracy and safety guidelines', category: 'Medical' },
  { id: 'seo-guide', title: 'SEO Guide', description: 'Search engine optimization best practices', category: 'SEO' },
  { id: 'writing-tone', title: 'Writing Tone', description: 'Tone and voice guidelines', category: 'Writing' },
  { id: 'faq-rules', title: 'FAQ Rules', description: 'FAQ section creation guidelines', category: 'Writing' },
  { id: 'eeat', title: 'EEAT Guide', description: 'Experience, Expertise, Authoritativeness, Trust', category: 'SEO' },
];

export default function Knowledge() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');

  const handleSelectDoc = (id: string) => {
    setSelectedDoc(id);
    setContent(`# ${knowledgeDocs.find(d => d.id === id)?.title}

This is the content of the ${knowledgeDocs.find(d => d.id === id)?.title} document.

## Section 1

Content goes here...

## Section 2

More content...`);
    setIsEditing(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Knowledge</h1>
        <p className="text-gray-500 mt-2">Manage your AI knowledge base and guidelines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Knowledge Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {knowledgeDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc.id)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedDoc === doc.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{doc.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {doc.category}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {selectedDoc ? knowledgeDocs.find(d => d.id === selectedDoc)?.title : 'Select a Document'}
            </CardTitle>
            {selectedDoc && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={() => setIsEditing(false)}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <PenLine className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedDoc ? (
              isEditing ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[500px] p-4 rounded-lg border border-gray-200 font-mono text-sm resize-none"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">
                    {content}
                  </pre>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a document from the list to view</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
