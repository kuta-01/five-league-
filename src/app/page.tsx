'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function HomePage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  const createRoom = () => {
    const id = uuidv4().slice(0, 8);
    router.push(`/game/${id}`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/game/${roomId.trim()}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
          ファイブリーグ
        </h1>
        <p className="text-center text-slate-600 mb-8 text-sm">
          5文字で答える問題を、5人で1文字ずつ手書き！
        </p>

        <button
          onClick={createRoom}
          className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl mb-6 transition"
        >
          部屋を作る
        </button>

        <form onSubmit={joinRoom} className="space-y-3">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="部屋コードを入力"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full py-4 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition"
          >
            参加する
          </button>
        </form>

        <p className="mt-6 text-center">
          <a href="/questions" className="text-rose-600 hover:underline text-sm">
            問題を作成する
          </a>
        </p>
      </div>
    </main>
  );
}
