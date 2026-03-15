-- ファイブリーグ DB schema (Supabase / PostgreSQL)
-- Supabase ダッシュボードの SQL Editor で実行してください

-- 作問フォルダ（誰かのフォルダ＝問題一覧で見える単位。中身はフォルダに入らないと見えない）
CREATE TABLE IF NOT EXISTS question_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 問題テーブル（フォルダに所属）
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES question_folders(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer VARCHAR(5) NOT NULL CHECK (char_length(answer) = 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_folder_id ON questions(folder_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- ゲームテーブル（1ゲーム = 5問）
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(32) UNIQUE NOT NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'waiting',
  current_question_index INTEGER NOT NULL DEFAULT 0,
  question_ids UUID[] DEFAULT '{}',
  reveal_slot INTEGER DEFAULT 0,  -- 公開済みのスロット数 (0-5)
  round_started_at TIMESTAMPTZ,
  correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ゲーム参加者（最大5人）
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 5),
  name VARCHAR(50) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);

-- 各ラウンドの回答（手書き1文字）
CREATE TABLE IF NOT EXISTS round_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 5),
  image_data TEXT,
  recognized_char VARCHAR(1),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, question_index, slot)
);

CREATE INDEX IF NOT EXISTS idx_round_answers_game_question ON round_answers(game_id, question_index);

-- Realtime を有効化（games の変更を購読）
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- RLS（Row Level Security）
ALTER TABLE question_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon folders" ON question_folders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read questions" ON questions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert questions" ON questions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon delete questions" ON questions FOR DELETE TO anon USING (true);
CREATE POLICY "Allow anon games" ON games FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon game_players" ON game_players FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon round_answers" ON round_answers FOR ALL TO anon USING (true) WITH CHECK (true);
