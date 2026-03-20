import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 古いゲームデータを削除する（game_players / round_answers は CASCADE で連動削除）
 * Vercel Cron から 1 日 1 回などで呼び出す想定。
 *
 * 認証: Authorization: Bearer <CRON_SECRET>
 * または ?secret=<CRON_SECRET>（手動テスト用）
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 }
    );
  }

  const auth = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const ok =
    auth === `Bearer ${secret}` || (querySecret !== null && querySecret === secret);

  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const daysParam = request.nextUrl.searchParams.get('days');
  const days = Math.min(
    365,
    Math.max(1, daysParam ? parseInt(daysParam, 10) || 7 : Number(process.env.CLEANUP_RETENTION_DAYS) || 7)
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  const { error } = await supabase.from('games').delete().lt('created_at', cutoffIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deletedOlderThan: cutoffIso,
    retentionDays: days,
    note: 'games と CASCADE 先（game_players, round_answers）が対象です',
  });
}
