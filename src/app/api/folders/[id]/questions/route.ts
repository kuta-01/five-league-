import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const folderId = params.id;
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, answer')
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const res = NextResponse.json(data ?? []);
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}
