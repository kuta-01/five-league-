import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 同じ部屋で再度プレイする: 回答データを消し、待機状態に戻す（参加者はそのまま）
 */
export async function POST(
  _request: Request,
  { params }: { params: { gameId: string } }
) {
  const gameId = params.gameId;

  const { error: delErr } = await supabase.from('round_answers').delete().eq('game_id', gameId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const { data, error } = await supabase
    .from('games')
    .update({
      state: 'waiting',
      current_question_index: 0,
      question_ids: [],
      reveal_slot: 0,
      correct: null,
      round_started_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
