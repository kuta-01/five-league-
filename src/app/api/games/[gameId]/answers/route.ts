import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const body = await request.json();
  const questionIndex = body.question_index ?? 0;
  const { data, error } = await supabase
    .from('round_answers')
    .upsert(
      {
        game_id: params.gameId,
        question_index: questionIndex,
        slot: body.slot,
        image_data: body.image_data ?? null,
        recognized_char: body.recognized_char ?? null,
      },
      { onConflict: 'game_id,question_index,slot' }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 全5人が回答済みなら自動で正解判定フェーズ（reveal）へ
  const { count, error: countError } = await supabase
    .from('round_answers')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', params.gameId)
    .eq('question_index', questionIndex);
  if (!countError && (count ?? 0) >= 5) {
    await supabase
      .from('games')
      .update({ state: 'reveal', reveal_slot: 1 })
      .eq('id', params.gameId);
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const qi = request.nextUrl.searchParams.get('question_index');
  const slot = request.nextUrl.searchParams.get('slot');
  if (qi === null || slot === null) {
    return NextResponse.json({ error: 'question_index and slot required' }, { status: 400 });
  }
  const { error } = await supabase
    .from('round_answers')
    .delete()
    .eq('game_id', params.gameId)
    .eq('question_index', parseInt(qi, 10))
    .eq('slot', parseInt(slot, 10));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const qi = request.nextUrl.searchParams.get('question_index');
  const { data, error } = await supabase
    .from('round_answers')
    .select('*')
    .eq('game_id', params.gameId)
    .eq('question_index', qi ?? 0)
    .order('slot');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
