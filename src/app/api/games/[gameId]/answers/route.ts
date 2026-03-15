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
  const { data, error } = await supabase
    .from('round_answers')
    .upsert(
      {
        game_id: params.gameId,
        question_index: body.question_index,
        slot: body.slot,
        image_data: body.image_data ?? null,
        recognized_char: body.recognized_char ?? null,
      },
      { onConflict: 'game_id,question_index,slot' }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
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
