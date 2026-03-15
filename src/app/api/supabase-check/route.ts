import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 接続確認用（デバッグ用）
 * ブラウザで /api/supabase-check を開くと、接続結果が表示されます
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({
      ok: false,
      message: '環境変数が設定されていません',
      hasUrl: !!url,
      hasAnonKey: !!anonKey,
      hint: '.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定し、npm run dev を再起動してください',
    });
  }

  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.from('games').select('id').limit(1);
    if (error) {
      return NextResponse.json({
        ok: false,
        message: 'Supabase でエラー',
        errorMessage: error.message,
        errorCode: error.code,
        hint: 'APIキーが間違っているか、テーブルが存在しません。Supabase の「Legacy anon, service_role API keys」の anon public をコピーし直してください。',
      });
    }
    return NextResponse.json({
      ok: true,
      message: '接続成功',
      urlPrefix: url.slice(0, 30) + '...',
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({
      ok: false,
      message: '接続時に例外が発生しました',
      errorMessage: err.message,
    });
  }
}
