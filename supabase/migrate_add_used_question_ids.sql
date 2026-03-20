-- 既存DB用: games に「出題済み問題ID」列を追加（同じ部屋での重複出題を避ける）
ALTER TABLE games ADD COLUMN IF NOT EXISTS used_question_ids UUID[] DEFAULT '{}';
