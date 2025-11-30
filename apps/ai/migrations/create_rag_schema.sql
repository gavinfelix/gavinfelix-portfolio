-- Migration: Create RAG storage schema with documents and document_chunks tables
-- Run this SQL in your Supabase SQL editor
--
-- STEP 1: Enable the vector extension in Supabase Dashboard first:
--   - Go to Database > Extensions
--   - Search for "vector" and click Enable
--   OR run this command (if you have permissions):
--   CREATE EXTENSION IF NOT EXISTS vector;

-- Enable vector extension (may require admin permissions)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on documents.user_id for efficient user document lookups
CREATE INDEX IF NOT EXISTS idx_documents_user_id 
  ON documents(user_id);

-- Create index on document_chunks.document_id for efficient chunk retrieval by document
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id 
  ON document_chunks(document_id);

-- Create index on document_chunks.chunk_index for efficient ordering within documents
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id_chunk_index 
  ON document_chunks(document_id, chunk_index);

-- Create IVFFlat index on document_chunks.embedding for approximate nearest neighbor search
-- Note: IVFFlat index requires some data in the table to build properly.
-- If you get an error, you can create this index later after inserting data,
-- or use the HNSW index alternative shown below instead.
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_ivfflat 
  ON document_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Alternative HNSW index (better for empty tables, uncomment to use instead of IVFFlat above):
-- DROP INDEX IF EXISTS idx_document_chunks_embedding_ivfflat;
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
--   ON document_chunks
--   USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);

-- Add comments to tables
COMMENT ON TABLE documents IS 'Stores uploaded documents for RAG (Retrieval-Augmented Generation)';
COMMENT ON TABLE document_chunks IS 'Stores text chunks from documents with their vector embeddings for semantic search';

-- Add comments to columns
COMMENT ON COLUMN document_chunks.chunk_index IS 'Sequential index of the chunk within its document (0, 1, 2, ...)';
COMMENT ON COLUMN document_chunks.embedding IS 'Vector embedding of dimension 1536 for text-embedding-3-small model';
COMMENT ON COLUMN documents.original_filename IS 'Original filename of the uploaded document';
