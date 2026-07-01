# Health Content AI

一个基于 AI 的健康内容生成平台，专为老年人健康和护理领域设计。该平台集成了本地大语言模型、向量数据库和 SEO 优化工具，能够自动生成高质量、医学准确的健康文章。

## 📁 项目结构

```
health-content-ai/
├── apps/
│   └── dashboard/              # Next.js 前端仪表盘
│       ├── app/                # 应用路由和页面
│       │   ├── api/            # API 端点
│       │   ├── new-article/    # 新文章生成页面
│       │   ├── optimize/       # SEO 优化页面
│       │   ├── topic-planner/  # 主题规划页面
│       │   ├── knowledge/      # 知识库页面
│       │   ├── prompt-studio/  # 提示词工作室页面
│       │   └── settings/       # 设置页面
│       ├── components/         # UI 组件
│       └── lib/                # 工具函数
├── packages/
│   ├── agents/                 # AI 代理核心逻辑
│   ├── prompts/                # 提示词模板
│   ├── seo/                    # SEO 分析器
│   ├── medical/                # 医疗审核器
│   ├── rag/                    # RAG 检索客户端
│   ├── embeddings/             # 嵌入模型客户端
│   ├── markdown/               # Markdown 处理工具
│   └── shared/                 # 共享类型定义
├── knowledge/                  # 知识库文档
├── content/                    # 示例文章内容
├── scripts/                    # 辅助脚本
├── turbo.json                  # Turborepo 配置
└── package.json                # 根包配置
```

## 🛠️ 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 14.2.0 |
| UI 框架 | React | 18.x |
| 样式 | Tailwind CSS | 3.4.x |
| UI 组件 | Shadcn | 4.12.x |
| 语言 | TypeScript | 5.4.x |
| 构建工具 | Turborepo | 2.0.x |
| 大语言模型 | Ollama | 本地部署 |
| 向量数据库 | Qdrant | 本地部署 |
| 嵌入模型 | BGE-M3 | 通过 Ollama |

## 📋 系统要求

- Node.js >= 20.x
- npm >= 10.x
- Ollama (本地大语言模型服务)
- Qdrant (向量数据库服务)

## 🚀 快速开始

### 1. 安装依赖

```bash
cd health-content-ai
npm install
```

### 2. 启动外部服务

#### 启动 Ollama

```bash
# 安装 Ollama (根据官方文档)
# https://ollama.com/download

# 启动 Ollama 服务
ollama serve

# 拉取必要的模型
ollama pull qwen3:14b
ollama pull bge-m3
```

#### 启动 Qdrant

```bash
# 使用 Docker 启动 Qdrant
docker run -p 6333:6333 -v $(pwd)/qdrant_data:/qdrant/storage qdrant/qdrant
```

### 3. 检查服务状态

```bash
npx tsx scripts/check-services.ts
```

预期输出：
```
=== Health Content AI Service Check ===

Ollama: ✅ Online
Embedding Model: ✅ Online
Qdrant: ✅ Online
Qdrant Documents: 0

=== Check Complete ===
```

### 4. 导入示例文章（可选）

```bash
npx tsx scripts/import-articles.ts
```

### 5. 启动开发服务器

```bash
# 启动所有应用（推荐）
npm run dev

# 或仅启动 dashboard
cd apps/dashboard
npm run dev
```

访问 http://localhost:3000 查看仪表盘。

## 🔧 配置说明

### 环境变量

项目支持以下环境变量配置：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `OLLAMA_BASE_URL` | http://localhost:11434 | Ollama API 地址 |
| `QDRANT_URL` | http://localhost:6333 | Qdrant API 地址 |
| `EMBEDDING_MODEL` | BGE-M3 | 嵌入模型名称 |

创建 `.env.local` 文件进行配置：

```bash
# apps/dashboard/.env.local
OLLAMA_BASE_URL=http://localhost:11434
QDRANT_URL=http://localhost:6333
```

### 模型配置

默认使用 `qwen3:14b` 作为生成模型，`bge-m3` 作为嵌入模型。如需更换模型，修改以下文件：

- [ollama.ts](packages/agents/src/ollama.ts) - 修改 `createOllamaClient` 函数中的默认模型
- [embeddings/src/index.ts](packages/embeddings/src/index.ts) - 修改嵌入模型配置

## 🏗️ 构建与部署

### 构建项目

```bash
# 构建所有包和应用
npm run build

# 或仅构建 dashboard
cd apps/dashboard
npm run build
```

### 生产环境启动

```bash
cd apps/dashboard
npm run start
```

## 🔍 API 端点

### 文章生成

**POST** `/api/generate`

请求体：
```json
{
  "keyword": "Why Is Walking Becoming More Difficult After 70?",
  "audience": "Seniors",
  "length": 2000,
  "category": "mobility",
  "tone": "friendly"
}
```

响应：
```json
{
  "metadata": { "title": "...", "slug": "..." },
  "content": "...",
  "seo": { "title": "...", "metaDescription": "..." },
  "faq": [...],
  "internalLinks": [...],
  "schema": "..."
}
```

### 流式文章生成

**POST** `/api/generate-stream`

返回 Server-Sent Events (SSE)，实时推送生成进度。

### 重复检测

**POST** `/api/check-duplicate`

请求体：
```json
{ "keyword": "knee pain" }
```

### 主题建议

**POST** `/api/suggest`

请求体：
```json
{ "keyword": "arthritis" }
```

### 健康检查

**GET** `/api/health`

返回各服务的在线状态。

## 📝 文章生成流程

文章生成包含以下步骤：

1. **意图分析** - 分析搜索意图和目标受众
2. **RAG 检索** - 从知识库检索相关文章
3. **大纲生成** - 生成文章结构和 FAQ
4. **内容写作** - 根据大纲生成正文内容
5. **医疗审核** - 审核医学准确性和安全性
6. **SEO 优化** - 生成标题、元描述和关键词
7. **内部链接** - 建议相关文章链接
8. **Markdown 导出** - 生成最终 Markdown 文件

## 📚 内容模板

所有生成的文章遵循固定结构：

1. **What is it?** - 定义和概述
2. **Common causes** - 常见原因
3. **Symptoms** - 症状描述
4. **When to see a doctor** - 就医建议
5. **What may help** - 改善方法和建议
6. **Key takeaway** - 要点总结

## 🧪 测试文章生成

运行测试脚本生成示例文章：

```bash
npx tsx scripts/generate-test-article.ts
```

生成的文章保存在 `output/` 目录下。

## 🧹 代码格式化

```bash
npm run format
```

## 📊 项目统计

- 文章类别：10 种（关节炎、心脏健康、 mobility、平衡、营养、运动、心理健康、老年护理、慢性疼痛、防跌倒）
- 语气风格：5 种（友好、专业、权威、对话、共情）
- 输出格式：Markdown + Frontmatter + Schema 标记

## 📄 License

MIT License
