export interface MedicalReviewResult {
  reviewedContent: string;
  issues: MedicalIssue[];
  suggestions: string[];
}

export interface MedicalIssue {
  type: 'claim' | 'warning' | 'disclaimer' | 'terminology';
  original: string;
  corrected: string;
  explanation: string;
}

const DANGEROUS_CLAIMS = [
  { pattern: /\bcure[s]?\b/gi, replacement: 'may help reduce', category: 'claim' },
  { pattern: /\btreat[s]?\b/gi, replacement: 'may help manage', category: 'claim' },
  { pattern: /\bprevent[s]?\b/gi, replacement: 'may help reduce the risk of', category: 'claim' },
  { pattern: /\bguarantee[s]?\b/gi, replacement: 'may help', category: 'claim' },
  { pattern: /\balways\b/gi, replacement: 'often', category: 'warning' },
  { pattern: /\bnever\b/gi, replacement: 'rarely', category: 'warning' },
  { pattern: /\bsurely\b/gi, replacement: 'possibly', category: 'warning' },
  { pattern: /\bcertaily\b/gi, replacement: 'possibly', category: 'warning' },
];

const MEDICAL_TERMS: Record<string, string> = {
  'high blood pressure': 'hypertension',
  'low blood pressure': 'hypotension',
  'heart attack': 'myocardial infarction',
  'stroke': 'cerebrovascular accident',
  'high cholesterol': 'hyperlipidemia',
};

export class MedicalReviewer {
  review(content: string): MedicalReviewResult {
    const issues: MedicalIssue[] = [];
    const suggestions: string[] = [];
    let reviewedContent = content;

    for (const dangerousClaim of DANGEROUS_CLAIMS) {
      const matches = reviewedContent.match(dangerousClaim.pattern);
      if (matches) {
        matches.forEach((match) => {
          const corrected = reviewedContent.replace(
            dangerousClaim.pattern,
            dangerousClaim.replacement
          );
          
          issues.push({
            type: dangerousClaim.category as MedicalIssue['type'],
            original: match,
            corrected: dangerousClaim.replacement,
            explanation: `Replaced absolute claim "${match}" with cautious language`,
          });
        });
        reviewedContent = reviewedContent.replace(
          dangerousClaim.pattern,
          dangerousClaim.replacement
        );
      }
    }

    if (!reviewedContent.includes('consult') && !reviewedContent.includes('healthcare')) {
      suggestions.push('Consider adding a recommendation to consult a healthcare professional');
    }

    if (!reviewedContent.includes('informational purposes only')) {
      suggestions.push('Consider adding a disclaimer that content is for informational purposes only');
    }

    const hasDisclaimer = /disclaimer|for informational purposes only/gi.test(reviewedContent);
    if (!hasDisclaimer) {
      issues.push({
        type: 'disclaimer',
        original: '',
        corrected: '*This article is for informational purposes only and should not be taken as medical advice. Always consult with a qualified healthcare professional.*',
        explanation: 'Missing medical disclaimer',
      });
    }

    const sentenceCount = reviewedContent.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    if (sentenceCount > 50) {
      suggestions.push('Consider breaking long sections into shorter paragraphs for readability');
    }

    return {
      reviewedContent,
      issues,
      suggestions,
    };
  }

  validateClaim(claim: string): { valid: boolean; concerns: string[] } {
    const concerns: string[] = [];

    if (DANGEROUS_CLAIMS.some((c) => c.pattern.test(claim))) {
      concerns.push('Contains potentially dangerous or absolute claims');
    }

    if (claim.length > 200) {
      concerns.push('Claim is too long and may be confusing');
    }

    if (!/may|might|could|possibly|often|sometimes/i.test(claim)) {
      concerns.push('Claim lacks cautious language');
    }

    return {
      valid: concerns.length === 0,
      concerns,
    };
  }

  suggestImprovement(claim: string): string {
    let improved = claim;
    
    for (const dangerousClaim of DANGEROUS_CLAIMS) {
      improved = improved.replace(dangerousClaim.pattern, dangerousClaim.replacement);
    }

    if (!improved.includes('may')) {
      improved = 'Studies suggest that ' + improved;
    }

    return improved;
  }
}

export const createMedicalReviewer = () => {
  return new MedicalReviewer();
};
