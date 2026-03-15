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
  const gameId = params.gameId;
  const body = await request.json().catch(() => ({}));
  const folderId = body.folder_id ?? null;

  let q = supabase.from('questions').select('id');
  if (folderId) q = q.eq('folder_id', folderId);
  const { data: questions } = await q.limit(500);
  if (!questions || questions.length < 5) {
    return NextResponse.json(
      { error: folderId ? 'そのフォルダに5問以上必要です' : 'At least 5 questions required in DB' },
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
