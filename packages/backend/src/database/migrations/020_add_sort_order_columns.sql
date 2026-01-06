-- 給油箇所に並び替え順序カラムを追加
ALTER TABLE lubrication_points ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 部品交換スケジュールに並び替え順序カラムを追加
ALTER TABLE replacement_schedules ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 部品在庫に並び替え順序カラムを追加
ALTER TABLE parts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 作業手順に並び替え順序カラムを追加
ALTER TABLE maintenance_procedures ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- トピックに並び替え順序カラムを追加
ALTER TABLE topics ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- お問い合わせに並び替え順序カラムを追加
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
