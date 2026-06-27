# 04 — Roadmap, MVP Scope, Future Features & Risks

- [15. Development Roadmap](#15-development-roadmap)
- [16. MVP Scope](#16-mvp-scope)
- [17. Future Features](#17-future-features)
- [18. Risks](#18-risks)

---

## 15. Development Roadmap

### 15.1 Phased plan (beyond the hackathon)

| Phase | Theme | Highlights |
|---|---|---|
| **P0 — Hackathon MVP (18 days)** | Prove the loop | Slack trigger → Slack+GitHub retrieval → rank → dedupe → gaps → confidence → Pack card → Send to one LLM → audit |
| **P1 — Trust depth** | Make the Pack defensible | Jira + Docs connectors, contradiction detection, compression/summaries, feedback loop, web Pack page |
| **P2 — Breadth** | More sources & models | Confluence/Notion, deploys, incidents; multi-model send; permalinks/sharing |
| **P3 — Enterprise** | Sell it | Multi-tenant hardening, RBAC, SOC2-track controls, usage metering/billing, admin analytics |
| **P4 — Intelligence** | Get smarter | Learned ranking from feedback, auto-refresh Packs on new events, agent-to-agent MCP exposure |

### 15.2 18-day hackathon schedule (3 sprints)

**Sprint 1 (Days 1–6) — Skeleton & spine**
- Day 1: Repo, monorepo tooling, docker-compose (Postgres+pgvector, Redis), env, CI.
- Day 2: DB schema + migrations; ports/types in `core`; BullMQ wiring; SSE plumbing.
- Day 3: Slack app (Bolt): signature verify, slash command, ack + progress `chat.update`.
- Day 4: GitHub + Slack connectors (search/fetch/normalize) behind `ConnectorPort`.
- Day 5: Embeddings + hybrid ranking; per-connector concurrency, timeouts, caching.
- Day 6: End-to-end "thin slice": task → retrieve (Slack+GitHub) → rank → store items.

**Sprint 2 (Days 7–12) — The brain & the Pack**
- Day 7: Dedupe (hash + cosine clustering).
- Day 8: Missing-context (required-info checklist) + staleness flags.
- Day 9: Confidence scoring (transparent formula + breakdown).
- Day 10: Pack Generator + Slack Pack summary card (Block Kit).
- Day 11: LLM Gateway + "Send to Claude/GPT"; audit logging across pipeline.
- Day 12: Web Pack page (`/p/[slug]`) + live progress page; integrate SSE.

**Sprint 3 (Days 13–18) — Trust, polish, demo**
- Day 13: Contradiction detection (vector-neighbor pairs → LLM judge) — *stretch, scope-flexible*.
- Day 14: Compression/summaries; trim-items modal; feedback 👍/👎.
- Day 15: Connector admin + health; error/empty/partial states.
- Day 16: Observability (OTel traces, metrics), seed/demo dataset, performance pass + caching.
- Day 17: UI polish (enterprise look), accessibility, copy; harden Slack interactions.
- Day 18: Buffer, bug bash, demo script + recording, deploy.

> Days 13 and 14 carry the flexible scope: if behind, ship contradiction detection as a simpler
> heuristic and keep compression minimal.

---

## 16. MVP Scope

### 16.1 In scope (must demo)
1. **Slack Agent**: slash command, ack < 3s, live progress, Pack summary card, Send-to-AI buttons.
2. **Retrieval**: **Slack Real-Time Search + GitHub** (two strong sources beat six shallow ones).
3. **Ranking**: hybrid lexical + embedding with recency boost.
4. **Verification (subset)**: **duplicate detection** + **missing-context detection** +
   **staleness flags**. (Contradiction = stretch.)
5. **Confidence scoring** with explainable breakdown.
6. **Context Pack Generator** with the required sections + source citations.
7. **LLM Gateway**: Send to **one** provider end-to-end (Claude *or* GPT), architected for both.
8. **Audit & Logging**: append-only events for the full pipeline.
9. **Web Pack page** + live progress (enterprise-clean).

### 16.2 Explicitly out of MVP
- Write-back to any system; auto-remediation.
- Confluence/Notion, deploy, incident connectors (mock/seed for demo if needed).
- Multi-tenant billing/metering; full RBAC beyond member/admin.
- Multi-model parallel send; learned ranking.

### 16.3 MVP success criteria
- Live demo: type a task in Slack → watch progress → review a cited, scored Pack flagging a real
  duplicate and a real gap → click Send → get a model answer — all in < 60s, fully audit-logged.

---

## 17. Future Features

- **Auto-refreshing Packs:** subscribe to new deploys/incidents and update an open Pack live.
- **Learned relevance:** train ranking on 👍/👎 feedback per workspace.
- **Agent-to-agent MCP:** expose Context Packs as an MCP tool so Cursor/Claude can *request* a Pack
  autonomously before acting.
- **Contradiction graph:** maintain a knowledge graph of claims/ownership to detect conflicts across
  time, not just within a job.
- **Proactive context:** detect an incident channel forming and pre-build a Pack unprompted.
- **Pack templates** per task type (incident, change-prep, onboarding) with tailored checklists.
- **Inline IDE panel:** Cursor extension that shows the Pack beside the code.
- **Cost & quality router:** choose model automatically by Pack size/criticality/budget.
- **Enterprise:** SSO/SCIM, data-residency regions, customer-managed keys, SOC2/ISO, admin analytics.
- **Quality eval harness:** golden tasks with expected sources to regression-test retrieval quality.

---

## 18. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Slack Real-Time Search API access/limits** (availability, scopes, rate limits) | Med | High | Confirm API access day 1; build connector behind a port; fallback to `search.messages`/seeded data for demo |
| R2 | **Retrieval quality is mediocre** (irrelevant Packs) | Med | High | Hybrid ranking + recency/entity boosts; eval harness with golden tasks; tune thresholds; feedback loop |
| R3 | **Contradiction detection is hard/noisy** | High | Med | Treat as stretch; start with high-precision heuristics; show low-confidence flags, never block |
| R4 | **Latency budget blown** (six APIs + embeddings + LLM) | Med | High | Concurrency, per-connector timeouts, caching, partial results, narrow MVP to 2 sources |
| R5 | **Prompt injection via retrieved content** | Med | High | Treat content as untrusted data; instruction/content separation; no auto-actions; sanitize |
| R6 | **Token/data egress & cost** | Med | Med | Compression, token budgets, embedding/result caching, model routing, usage metering |
| R7 | **Permission leakage across users/workspaces** | Low | High | Per-user scoping, tenant isolation, row-level checks, security review |
| R8 | **Scope creep across 12 components in 18 days** | High | High | Strict MVP cut (§16); flexible-scope days; "architected for, not built" for stretch parts |
| R9 | **Connector API churn / outages** | Med | Med | Adapter pattern, circuit breakers, health checks, graceful degradation |
| R10 | **Demo fragility** (live external APIs failing on stage) | Med | High | Seeded/cached demo dataset + recorded fallback; deterministic demo path |
| R11 | **Confidence score mistrusted/gamed** | Low | Med | Make it explainable (factor breakdown), calibrate against feedback, never present as ground truth |
