'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function NewQuestionPage() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folder_id');

  const [questionText, setQuestionText] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (folderId === null) return;
    if (!folderId) {
      window.location.href = '/questions';
    }
  }, [folderId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderId) return;
    setError(null);
    const q = questionText.trim();
    const a = answer.trim();
    if (!q || !a) {
      setError('問題文と答え（5文字）を入力してください');
      return;
    }
    if (a.length !== 5) {
      setError('答えは5文字で入力してください');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId, question_text: q, answer: a }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '保存に失敗しました');
        setSaving(false);
        return;
      }
      setDone(true);
      setQuestionText('');
      setAnswer('');
    } catch {
      setError('通信エラー');
    }
    setSaving(false);
  };

  if (!folderId) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <p className="text-slate-600">フォルダが指定されていません</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen p-4 flex flex-col items-center justify-center">
        <p className="text-green-600 font-bold">保存しました</p>
        <div className="flex gap-4 mt-4">
          <Link href={`/questions/new?folder_id=${folderId}`} className="text-rose-600 hover:underline">もう1問追加</Link>
          <Link href={`/questions/folder/${folderId}?t=${Date.now()}`} className="text-slate-600 hover:underline">フォルダへ</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">問題を追加</h1>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">問題文（5文字で答えられる問題）</label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="例：日本の首都は？"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">答え（5文字）</label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.slice(0, 5))}
              placeholder="例：とうきょう"
              className="w-full px-4 py-2 border rounded-lg font-mono"
              maxLength={5}
            />
            <p className="text-xs text-slate-500 mt-1">{answer.length} / 5 文字</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-rose-500 text-white font-bold rounded-lg disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
        <p className="mt-4">
          <Link href={`/questions/folder/${folderId}`} className="text-slate-600 hover:underline">← フォルダへ</Link>
        </p>
      </div>
    </main>
  );
}
