import matter from 'gray-matter';
import { ArticleMetadata, SEOData } from '@health-content-ai/shared';

export interface MarkdownOutput {
  content: string;
  frontmatter: ArticleMetadata;
}

export function generateMarkdown(
  content: string,
  metadata: ArticleMetadata,
  seo: SEOData,
  faq: { question: string; answer: string }[]
): MarkdownOutput {
  const frontmatter: ArticleMetadata = {
    ...metadata,
    metaTitle: seo.title,
    metaDescription: seo.metaDescription,
    excerpt: seo.metaDescription.substring(0, 150) + (seo.metaDescription.length > 150 ? '...' : '')
  };

  let markdownContent = content;

  if (faq.length > 0) {
    markdownContent += '\n\n## FAQ\n\n';
    faq.forEach((item) => {
      markdownContent += `### ${item.question}\n\n${item.answer}\n\n`;
    });
  }

  const output = matter.stringify(markdownContent, frontmatter);

  return {
    content: output,
    frontmatter
  };
}

export function parseMarkdown(markdown: string): MarkdownOutput {
  const result = matter(markdown);
  return {
    content: result.content,
    frontmatter: result.data as ArticleMetadata
  };
}

export function formatSchema(
  title: string,
  description: string,
  faq: { question: string; answer: string }[]
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    author: {
      '@type': 'Organization',
      name: 'VitalsPage'
    },
    publisher: {
      '@type': 'Organization',
      name: 'VitalsPage',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vitalspage.com/logo.png'
      }
    },
    hasPart: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return JSON.stringify(schema, null, 2);
}
