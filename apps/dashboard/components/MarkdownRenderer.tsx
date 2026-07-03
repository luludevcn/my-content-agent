'use client';

import { useEffect, useState } from 'react';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    const processMarkdown = async () => {
      const result = await remark().use(remarkHtml).process(content);
      setHtml(result.toString());
    };
    processMarkdown();
  }, [content]);

  return (
    <div className={`prose prose-sm max-w-none ${className || ''}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
