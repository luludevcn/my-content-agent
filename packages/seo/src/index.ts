import { SEOData } from '@health-content-ai/shared';

export interface SEOAnalyzerResult {
  score: number;
  issues: string[];
  suggestions: string[];
}

export class SEOAnalyzer {
  private stopWords: Set<string>;

  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
      'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'under', 'again', 'further', 'then', 'once',
      'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
      'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
      'own', 'same', 'so', 'than', 'too', 'very', 'just', 'but', 'and',
      'if', 'or', 'because', 'until', 'while', 'about', 'against', 'he',
      'she', 'it', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'us', 'them'
    ]);
  }

  analyzeContent(content: string): SEOAnalyzerResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const wordCount = this.countWords(content);
    const uniqueWords = this.countUniqueWords(content);
    const keywordDensity = this.calculateKeywordDensity(content);
    const readingLevel = this.calculateReadingLevel(content);

    if (wordCount < 1000) {
      issues.push('Content is too short');
      suggestions.push('Expand content to at least 1000 words');
      score -= 20;
    } else if (wordCount > 3000) {
      suggestions.push('Consider breaking content into multiple articles');
      score -= 5;
    }

    if (keywordDensity < 0.5) {
      issues.push('Keyword density is too low');
      suggestions.push('Include primary keywords more naturally');
      score -= 10;
    } else if (keywordDensity > 3) {
      issues.push('Keyword density is too high');
      suggestions.push('Reduce keyword repetition');
      score -= 15;
    }

    if (readingLevel > 12) {
      suggestions.push('Simplify sentence structure for better readability');
      score -= 10;
    }

    const headingCount = (content.match(/^#{1,3}\s+/gm) || []).length;
    if (headingCount < 3) {
      issues.push('Insufficient heading structure');
      suggestions.push('Add more H2 and H3 headings');
      score -= 10;
    }

    const imageCount = (content.match(/!\[.*?\]/g) || []).length;
    if (imageCount === 0) {
      suggestions.push('Add relevant images to improve engagement');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  generateSEOData(keyword: string, content: string): SEOData {
    const title = this.generateTitle(keyword, content);
    const metaDescription = this.generateMetaDescription(keyword, content);
    const slug = this.generateSlug(keyword);
    const keywords = this.extractKeywords(content, 5);

    return {
      title,
      metaDescription,
      slug,
      keywords,
    };
  }

  generateTitle(keyword: string, content: string): string {
    let title = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    
    if (title.length < 40) {
      const firstHeading = content.match(/^#{1,2}\s+(.+)$/m);
      if (firstHeading) {
        title = firstHeading[1];
      }
    }

    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }

    return title;
  }

  generateMetaDescription(keyword: string, content: string): string {
    const firstParagraph = content.match(/^([\s\S]+?)(?:\n\n|$)/);
    let description = firstParagraph ? firstParagraph[1].trim() : keyword;
    
    description = description.replace(/[#*`]/g, '');
    
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }

    if (!description.toLowerCase().includes(keyword.toLowerCase())) {
      description = `${keyword} - ${description}`;
      if (description.length > 160) {
        description = description.substring(0, 157) + '...';
      }
    }

    return description;
  }

  generateSlug(keyword: string): string {
    return keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  extractKeywords(content: string, count: number): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const wordFrequency: Record<string, number> = {};

    for (const word of words) {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 2 && !this.stopWords.has(cleaned)) {
        wordFrequency[cleaned] = (wordFrequency[cleaned] || 0) + 1;
      }
    }

    return Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word);
  }

  private countWords(content: string): number {
    return content.trim().split(/\s+/).length;
  }

  private countUniqueWords(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const unique = new Set(words.map((w) => w.replace(/[^a-z]/g, '')));
    return unique.size;
  }

  private calculateKeywordDensity(content: string): number {
    const totalWords = this.countWords(content);
    const keywords = this.extractKeywords(content, 5);
    let keywordCount = 0;

    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      keywordCount += matches ? matches.length : 0;
    }

    return totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
  }

  private calculateReadingLevel(content: string): number {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = content.trim().split(/\s+/);
    const complexWords = words.filter((w) => w.length > 6).length;

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const complexWordPercentage = (complexWords / words.length) * 100;

    return Math.round(0.4 * (avgSentenceLength + complexWordPercentage));
  }
}

export const createSEOAnalyzer = () => {
  return new SEOAnalyzer();
};
