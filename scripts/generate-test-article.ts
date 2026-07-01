import { ArticleGenerationRequest, Category, Tone } from '@health-content-ai/shared';
import { ArticleGenerator, createOllamaClient } from '@health-content-ai/agents';
import fs from 'fs';
import path from 'path';

async function generateTestArticle() {
  const request: ArticleGenerationRequest = {
    keyword: 'Why Is Walking Becoming More Difficult After 70?',
    audience: 'Seniors',
    length: 2000,
    category: 'mobility' as Category,
    tone: 'friendly' as Tone,
  };

  const client = createOllamaClient();
  const generator = new ArticleGenerator(client);

  console.log('Generating article...\n');

  const result = await generator.generate(request, (step) => {
    console.log(`[${step.status.toUpperCase()}] ${step.name}`);
  });

  const markdown = `---
title: "${result.metadata.title}"
metaTitle: "${result.seo.title}"
metaDescription: "${result.seo.metaDescription}"
excerpt: "${result.metadata.excerpt}"
slug: "${result.seo.slug}"
category: "${result.metadata.category}"
tags: ${JSON.stringify(result.seo.keywords)}
---

${result.content}

## FAQ

${result.faq.map((faq) => `### ${faq.question}\n\n${faq.answer}\n`).join('\n')}

---

*This article is for informational purposes only and should not be taken as medical advice. Always consult with a qualified healthcare professional.*
`;

  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${result.seo.slug}.md`);
  fs.writeFileSync(outputPath, markdown);

  console.log(`\nArticle generated successfully!`);
  console.log(`Output: ${outputPath}`);
  console.log(`Word count: ${result.content.split(/\s+/).length}`);
}

generateTestArticle().catch(console.error);
