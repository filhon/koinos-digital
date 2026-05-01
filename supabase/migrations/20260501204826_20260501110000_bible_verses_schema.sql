-- Bible verses schema
CREATE TABLE IF NOT EXISTS bible_verses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for exact searches and text matching
CREATE INDEX IF NOT EXISTS idx_bible_verses_book_chapter_verse ON bible_verses (book, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_bible_verses_version ON bible_verses (version);

-- GIN index for full text search (requires pg_trgm in extensions)
CREATE INDEX IF NOT EXISTS idx_bible_verses_text_trgm ON bible_verses USING gin (text extensions.gin_trgm_ops);

-- RLS: Public can read
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read for Bible Verses" ON bible_verses
    FOR SELECT USING (true);

-- Seed with one sample verse (João 3:16)
INSERT INTO bible_verses (book, chapter, verse, text, version)
VALUES ('Jo', 3, 16, 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.', 'JFAA')
ON CONFLICT DO NOTHING;
