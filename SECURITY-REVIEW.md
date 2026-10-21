# Security Review

**Review date:** 2026-10-21
**Scope:** Read-only code review of API routes, task/article access, filesystem browsing and RAG indexing, with deployment-relevant health-content risks in scope.
**Limitations:** This is not a penetration test, dependency audit, compliance assessment, or exhaustive review of every route and deployment configuration. The findings are conditional on the application being reachable by untrusted users.

## Findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟡 MEDIUM | [articles/route.ts](./apps/dashboard/app/api/articles/route.ts), [tasks/route.ts](./apps/dashboard/app/api/tasks/route.ts), [generate-stream/route.ts](./apps/dashboard/app/api/generate-stream/route.ts), [database/src/index.ts](./packages/database/src/index.ts) | 4-13; 4-12; 75-80, 174-178; 133-148 | Management APIs lack authentication/authorization checks. If exposed to untrusted users, callers may read article/task data or submit generation requests; the streaming generation path persists articles as `published`. | 9/10 |
| 2 | 🟡 MEDIUM | [browse-directory/route.ts](./apps/dashboard/app/api/browse-directory/route.ts), [rag-index/route.ts](./apps/dashboard/app/api/rag-index/route.ts) | 5-10, 21-30; 53-74 | Directory browsing and Markdown indexing accept caller-supplied paths without restricting access to an approved content root. If remotely callable, a caller may enumerate directory names and ingest files outside the intended content directory. Public readback of ingested file contents was not confirmed. | 9/10 |

## Recommended remediation

1. Require authentication for management endpoints and enforce authorization at every API route. Default to deny; allow anonymous access only for explicitly public read-only operations.
2. Restrict filesystem operations to server-configured content roots after canonical path resolution. Reject path traversal and symlink escapes; cap file types, sizes, counts, and recursion depth.
3. Add negative authorization and path-boundary tests, including anonymous requests, insufficient privileges, traversal paths, symlink escapes, and oversized imports.
4. Before public deployment, review every Route Handler and verify the deployed network boundary. Follow remediation with an authorized security regression test.

The related learning and remediation roadmap is documented in [LEARNING_PLAN.md](./LEARNING_PLAN.md).
