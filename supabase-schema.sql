-- Create conversations table
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    image_url TEXT,
    prices JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_ip VARCHAR(50),
    user_agent TEXT
);

-- Create index for faster queries
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_language ON conversations(language);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read/write (for demo)
CREATE POLICY "Enable all access for demo" ON conversations
    FOR ALL USING (true) WITH CHECK (true);

-- Create a view for popular queries
CREATE VIEW popular_queries AS
SELECT
    query,
    language,
    COUNT(*) as query_count,
    MAX(created_at) as last_asked
FROM conversations
GROUP BY query, language
ORDER BY query_count DESC
LIMIT 100;