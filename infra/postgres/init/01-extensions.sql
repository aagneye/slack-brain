-- Enable required PostgreSQL extensions for Context Pack Engine.
-- pgvector powers embedding similarity (ranking, dedupe, contradiction candidates).
CREATE EXTENSION IF NOT EXISTS vector;
-- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
