import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function shuffleIds(ids: string[]): string[] {
  return [...ids].sort(() => Math.random() - 0.5);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const gameId = params.gameId;
  const body = await request.json().catch(() => ({}));
  const folderId = body.folder_id ?? null;

  let q = supabase.from('questions').select('id');
  if (folderId) q = q.eq('folder_id', folderId);
  const { data: questions } = await q.limit(1000);
  const pool = (questions ?? []).map((row) => row.id as string);
  if (pool.length < 5) {
    return NextResponse.json(
      { error: folderId ? 'そのフォルダに5問以上必要です' : 'At least 5 questions required in DB' },
      { status: 400 }
    );
  }

  const { data: gameRow, error: fetchErr } = await supabase
    .from('games')
    .select('used_question_ids')
    .eq('id', gameId)
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const used = new Set((gameRow?.used_question_ids ?? []) as string[]);
  let candidates = pool.filter((id) => !used.has(id));

  let fiveIds: string[];
  let newUsedIds: string[];

  if (candidates.length < 5) {
    fiveIds = shuffleIds(pool).slice(0, 5);
    newUsedIds = [...fiveIds];
  } else {
    fiveIds = shuffleIds(candidates).slice(0, 5);
    newUsedIds = [...Array.from(used), ...fiveIds];
  }

  const { data: game, error } = await supabase
    .from('games')
    .update({
      state: 'countdown',
      current_question_index: 0,
      question_ids: fiveIds,
      used_question_ids: newUsedIds,
      reveal_slot: 0,
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
