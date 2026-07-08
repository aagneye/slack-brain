# 05 — Sequence & Architecture Diagrams

- [19. Sequence Diagrams](#19-sequence-diagrams)
- [20. Architecture Diagrams](#20-architecture-diagrams)

All diagrams are Mermaid; they render in GitHub/GitLab and most Markdown viewers.

---

## 19. Sequence Diagrams

### 19.1 End-to-end: Task → Context Pack → Send to AI

```mermaid
sequenceDiagram
    autonumber
    actor U as Engineer
    participant S as Slack
    participant API as API Gateway (Next.js)
    participant Q as Redis/BullMQ
    participant W as Worker (Pipeline)
    participant CN as MCP Connectors
    participant DB as Postgres+pgvector
    participant LG as LLM Gateway
    participant M as LLM (Claude/GPT)

    U->>S: /slackbrain "Checkout API failing"
    S->>API: signed command
    API->>API: verify sig, resolve user/workspace
    API->>Q: enqueue context_job
    API-->>S: ack "Building Context Pack…"
    Q->>W: deliver job

    W->>W: Task understanding (intent, entities, checklist)
    W->>S: progress: understanding

    par fan-out retrieval
        W->>CN: search(slack, query)
        W->>CN: search(github, query)
    end
    CN-->>W: normalized RetrievedItems
    W->>DB: persist items (+embeddings)
    W->>S: progress: retrieving (counts)

    W->>W: rank (hybrid + boosts)
    W->>W: verify: dedupe, staleness, gaps, (contradiction)
    W->>S: progress: verifying (dupes removed, gaps, conflicts)
    W->>W: compress + assemble Pack + confidence
    W->>DB: store ContextPack + audit events
    W->>S: Pack summary card (confidence, sections, actions)

    U->>S: click "Send to Claude"
    S->>API: signed interaction
    API->>LG: format Pack(included items) → prompt
    LG->>M: send
    M-->>LG: answer
    LG->>DB: audit llm_send
    API-->>S: post answer in thread
```

### 19.2 Retrieval fan-out with graceful degradation

```mermaid
sequenceDiagram
    autonumber
    participant W as Worker
    participant R as Redis cache
    participant C as Connector(kind)
    participant X as External API

    W->>R: GET cache:conn:{kind}:{qhash}
    alt cache hit
        R-->>W: cached results
    else miss
        W->>C: search(query) [timeout 8s, breaker]
        alt success
            C->>X: API call (rate-limited)
            X-->>C: raw results
            C-->>W: normalized items
            W->>R: SET cache (TTL 5–15m)
        else timeout/error
            C-->>W: error
            W->>W: mark connector degraded → job=partial (warn, not fail)
        end
    end
```

### 19.3 Verification stage (internal)

```mermaid
flowchart TD
    A[Ranked items] --> B[Dedupe: hash + cosine clustering]
    B --> C[Pick canonical per cluster]
    C --> D[Staleness: age + superseded rules]
    D --> E[Contradiction: vector-neighbor pairs → claim extract → NLI/LLM judge]
    E --> F[Gaps: required-info checklist − satisfied]
    F --> G[Annotated items + contradictions + missingInfo]
    G --> H[Confidence scoring]
```

### 19.4 Slack interaction: trim items before send

```mermaid
sequenceDiagram
    actor U as Engineer
    participant S as Slack
    participant API as API
    participant DB as Postgres
    U->>S: click "Trim items"
    S->>API: interaction
    API->>S: views.open (modal: item checkboxes)
    U->>S: toggle items, Submit
    S->>API: view_submission
    API->>DB: PATCH pack items.included
    API-->>S: confirm "2 items excluded"
    U->>S: click "Send to GPT"
    Note over API: only included items sent
```

---

## 20. Architecture Diagrams

### 20.1 Logical system architecture

```mermaid
flowchart TB
  subgraph Clients
    SL[Slack Workspace]
    WB[Web Review App]
  end

  subgraph Edge[Next.js App / API Gateway]
    EV[/slack/events,commands,interactions/]
    REST[/REST + SSE/]
  end

  subgraph Async
    RQ[(Redis: queue + cache + pubsub)]
    WK[Worker Pool]
  end

  subgraph CoreEngine[Context Pack Engine - packages/core]
    TU[Task Understanding]
    RK[Ranking]
    VF[Verification]
    CP[Compression]
    CF[Confidence]
    PG2[Pack Generator]
  end

  subgraph Integrations[MCP Connector Layer]
    K1[Slack Search]:::c
    K2[GitHub]:::c
    K3[Jira]:::c
    K4[Docs]:::c
    K5[Deploys]:::c
    K6[Incidents]:::c
  end

  subgraph Data
    PSQL[(PostgreSQL + pgvector)]
    SEC[(KMS / Secret Store)]
  end

  subgraph AI[LLM Gateway]
    O[OpenAI]
    A[Anthropic]
    C[Cursor]
  end

  SL --> EV
  WB --> REST
  EV --> RQ
  REST <--> RQ
  RQ --> WK
  WK --> CoreEngine
  TU --> RK --> VF --> CP --> CF --> PG2
  CoreEngine --> Integrations --> EXT[(External SaaS APIs)]
  CoreEngine --> PSQL
  Integrations -. tokens .-> SEC
  PG2 --> AI
  WK --> RQ
  EV & REST & WK --> AUDIT[Audit Logger] --> PSQL

  classDef c fill:#eef,stroke:#88f;
```

### 20.2 Deployment view

```mermaid
flowchart LR
  subgraph Cloud
    LB[HTTPS Load Balancer] --> WEBC[web/api containers x N]
    WEBC --> REDIS[(Redis - managed)]
    WORKER[worker containers x N] --> REDIS
    WEBC --> PGM[(PostgreSQL + pgvector - managed)]
    WORKER --> PGM
    WORKER --> SECRETS[(Secret Manager / KMS)]
    WEBC --> SECRETS
    WORKER -->|egress| SAAS[Slack/GitHub/Jira/Docs APIs]
    WORKER -->|egress| LLMS[OpenAI / Anthropic]
    subgraph Observability
      OTEL[OpenTelemetry Collector]
      DASH[Traces / Metrics / Logs]
    end
    WEBC --> OTEL
    WORKER --> OTEL --> DASH
  end
  SLACK[Slack] --> LB
  USER[Engineer browser] --> LB
```

### 20.3 Data model (ER) overview

```mermaid
erDiagram
  WORKSPACE ||--o{ APP_USER : has
  WORKSPACE ||--o{ CONNECTOR : has
  WORKSPACE ||--o{ CONTEXT_JOB : has
  APP_USER  ||--o{ CONTEXT_JOB : requests
  CONTEXT_JOB ||--|| CONTEXT_PACK : produces
  CONTEXT_JOB ||--o{ RETRIEVED_ITEM : gathers
  CONTEXT_JOB ||--o{ AUDIT_EVENT : logs
  CONTEXT_PACK ||--o{ CONTRADICTION : flags
  CONTEXT_PACK ||--o{ MISSING_INFO : flags
  CONTEXT_PACK ||--o{ LLM_SEND : sent_via
  APP_USER ||--o{ FEEDBACK : gives
  CONTEXT_PACK ||--o{ FEEDBACK : about
```

### 20.4 Request lifecycle / state machine

```mermaid
stateDiagram-v2
  [*] --> queued
  queued --> understanding
  understanding --> retrieving
  retrieving --> ranking
  ranking --> verifying
  verifying --> compressing
  compressing --> scoring
  scoring --> generating
  generating --> done
  retrieving --> partial: some connector failed
  partial --> ranking
  understanding --> failed: fatal error
  done --> [*]
  failed --> [*]
```

### 20.5 Hexagonal module boundaries

```mermaid
flowchart LR
  subgraph Core[packages/core - pure, no I/O]
    direction TB
    L[Domain logic: ranking, verification, confidence, pack]
  end
  subgraph Ports
    P1[ConnectorPort]
    P2[LLMPort]
    P3[EmbeddingPort]
    P4[Store]
    P5[EventBus]
  end
  subgraph Adapters
    A1[MCP connectors]
    A2[OpenAI/Anthropic]
    A3[Embeddings]
    A4[Postgres repos]
    A5[Redis pubsub]
  end
  L --> Ports
  P1 --> A1
  P2 --> A2
  P3 --> A3
  P4 --> A4
  P5 --> A5
```
