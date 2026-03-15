import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const folderId = request.nextUrl.searchParams.get('folder_id');
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 500, 500);
  let q = supabase
    .from('questions')
    .select('id, question_text, answer')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (folderId) q = q.eq('folder_id', folderId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const res = NextResponse.json(data ?? []);
  if (folderId) res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}

export async function POST(request: NextRequest) {
  const { folder_id, question_text, answer } = await request.json();
  if (!folder_id) {
    return NextResponse.json({ error: 'folder_id required' }, { status: 400 });
  }
  if (!question_text?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: 'question_text and answer required' }, { status: 400 });
  }
  const a = String(answer).trim();
  if (a.length !== 5) {
    return NextResponse.json({ error: 'answer must be exactly 5 characters' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('questions')
    .insert({ folder_id, question_text: question_text.trim(), answer: a })
    .select('id, question_text, answer')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
