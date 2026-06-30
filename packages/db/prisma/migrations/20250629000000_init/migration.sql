-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "workspace" (
    "id" TEXT NOT NULL,
    "slack_team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "slack_user_id" TEXT NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "token_ref" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "last_health" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "context_job" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "task_text" TEXT NOT NULL,
    "intent" TEXT,
    "entities" JSONB NOT NULL DEFAULT '[]',
    "time_window" JSONB,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "stage_detail" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "source_channel" TEXT,
    "thread_ts" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "context_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "context_pack" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "permalink_slug" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "confidence_factors" JSONB NOT NULL DEFAULT '{}',
    "pack_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "context_pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retrieved_item" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "url" TEXT,
    "author" TEXT,
    "source_created_at" TIMESTAMP(3),
    "source_updated_at" TIMESTAMP(3),
    "content_hash" TEXT,
    "relevance" DOUBLE PRECISION,
    "flags" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retrieved_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contradiction" (
    "id" TEXT NOT NULL,
    "pack_id" TEXT NOT NULL,
    "item_a" TEXT,
    "item_b" TEXT,
    "claim_a" TEXT,
    "claim_b" TEXT,
    "reason" TEXT,
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "contradiction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missing_info" (
    "id" TEXT NOT NULL,
    "pack_id" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "missing_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_send" (
    "id" TEXT NOT NULL,
    "pack_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "token_budget" INTEGER,
    "included_items" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL,
    "response_ref" TEXT,
    "cost_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_send_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" BIGSERIAL NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "actor" TEXT,
    "job_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_slack_team_id_key" ON "workspace"("slack_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_workspace_id_slack_user_id_key" ON "app_user"("workspace_id", "slack_user_id");

-- CreateIndex
CREATE INDEX "context_job_workspace_id_created_at_idx" ON "context_job"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "context_job_status_idx" ON "context_job"("status");

-- CreateIndex
CREATE UNIQUE INDEX "context_pack_job_id_key" ON "context_pack"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "context_pack_permalink_slug_key" ON "context_pack"("permalink_slug");

-- CreateIndex
CREATE INDEX "context_pack_workspace_id_created_at_idx" ON "context_pack"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "retrieved_item_job_id_idx" ON "retrieved_item"("job_id");

-- CreateIndex
CREATE INDEX "retrieved_item_content_hash_idx" ON "retrieved_item"("content_hash");

-- CreateIndex
CREATE INDEX "audit_event_workspace_id_created_at_idx" ON "audit_event"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_event_job_id_idx" ON "audit_event"("job_id");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector" ADD CONSTRAINT "connector_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "context_job" ADD CONSTRAINT "context_job_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "context_job" ADD CONSTRAINT "context_job_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "context_pack" ADD CONSTRAINT "context_pack_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "context_job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retrieved_item" ADD CONSTRAINT "retrieved_item_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "context_job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contradiction" ADD CONSTRAINT "contradiction_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "context_pack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missing_info" ADD CONSTRAINT "missing_info_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "context_pack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_send" ADD CONSTRAINT "llm_send_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "context_pack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "context_job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

