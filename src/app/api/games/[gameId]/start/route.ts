import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  _request: Request,
  { params }: { params: { gameId: string } }
) {
  const gameId = params.gameId;

  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .limit(500);
  if (!questions || questions.length < 5) {
    return NextResponse.json(
      { error: 'At least 5 questions required in DB' },
      { status: 400 }
    );
  }
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const fiveIds = shuffled.slice(0, 5).map((q) => q.id);

  const { data: game, error } = await supabase
    .from('games')
    .update({
      state: 'countdown',
      current_question_index: 0,
      question_ids: fiveIds,
      round_started_at: null,
      correct: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(game);
}
