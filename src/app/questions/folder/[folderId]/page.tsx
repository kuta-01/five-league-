'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

interface QuestionRow {
  id: string;
  question_text: string;
  answer: string;
}

interface FolderInfo {
  id: string;
  name: string;
}

export default function FolderQuestionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const folderId = params.folderId as string;
  const [folder, setFolder] = useState<FolderInfo | null>(null);
  const [list, setList] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchFolder = useCallback(() => {
    if (!folderId) return;
    fetch(`/api/folders/${folderId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setFolder)
      .catch(() => setFolder(null));
  }, [folderId]);

  const fetchList = useCallback(() => {
    if (!folderId) return;
    setLoading(true);
    setLoadError(null);
    fetch(`/api/questions?folder_id=${encodeURIComponent(folderId)}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) return r.json().then((err) => Promise.reject(err));
        return r.json();
      })
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('問題一覧の取得に失敗しました', err);
        setList([]);
        setLoadError(err?.error ?? '問題一覧の取得に失敗しました');
      })
      .finally(() => setLoading(false));
  }, [folderId]);

  useEffect(() => {
    fetchFolder();
  }, [fetchFolder]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 問題追加後に ?t= 付きで戻ってきた場合は再取得
  useEffect(() => {
    if (searchParams.get('t')) fetchList();
  }, [searchParams, fetchList]);

  const handleDelete = async (id: string) => {
    if (!confirm('この問題を削除しますか？')) return;
    const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('削除に失敗しました');
      return;
    }
    setList((prev) => prev.filter((q) => q.id !== id));
  };

  if (!folderId) {
    return (
      <main className="min-h-screen p-4">
        <p className="text-slate-600">フォルダが指定されていません</p>
        <Link href="/questions" className="text-rose-600 hover:underline mt-2 inline-block">← 一覧へ</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{folder?.name ?? '…'} の問題</h1>
          <Link
            href={`/questions/new?folder_id=${folderId}`}
            className="text-rose-600 font-medium hover:underline"
          >
            問題を追加
          </Link>
        </div>
        <p className="text-sm text-slate-600 mb-4">登録数: {list.length} 問</p>

        {loadError && (
          <p className="text-red-600 text-sm mb-4">⚠️ {loadError}</p>
        )}

        {loading ? (
          <p className="text-slate-500">読み込み中...</p>
        ) : (
          <ul className="space-y-2">
            {list.map((q) => (
              <li key={q.id} className="flex justify-between items-start gap-2 py-2 border-b border-slate-200">
                <span className="text-slate-800 flex-1 min-w-0">{q.question_text}</span>
                <span className="font-mono text-rose-600 shrink-0">{q.answer}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(q.id)}
                  className="shrink-0 px-2 py-1 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                  aria-label="削除"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6">
          <Link href="/questions" className="text-slate-600 hover:underline">← フォルダ一覧へ</Link>
        </p>
      </div>
    </main>
  );
}
