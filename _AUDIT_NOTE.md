# Audit Note - mcpServer

Source: `_AUDIT/reports/batch_10.md` (lines 341-364).

## Original Audit Recommendations

### What's Missing
- Advanced workflow orchestration (dynamic agent chaining).
- Knowledge base RAG integration (despite `knowledge.js` existing).
- Tool/plugin marketplace.
- Multi-model routing/fallback.
- Cost tracking.
- Deployment management.

### Custom Feature Suggestions
1. Multi-modal RAG over knowledge base.
2. Agent capability marketplace.
3. Cost optimizer.
4. Real-time workflow debugging.
5. Voice-to-action.

## Implementations Applied

Added 2 endpoints to `backend/routes/ai.js` matching the existing axios+pg+OpenRouter pattern with `auth` middleware:
- `POST /api/ai/knowledge-rag` — keyword (ILIKE) retrieval over `knowledge_base`, then LLM answer with cited Doc numbers.
- `GET /api/ai/cost-summary?days=N` — best-effort aggregate of message counts per agent and per model from existing tables.

No new dependencies. Endpoints are conservative: cost-summary only counts messages and notes that USD/token cost tracking requires a future schema change.

## Backlog (Prioritized)

### High
- Per-message usage/cost persistence (schema change required to fully realize cost tracking).
- Multi-model routing/fallback (system already calls one model only).
- Dynamic agent chaining for workflows.

### Medium
- Tool/plugin marketplace surface.
- Deployment management.
- Embeddings-based RAG (current implementation is keyword-only).

### Low / Product Decisions
- Voice-to-action.
- Real-time workflow debugger.
- Multi-modal RAG (vision + text).

## Apply pass 3 (frontend)

- LEFT-AS-IS. `frontend/src/pages/KnowledgeRagPage.js` calls `POST /ai/knowledge-rag` and `frontend/src/pages/CostSummaryPage.js` calls `GET /ai/cost-summary` via the existing `services/api.js` axios client (JWT Bearer from `localStorage`). Both pages are imported and routed in `App.js` (`/knowledge-rag`, `/cost-summary`) with sidebar nav entries.
- No code changes.

## Apply pass 4 (mechanical backlog)

Two mechanical backlog items implemented (caps at the small-feature complexity bar; no schema changes, no new deps):

- `POST /api/ai/agent-chain` in `backend/routes/ai.js` — pipes `initial_message` through a sequence of agents identified by `agent_ids`, using each agent's `system_prompt` from the `agents` table; reuses the existing `callOpenRouter` helper (which throws `err.statusCode = 503` when `OPENROUTER_API_KEY` is unset). Returns per-step input/output plus the final output.
- `POST /api/ai/multi-model-route` in `backend/routes/ai.js` — accepts an optional `primary_model` + `fallback_models` array; tries each in order via OpenRouter and returns the first success along with attempt log. Returns 503 directly when no API key is configured, 502 when all candidates fail.
- Frontend pages added under `frontend/src/pages/`: `AgentChainPage.js`, `MultiModelRoutePage.js`. Both use the existing `services/api.js` axios client (JWT Bearer auto-injected) and match the `KnowledgeRagPage.js` styling/error patterns; 503 surfaces as "AI service unavailable — OPENROUTER_API_KEY is not set on the server."
- `App.js` updated with imports, sidebar nav entries (`FiShare2`, `FiShuffle` — verified present in `react-icons/fi`), and `/agent-chain`, `/multi-model-route` routes.
- Backlog items still open: per-message usage/cost persistence (schema change), embeddings-based RAG, deployment management, real-time workflow debugger, multi-modal RAG, voice-to-action, marketplace surfaces.
- Syntax: `node --check backend/routes/ai.js` passes; `@babel/parser` (jsx) passes for `App.js`, `AgentChainPage.js`, `MultiModelRoutePage.js`.
