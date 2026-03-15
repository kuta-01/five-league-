-- 既存DB用マイグレーション: フォルダを追加し、既存問題を「平原」フォルダへ
-- すでに schema.sql でテーブルを作成済みのプロジェクトで、Supabase SQL Editor でこのファイルの内容を実行してください

-- 1. フォルダテーブルが無ければ作成
CREATE TABLE IF NOT EXISTS question_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. questions に folder_id が無ければ追加（nullable で一旦）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE questions ADD COLUMN folder_id UUID REFERENCES question_folders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. 「平原」フォルダを作成（既にあればスキップ）
INSERT INTO question_folders (name)
SELECT '平原' WHERE NOT EXISTS (SELECT 1 FROM question_folders WHERE name = '平原');

-- 4. 既存の全問題を平原フォルダに紐付け
UPDATE questions
SET folder_id = (SELECT id FROM question_folders WHERE name = '平原' LIMIT 1)
WHERE folder_id IS NULL;

-- 5. folder_id を NOT NULL に
ALTER TABLE questions ALTER COLUMN folder_id SET NOT NULL;

-- 6. インデックス
CREATE INDEX IF NOT EXISTS idx_questions_folder_id ON questions(folder_id);

-- 7. RLS ポリシー（既存の questions ポリシーはそのまま。folders 用を追加）
ALTER TABLE question_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon folders" ON question_folders;
CREATE POLICY "Allow anon folders" ON question_folders FOR ALL TO anon USING (true) WITH CHECK (true);
