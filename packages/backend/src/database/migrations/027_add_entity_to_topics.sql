-- トピックに関連エンティティ情報を追加
ALTER TABLE topics ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);
ALTER TABLE topics ADD COLUMN IF NOT EXISTS related_entity_id INTEGER;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_topics_entity ON topics(related_entity_type, related_entity_id);
