import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseClient(): SupabaseClient | null {
  if (typeof supabaseUrl === 'string' && typeof supabaseAnonKey === 'string' && supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return null;
}

export const supabase = createSupabaseClient();

export type GameState =
  | 'waiting'      // 参加者待ち
  | 'countdown'    // 開始前カウントダウン
  | 'drawing'      // 手書き中
  | 'reveal'       // 1文字ずつ公開中
  | 'judge'        // 正解判定（GMがオーバーライド可能）
  | 'result'       // 正解/不正解表示
  | 'next'         // 次の問題へ
  | 'finished';    // 5問終了

export interface Question {
  id: string;
  question_text: string;
  answer: string; // 5文字
  created_at?: string;
}

export interface Game {
  id: string;
  room_id: string;
  state: GameState;
  current_question_index: number;
  question_ids: string[];
  /** この部屋で過去に出題済みの問題ID（同一部屋内の重複を避ける） */
  used_question_ids?: string[];
  reveal_slot: number;
  round_started_at: string | null;
  correct: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  slot: number; // 1-5
  name: string;
  joined_at: string;
}

export interface RoundAnswer {
  id: string;
  game_id: string;
  question_index: number;
  slot: number;
  image_data: string | null; // base64
  recognized_char: string | null;
  created_at: string;
}
