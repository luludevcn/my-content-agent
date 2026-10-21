# Health Content AI

Health Content AI is an AI-assisted content workspace for creating and reviewing health articles for older adults and caregivers. It combines a Next.js dashboard, a multi-step article-generation pipeline, Ollama model calls, SEO utilities, rule-based medical-language checks, and retrieval-augmented generation (RAG).

> **Important:** This project is a learning and development project, not a medical device or a source of medical advice. Automated checks do not validate medical facts and must not replace qualified clinical review. Do not publish generated health content without appropriate human review.
>
> **Security:** Do not expose this application to the public internet until authentication, authorization, and filesystem-access controls have been implemented and verified for the API routes. See [SECURITY-REVIEW.md](./SECURITY-REVIEW.md) for the current security review and [LEARNING_PLAN.md](./LEARNING_PLAN.md) for the remediation roadmap.

## Project Structure

```text
health-content-ai/
├── apps/
│   └── dashboard/              # Next.js dashboard and API routes
│       ├── app/                 # Pages and Route Handlers
│       ├── components/          # UI components
│       └── lib/                 # Dashboard utilities
├── packages/
│   ├── agents/                  # Article-generation agents and Ollama client
│   ├── database/                # Prisma schema and persistence layer
│   ├── embeddings/              # Embedding client
│   ├── markdown/                # Markdown and schema helpers
│   ├── medical/                 # Rule-based medical-language checks
│   ├── prompts/                 # Prompt and knowledge-file loading
│   ├── rag/                     # Retrieval client
│   ├── seo/                     # SEO analysis utilities
│   └── shared/                  # Shared TypeScript types
├── knowledge/                   # Writing, SEO, and health-content guidance
├── content/                     # Example article content
├── scripts/                     # Import, diagnostics, and generation scripts
├── FEATURE_ROADMAP.md           # Product feature roadmap
├── LEARNING_PLAN.md             # Agent engineering learning and production plan
└── package.json                 # npm workspaces and Turborepo scripts
```

## Technology Stack

| Area | Technology | Current implementation |
|---|---|---|
| Web application | Next.js, React | Next.js 14.2.0, React 18 |
| Language | TypeScript | TypeScript 5.x |
| Styling | Tailwind CSS | Tailwind CSS 3.x |
| Monorepo | npm workspaces, Turborepo | Shared packages under `packages/` |
| Language model | Ollama | Local model API; default generation model is `gemma3:12b` |
| Database | SQLite, Prisma | Articles, tasks, logs, and RAG documents |
| Embeddings | Ollama embeddings API | The current request implementation uses `bge-m3` |
| RAG retrieval | Application-side cosine similarity | Vectors are stored as JSON in SQLite |

### Implementation Notes

- The current RAG implementation uses SQLite-backed vectors and application-side cosine similarity. It does **not** currently use Qdrant for retrieval, despite older references to Qdrant in project documentation and configuration.
- The generation pipeline is currently implemented as sequential TypeScript orchestration. LangGraph dependencies are present, but the main article-generation flow does not currently run as a LangGraph workflow.
- The medical package performs rule-based language checks. It is not a clinical fact-checking system.
- Embedding failures currently fall back to synthetic vectors in the embedding client. Such fallback vectors are not semantically meaningful and should not be treated as valid retrieval results in production.
- These details describe the current codebase and may change. See [LEARNING_PLAN.md](./LEARNING_PLAN.md) for a staged review and upgrade plan.

## Requirements

- Node.js 20 or later
- npm 10 or later
- Ollama running locally or at a configured URL
- Docker is optional; the current implementation does not require Qdrant

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start Ollama and download models

Install Ollama by following the [official installation instructions](https://ollama.com/download), then start the service:

```bash
ollama serve
```

In another terminal, download the default generation model and the embedding model:

```bash
ollama pull gemma3:12b
ollama pull bge-m3
```

The model names can differ from the defaults if you configure the application accordingly. The embedding request currently uses the `bge-m3` model directly.

### 3. Configure environment variables

Create `apps/dashboard/.env.local` for the dashboard runtime:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:12b
OLLAMA_TEMPERATURE=0.4
OLLAMA_CONTEXT_LENGTH=8192
DATABASE_URL=file:./dev.db
```

The Prisma schema is located at `packages/database/prisma/schema.prisma` and uses SQLite. Confirm that `DATABASE_URL` resolves to the intended database file for your local setup before running against any existing data.

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Base URL for the Ollama API |
| `OLLAMA_MODEL` | `gemma3:12b` | Generation model name |
| `OLLAMA_TEMPERATURE` | `0.4` | Generation temperature |
| `OLLAMA_CONTEXT_LENGTH` | `8192` | Ollama context length |
| `DATABASE_URL` | No application-level default | Prisma database connection string |

Do not commit `.env.local` or any credentials. The embedding client currently sends requests to the `bge-m3` model directly; changing `EMBEDDING_MODEL` alone may not change that request.

### 4. Generate the Prisma client

```bash
npm run build --workspace=@health-content-ai/database
```

This package build runs `prisma generate` before TypeScript compilation. If you change the Prisma schema, follow the repository's migration workflow and back up any local database before applying changes.

### 5. Check services and start the dashboard

```bash
npx tsx scripts/check-services.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The current diagnostic script reports the RAG storage check using legacy “Qdrant” wording even though the active RAG storage is SQLite. Use the `/api/health` response and the implementation notes above to identify the actual storage mode.

### Optional: Import example articles

```bash
npx tsx scripts/import-articles.ts
```

## Development Commands

Run the workspace build:

```bash
npm run build
```

Run all development applications:

```bash
npm run dev
```

Run only the dashboard:

```bash
cd apps/dashboard
npm run dev
```

Start the dashboard in production mode after building:

```bash
cd apps/dashboard
npm run start
```

Format TypeScript, TSX, and Markdown files:

```bash
npm run format
```

The repository currently has no root-level test script. Refer to [LEARNING_PLAN.md](./LEARNING_PLAN.md) for the testing and CI work required before production use.

## API Overview

The API routes are implemented in `apps/dashboard/app/api/`.

| Endpoint | Method | Description |
|---|---|---|
| `/api/generate` | `POST` | Generate an article and return the result as JSON |
| `/api/generate-stream` | `POST` | Generate an article and stream progress using Server-Sent Events (SSE) |
| `/api/check-duplicate` | `POST` | Check for similar existing content |
| `/api/suggest` | `POST` | Suggest related topics |
| `/api/health` | `GET` | Report model, embedding, and RAG/database status |
| `/api/articles` | `GET` | List articles |
| `/api/tasks` | `GET` | List generation tasks |
| `/api/batch-generate` | `POST` | Generate multiple articles |
| `/api/rag-index` | `POST` | Index Markdown content for retrieval |

Example request to `/api/generate`:

```json
{
  "keyword": "Why Is Walking Becoming More Difficult After 70?",
  "audience": "Seniors",
  "length": 2000,
  "category": "mobility",
  "tone": "friendly"
}
```

Example response shape:

```json
{
  "metadata": {
    "title": "...",
    "slug": "..."
  },
  "content": "...",
  "seo": {
    "title": "...",
    "metaDescription": "..."
  },
  "faq": [],
  "internalLinks": [],
  "schema": "..."
}
```

> API authentication and authorization are not yet established as a complete security boundary. Do not expose management endpoints to untrusted users until they are protected and tested.

## Article Generation Workflow

The current generation flow runs these steps:

1. **Intent analysis** — infer search intent, audience, entities, and related topics.
2. **RAG search** — retrieve related documents from the local SQLite-backed store.
3. **Outline generation** — ask the language model for an article outline and FAQs.
4. **Article writing** — generate the article from the outline and request options.
5. **Rule-based language checks** — flag or replace selected absolute or risky phrases. This does not verify medical facts.
6. **SEO processing** — create SEO metadata using local analysis utilities.
7. **Internal-link suggestions** — suggest related content from retrieval results.
8. **Markdown output** — assemble article metadata, FAQ, and schema information.

Generation results should be treated as drafts. A qualified human reviewer must verify health-related claims and sources before publication.

## Content Structure

The outline prompt currently requests a consistent article structure:

1. What is it?
2. Common causes
3. Symptoms
4. When to see a doctor
5. What may help
6. Key takeaway

## Generate a Test Article

Run the example generation script:

```bash
npx tsx scripts/generate-test-article.ts
```

Generated files are written to the `output/` directory.

## Troubleshooting

### Ollama is unavailable

Check that the service is running:

```bash
ollama serve
```

Verify `OLLAMA_BASE_URL` and check whether port `11434` is in use:

```bash
lsof -i :11434
```

### The generation model is missing

Pull the configured model and verify the installed models:

```bash
ollama pull gemma3:12b
ollama list
```

If you use a different model, set `OLLAMA_MODEL` in `apps/dashboard/.env.local` and restart the dashboard.

### The embedding model is missing

The current embedding implementation uses `bge-m3`:

```bash
ollama pull bge-m3
ollama list
```

If Ollama is unavailable, the current client may return synthetic fallback vectors. This fallback is unsuitable for semantic retrieval; do not interpret it as successful embedding generation.

### Database connection or Prisma client errors

- Confirm that `DATABASE_URL` points to the intended SQLite database.
- Regenerate the Prisma client after schema changes:

  ```bash
  npm run build --workspace=@health-content-ai/database
  ```

- Back up local database files before applying migrations or changing the schema.

### Module resolution or build errors

Install workspace dependencies and run the build:

```bash
npm install
npm run build
```

Check that the imported package and component exist and that the workspace package exports are configured correctly.

### Environment variables are not loaded

- Confirm that `.env.local` is in `apps/dashboard/`.
- Restart the development server after changing environment variables.
- Avoid printing secrets in terminal output or logs.

### Check service status

Run the diagnostic script:

```bash
npx tsx scripts/check-services.ts
```

The script may use legacy Qdrant wording for the RAG check. The active RAG implementation currently uses SQLite; see the implementation notes above.

### Article generation is slow

Possible causes include model size, hardware constraints, model startup time, and request latency. Try a smaller Ollama model for local development and measure output quality before changing generation settings.

### Memory usage is high

- Use a model that fits the available memory.
- Avoid loading more models than necessary.
- Monitor memory use during generation and adjust the local deployment configuration.

## License

This project is licensed under the MIT License.
