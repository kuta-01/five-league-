import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const { room_id } = await request.json();
  if (!room_id) {
    return NextResponse.json({ error: 'room_id required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('games')
    .insert({ room_id, state: 'waiting', current_question_index: 0 })
    .select('id, room_id, state')
    .single();
  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('games')
        .select('id, room_id, state')
        .eq('room_id', room_id)
        .single();
      return NextResponse.json(existing);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function GET(request: NextRequest) {
  const room_id = request.nextUrl.searchParams.get('room_id');
  if (!room_id) {
    return NextResponse.json({ error: 'room_id required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('room_id', room_id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}
