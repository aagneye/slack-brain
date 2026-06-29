-- pgvector column + HNSW index for retrieved_item embeddings.
-- Run after `prisma db push` / `prisma migrate` since Prisma does not yet model
-- the vector type natively. (See docs/02-architecture.md §8.4 for justification.)

ALTER TABLE retrieved_item
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS retrieved_item_embedding_idx
  ON retrieved_item
  USING hnsw (embedding vector_cosine_ops);
