import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 500, 500);
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, answer')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { question_text, answer } = await request.json();
  if (!question_text?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: 'question_text and answer required' }, { status: 400 });
  }
  const a = String(answer).trim();
  if (a.length !== 5) {
    return NextResponse.json({ error: 'answer must be exactly 5 characters' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('questions')
    .insert({ question_text: question_text.trim(), answer: a })
    .select('id, question_text, answer')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
