'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface FolderRow {
  id: string;
  name: string;
  created_at: string;
}

export default function QuestionsPage() {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchFolders = useCallback(() => {
    setLoading(true);
    fetch('/api/folders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setFolders(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || '作成に失敗しました');
        setCreating(false);
        return;
      }
      const created = await res.json();
      setNewFolderName('');
      fetchFolders();
      window.location.href = `/questions/folder/${created.id}`;
    } catch {
      alert('通信エラー');
    }
    setCreating(false);
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`フォルダ「${folderName}」を削除しますか？中身の問題もすべて削除されます。`)) return;
    const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || '削除に失敗しました');
      return;
    }
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
  };

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-2">問題一覧</h1>
        <p className="text-sm text-slate-600 mb-4">
          作問フォルダを選ぶと、その中身の問題を作成・編集できます。一覧ではフォルダ名のみ表示され、問題文は見えません。
        </p>

        <form onSubmit={handleCreateFolder} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="新規フォルダ名"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={creating || !newFolderName.trim()}
            className="px-4 py-2 bg-rose-500 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {creating ? '作成中...' : '新規フォルダ作成'}
          </button>
        </form>

        {loading ? (
          <p className="text-slate-500">読み込み中...</p>
        ) : (
          <ul className="space-y-2">
            {folders.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <Link
                  href={`/questions/folder/${f.id}`}
                  className="flex-1 block py-3 px-4 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-800"
                >
                  {f.name}
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleDeleteFolder(e, f.id, f.name)}
                  className="shrink-0 px-2 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                  aria-label="フォルダを削除"
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
