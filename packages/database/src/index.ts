import { PrismaClient } from './generated/client';

export * from './generated/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaOptions(): any {
  const options: any = {};
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    options.datasourceUrl = databaseUrl;
  }
  return options;
}

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  
  const prisma = new PrismaClient(getPrismaOptions());
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
  
  return prisma;
}

export const prisma = getPrismaClient();

export async function createTask(data: {
  keyword: string;
  audience: string;
  length: number;
  category: string;
  tone: string;
}): Promise<any> {
  const client = getPrismaClient();
  return client.task.create({
    data: {
      keyword: data.keyword,
      audience: data.audience,
      length: data.length,
      category: data.category,
      tone: data.tone,
      status: 'pending',
    },
  });
}

export async function updateTaskStatus(taskId: string, status: string): Promise<any> {
  const client = getPrismaClient();
  return client.task.update({
    where: { id: taskId },
    data: { status, updatedAt: new Date() },
  });
}

export async function updateTaskProgress(taskId: string, progress: number): Promise<any> {
  const client = getPrismaClient();
  return client.task.update({
    where: { id: taskId },
    data: { progress, updatedAt: new Date() },
  });
}

export async function updateTaskError(taskId: string, error: string): Promise<any> {
  const client = getPrismaClient();
  return client.task.update({
    where: { id: taskId },
    data: { error, status: 'failed', updatedAt: new Date() },
  });
}

export async function getTask(taskId: string): Promise<any> {
  const client = getPrismaClient();
  return client.task.findUnique({
    where: { id: taskId },
    include: { logs: { orderBy: { timestamp: 'asc' } } },
  });
}

export async function getTasks(status?: string): Promise<any[]> {
  const client = getPrismaClient();
  const where: any = {};
  if (status) {
    where.status = status;
  }
  return client.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function cancelTask(taskId: string): Promise<any> {
  const client = getPrismaClient();
  return client.task.update({
    where: { id: taskId },
    data: { status: 'cancelled', updatedAt: new Date() },
  });
}

export async function addTaskLog(taskId: string, step: string, message: string, level: string = 'info'): Promise<any> {
  const client = getPrismaClient();
  return client.taskLog.create({
    data: {
      taskId,
      step,
      message,
      level,
    },
  });
}

export async function createArticle(taskId: string, data: {
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  seoTitle: string;
  seoKeywords: string[];
  seoSchema: string;
}): Promise<any> {
  const client = getPrismaClient();
  return client.article.create({
    data: {
      taskId,
      title: data.title,
      slug: data.slug,
      content: data.content,
      category: data.category,
      tags: JSON.stringify(data.tags),
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      excerpt: data.excerpt,
      seoTitle: data.seoTitle,
      seoKeywords: JSON.stringify(data.seoKeywords),
      seoSchema: data.seoSchema,
      status: 'published',
    },
  });
}

export async function getArticles(limit: number = 20, offset: number = 0): Promise<any[]> {
  const client = getPrismaClient();
  const articles = await client.article.findMany({
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
  });
  return articles.map(a => ({
    ...a,
    tags: JSON.parse(a.tags || '[]'),
    seoKeywords: JSON.parse(a.seoKeywords || '[]'),
  }));
}

export async function getArticleById(id: string): Promise<any> {
  const client = getPrismaClient();
  const article = await client.article.findUnique({
    where: { id },
  });
  if (!article) return null;
  return {
    ...article,
    tags: JSON.parse(article.tags || '[]'),
    seoKeywords: JSON.parse(article.seoKeywords || '[]'),
  };
}

export async function getArticleBySlug(slug: string): Promise<any> {
  const client = getPrismaClient();
  const article = await client.article.findUnique({
    where: { slug },
  });
  if (!article) return null;
  return {
    ...article,
    tags: JSON.parse(article.tags || '[]'),
    seoKeywords: JSON.parse(article.seoKeywords || '[]'),
  };
}

export async function getArticleCount(): Promise<number> {
  const client = getPrismaClient();
  return client.article.count();
}

export async function getTaskCount(status?: string): Promise<number> {
  const client = getPrismaClient();
  const where: any = {};
  if (status) {
    where.status = status;
  }
  return client.task.count({ where });
}

export interface RagDocumentInput {
  id: string;
  title: string;
  content: string;
  url: string;
  category: string;
  embedding: number[];
}

export async function addRagDocument(document: RagDocumentInput): Promise<any> {
  const client = getPrismaClient();
  return client.ragDocument.create({
    data: {
      id: document.id,
      title: document.title,
      content: document.content,
      url: document.url,
      category: document.category,
      embedding: JSON.stringify(document.embedding),
    },
  });
}

export async function getRagDocuments(): Promise<any[]> {
  const client = getPrismaClient();
  const docs = await client.ragDocument.findMany();
  return docs.map(d => ({
    ...d,
    embedding: JSON.parse(d.embedding),
  }));
}

export async function getRagDocumentCount(): Promise<number> {
  const client = getPrismaClient();
  return client.ragDocument.count();
}

export async function searchRagDocuments(queryEmbedding: number[], limit: number = 10): Promise<any[]> {
  const client = getPrismaClient();
  const documents = await client.ragDocument.findMany();
  
  const results = documents.map(doc => {
    const embedding = JSON.parse(doc.embedding);
    const score = cosineSimilarity(queryEmbedding, embedding);
    return {
      ...doc,
      embedding,
      score,
    };
  }).filter(r => r.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return results;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}