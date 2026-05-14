-- Migration 002: Ideas table con pgvector per RAG

-- Abilita estensioni
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabella idee
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  content TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  category VARCHAR(50) DEFAULT 'idea',
  -- gte-small usa 384 dimensioni
  embedding vector(384),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per similarity search
CREATE INDEX IF NOT EXISTS ideas_embedding_idx ON ideas USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON ideas FOR ALL USING (auth.role() = 'authenticated');

-- Funzione similarity search
CREATE OR REPLACE FUNCTION search_ideas(
  query_embedding vector(384),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE(id uuid, title text, content text, category text, project_id uuid, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id, i.title::text, i.content::text, i.category::text, i.project_id,
    1 - (i.embedding <=> query_embedding) AS similarity
  FROM ideas i
  WHERE i.embedding IS NOT NULL
    AND 1 - (i.embedding <=> query_embedding) > match_threshold
  ORDER BY i.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
