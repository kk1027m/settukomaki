-- 発注依頼数量を追跡するカラムを追加
ALTER TABLE parts ADD COLUMN IF NOT EXISTS order_request_quantity INTEGER NOT NULL DEFAULT 0;

-- part_historyのaction_typeに'発注済'を追加
ALTER TABLE part_history DROP CONSTRAINT IF EXISTS part_history_action_type_check;
ALTER TABLE part_history ADD CONSTRAINT part_history_action_type_check
  CHECK (action_type IN ('入庫', '出庫', '調整', '発注', '入庫(発注分)', '発注済'));
