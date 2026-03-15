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
  const { slot, name } = await request.json();
  if (slot == null || !name?.trim()) {
    return NextResponse.json({ error: 'slot and name required' }, { status: 400 });
  }
  const slotNum = Number(slot);
  if (slotNum < 1 || slotNum > 5) {
    return NextResponse.json({ error: 'slot must be 1-5' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('game_players')
    .upsert(
      { game_id: params.gameId, slot: slotNum, name: name.trim() },
      { onConflict: 'game_id,slot' }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const { data, error } = await supabase
    .from('game_players')
    .select('*')
    .eq('game_id', params.gameId)
    .order('slot');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const slot = request.nextUrl.searchParams.get('slot');
  if (slot == null) {
    return NextResponse.json({ error: 'slot required' }, { status: 400 });
  }
  const slotNum = Number(slot);
  if (slotNum < 1 || slotNum > 5) {
    return NextResponse.json({ error: 'slot must be 1-5' }, { status: 400 });
  }
  const { error } = await supabase
    .from('game_players')
    .delete()
    .eq('game_id', params.gameId)
    .eq('slot', slotNum);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
