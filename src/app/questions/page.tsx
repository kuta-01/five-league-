'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface QuestionRow {
  id: string;
  question_text: string;
  answer: string;
}

export default function QuestionsPage() {
  const [list, setList] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(() => {
    setLoading(true);
    fetch('/api/questions?limit=500')
      .then((r) => r.json())
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = async (id: string) => {
    if (!confirm('この問題を削除しますか？')) return;
    const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('削除に失敗しました');
      return;
    }
    setList((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">問題一覧</h1>
          <Link href="/questions/new" className="text-rose-600 font-medium hover:underline">
            新規作成
          </Link>
        </div>
        <p className="text-sm text-slate-600 mb-4">登録数: {list.length} 問（最大500問利用）</p>
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
          <Link href="/" className="text-slate-600 hover:underline">← トップへ</Link>
        </p>
      </div>
    </main>
  );
}
