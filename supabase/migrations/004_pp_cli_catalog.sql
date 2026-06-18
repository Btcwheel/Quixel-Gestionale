-- Migration 004: Catalogo CLI da printingpress.dev con RAG

CREATE TABLE IF NOT EXISTS pp_cli_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100),
  description TEXT NOT NULL,
  path TEXT,
  printer VARCHAR(100),
  -- embedding su "name + description" per RAG nella chat
  embedding vector(384),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pp_cli_catalog_embedding_idx
  ON pp_cli_catalog USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

ALTER TABLE pp_cli_catalog ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow all for authenticated" ON pp_cli_catalog FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ricerca CLI per similarity
CREATE OR REPLACE FUNCTION search_clis(
  query_embedding vector(384),
  match_count int DEFAULT 3,
  match_threshold float DEFAULT 0.45
)
RETURNS TABLE(id uuid, name text, category text, description text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.name::text, c.category::text, c.description::text,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM pp_cli_catalog c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
