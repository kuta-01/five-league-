'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game, GamePlayer, GameState, RoundAnswer } from '@/lib/supabase';
import HandwritingCanvas from '@/components/HandwritingCanvas';
import Timer from '@/components/Timer';
import { useSound } from '@/components/SoundProvider';

const PLAYER_STORAGE_KEY = 'fiveleague_player';

function getStoredPlayer(roomId: string): { slot: number; name: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, { slot: number; name: string }>;
    return all[roomId] || null;
  } catch {
    return null;
  }
}

function setStoredPlayer(roomId: string, slot: number, name: string) {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[roomId] = { slot, name };
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [answers, setAnswers] = useState<RoundAnswer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{ question_text: string; answer: string } | null>(null);
  const [mySlot, setMySlot] = useState<number | null>(null);
  const [myName, setMyName] = useState('');
  const [joinSlot, setJoinSlot] = useState(1);
  const [joinName, setJoinName] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasResetKey, setCanvasResetKey] = useState(0);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [questionSource, setQuestionSource] = useState<'all' | 'folder'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const timeUpFired = useRef(false);
  const resultSoundKeyRef = useRef('');
  const { playCorrect, playWrong } = useSound();

  const gameId = game?.id;

  const fetchGame = useCallback(async () => {
    const res = await fetch(`/api/games?room_id=${encodeURIComponent(roomId)}`);
    if (!res.ok) {
      setError('部屋が見つかりません');
      return null;
    }
    const data = await res.json();
    setGame(data);
    return data;
  }, [roomId]);

  const fetchPlayers = useCallback(async () => {
    if (!gameId) return;
    const res = await fetch(`/api/games/${gameId}/players`);
    if (res.ok) {
      const data = await res.json();
      setPlayers(data);
    }
  }, [gameId]);

  const fetchAnswers = useCallback(async () => {
    if (!gameId || game?.state === 'waiting' || game?.state === 'countdown') return;
    const qi = game?.current_question_index ?? 0;
    const res = await fetch(`/api/games/${gameId}/answers?question_index=${qi}`);
    if (res.ok) setAnswers(await res.json());
  }, [gameId, game?.current_question_index, game?.state]);

  const fetchCurrentQuestion = useCallback(async () => {
    if (!game?.question_ids?.length || game.current_question_index == null) return;
    const qid = game.question_ids[game.current_question_index];
    if (!qid) return;
    const res = await fetch(`/api/questions/${qid}`);
    if (res.ok) setCurrentQuestion(await res.json());
  }, [game?.question_ids, game?.current_question_index]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      let g = await fetchGame();
      if (!g) {
        const createRes = await fetch(`/api/games`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_id: roomId }),
        });
        const created = createRes.ok ? await createRes.json() : null;
        if (created) {
          setGame(created);
          setError(null);
        } else {
          g = await fetchGame();
          if (!g) {
            const err = await createRes.json().catch(() => ({}));
            setError(err.error || '部屋の作成に失敗しました。Supabaseの設定を確認してください。');
          }
        }
      }
      setLoading(false);
    })();
  }, [roomId, fetchGame]);

  useEffect(() => {
    if (!gameId) return;
    fetchPlayers();
  }, [gameId, fetchPlayers]);

  useEffect(() => {
    if (searchParams.get('rejoin') === '1') {
      setMySlot(null);
      setMyName('');
      return;
    }
    const stored = getStoredPlayer(roomId);
    if (stored) {
      setMySlot(stored.slot);
      setMyName(stored.name);
    }
  }, [roomId, searchParams]);

  // ゲーム状態を定期的に取得（クライアントでは Supabase を直接使わず API 経由のみで Invalid API key を防ぐ）
  useEffect(() => {
    if (!gameId || !game) return;
    const pollId = setInterval(fetchGame, 2000);
    return () => clearInterval(pollId);
  }, [gameId, game?.id, fetchGame]);

  // 待機中は参加者リストも定期的に更新（人数が変わるようにする）
  useEffect(() => {
    if (!gameId || game?.state !== 'waiting') return;
    const pollPlayers = () => fetchPlayers();
    pollPlayers();
    const id = setInterval(pollPlayers, 2000);
    return () => clearInterval(id);
  }, [gameId, game?.state, fetchPlayers]);

  // GM用: 出題元フォルダ一覧を取得
  useEffect(() => {
    if (game?.state !== 'waiting' || mySlot !== 1) return;
    fetch('/api/folders')
      .then((r) => r.json())
      .then((data) => setFolders(Array.isArray(data) ? data : []))
      .catch(() => setFolders([]));
  }, [game?.state, mySlot]);

  useEffect(() => {
    if (!game) return;
    if (game.state === 'drawing') timeUpFired.current = false;
    fetchCurrentQuestion();
    if (game.state === 'drawing' || game.state === 'reveal' || game.state === 'judge' || game.state === 'result') {
      fetchAnswers();
    }
  }, [game?.state, game?.current_question_index, fetchCurrentQuestion, fetchAnswers, game]);

  useEffect(() => {
    if (!game || game.state !== 'result' || game.correct == null) return;
    const key = `${game.current_question_index}-${game.correct}`;
    if (resultSoundKeyRef.current === key) return;
    resultSoundKeyRef.current = key;
    if (game.correct) {
      playCorrect();
    } else {
      playWrong();
    }
  }, [game?.state, game?.correct, game?.current_question_index, playCorrect, playWrong, game]);

  useEffect(() => {
    if (game?.state !== 'countdown') return;
    setCountdown(3);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c == null || c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [game?.state]);

  useEffect(() => {
    if (countdown === 0 && game?.state === 'countdown' && gameId) {
      fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: 'drawing',
          round_started_at: new Date().toISOString(),
        }),
      });
    }
  }, [countdown, game?.state, gameId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId || !joinName.trim()) return;
    const res = await fetch(`/api/games/${gameId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot: joinSlot, name: joinName.trim() }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || '参加に失敗しました');
      return;
    }
    setStoredPlayer(roomId, joinSlot, joinName.trim());
    setMySlot(joinSlot);
    setMyName(joinName.trim());
    setError(null);
    fetchPlayers();
  };

  const handleStart = async () => {
    if (!gameId || mySlot !== 1) return;
    const body = questionSource === 'folder' && selectedFolderId
      ? { folder_id: selectedFolderId }
      : {};
    const res = await fetch(`/api/games/${gameId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || '開始に失敗しました');
      return;
    }
    const data = await res.json();
    setGame(data);
  };

  const handleTimeUp = useCallback(async () => {
    if (!gameId || game?.state !== 'drawing' || timeUpFired.current) return;
    timeUpFired.current = true;
    const qi = game.current_question_index;
    await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'reveal', reveal_slot: 1 }),
    });
    const ansRes = await fetch(`/api/games/${gameId}/answers?question_index=${qi}`);
    if (ansRes.ok) setAnswers(await ansRes.json());
  }, [gameId, game?.state, game?.current_question_index]);

  const handleCanvasSave = async (dataUrl: string) => {
    if (!gameId || game?.state !== 'drawing' || mySlot == null) return;
    await fetch(`/api/games/${gameId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_index: game.current_question_index,
        slot: mySlot,
        image_data: dataUrl,
        recognized_char: null,
      }),
    });
    await fetchAnswers();
    // 全員提出で判定フェーズに移行している可能性があるため即時反映
    await fetchGame();
  };

  const handleRetryEdit = async () => {
    if (!gameId || game?.state !== 'drawing' || mySlot == null) return;
    await fetch(
      `/api/games/${gameId}/answers?question_index=${game.current_question_index}&slot=${mySlot}`,
      { method: 'DELETE' }
    );
    await fetchAnswers();
    setCanvasResetKey((k) => k + 1);
  };

  const handleRevealNext = async () => {
    if (!gameId || mySlot !== 1) return;
    const nextSlot = (game?.reveal_slot ?? 0) + 1;
    await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reveal_slot: nextSlot,
        state: nextSlot >= 5 ? 'judge' : 'reveal',
      }),
    });
  };

  const handleJudge = async (correct: boolean) => {
    if (!gameId || mySlot !== 1) return;
    await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'result', correct }),
    });
  };

  const handleRejoinAsOther = useCallback(async () => {
    if (!gameId || mySlot == null) return;
    await fetch(`/api/games/${gameId}/players?slot=${mySlot}`, { method: 'DELETE' });
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    delete all[roomId];
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(all));
    setMySlot(null);
    setMyName('');
    fetchPlayers();
  }, [gameId, mySlot, roomId]);

  const handleNext = async () => {
    if (!gameId || mySlot !== 1) return;
    const nextIndex = (game?.current_question_index ?? 0) + 1;
    if (nextIndex >= 5) {
      await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'finished' }),
      });
      return;
    }
    await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: 'drawing',
        current_question_index: nextIndex,
        round_started_at: new Date().toISOString(),
        correct: null,
        reveal_slot: 0,
      }),
    });
    setAnswers([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">読み込み中...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-600 text-center mb-4">{error || '部屋を読み込めませんでした'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-200 rounded-lg mr-2"
        >
          再読み込み
        </button>
        <a href="/" className="mt-4 text-rose-600 hover:underline">トップへ戻る</a>
      </div>
    );
  }

  if (mySlot == null) {
    return (
      <main className="min-h-screen p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-xl font-bold text-center mb-4">参加する</h1>
          <p className="text-sm text-slate-600 text-center mb-4">スロットと名前を選んでください</p>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">文字の位置（1〜5）</label>
              <select
                value={joinSlot}
                onChange={(e) => setJoinSlot(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s}文字目</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">名前</label>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="ニックネーム"
                className="w-full px-4 py-2 border rounded-lg"
                maxLength={20}
              />
            </div>
            <button type="submit" className="w-full py-3 bg-rose-500 text-white font-bold rounded-lg">
              参加する
            </button>
          </form>
        </div>
      </main>
    );
  }

  const state = game.state as GameState;
  const isGM = mySlot === 1;
  const roundStartedAt = game.round_started_at ? new Date(game.round_started_at).getTime() : null;

  if (state === 'countdown') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <p className="text-6xl font-bold text-rose-500">{countdown ?? 3}</p>
        <p className="mt-4 text-slate-600">ゲーム開始まで</p>
      </main>
    );
  }

  if (state === 'drawing') {
    return (
      <main className="min-h-screen p-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-slate-600 mb-1">
            第 {game.current_question_index + 1} 問 / 5問
          </p>
          <p className="text-xl font-bold text-center mb-4">{currentQuestion?.question_text}</p>
          <div className="flex justify-center mb-4">
            <Timer
              startAt={roundStartedAt}
              onExpire={handleTimeUp}
              running={true}
            />
          </div>
          <p className="text-center text-sm text-slate-500 mb-2">
            {currentQuestion?.answer?.split('').map((_, i) => (i + 1 === mySlot ? '？' : '・')).join('')} ← あなたは{mySlot}文字目
          </p>
          <div className="flex justify-center">
            <HandwritingCanvas
              slot={mySlot}
              disabled={false}
              submitted={answers.some((a) => a.slot === mySlot)}
              resetKey={canvasResetKey}
              onSave={handleCanvasSave}
              width={200}
              height={200}
            />
          </div>
          {answers.some((a) => a.slot === mySlot) && (
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={handleRetryEdit}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300"
              >
                書き直す
              </button>
            </div>
          )}
          <p className="text-center text-xs text-slate-400 mt-4">
            {answers.some((a) => a.slot === mySlot) ? '提出済みです。全員が確定するか時間で判定に進みます。「書き直す」で再編集できます。' : '書けたら「確定」を押してください'}
          </p>
        </div>
      </main>
    );
  }

  if (state === 'reveal' || state === 'judge') {
    const revealUpTo = game.reveal_slot ?? 0;
    const sortedAnswers = [...answers].sort((a, b) => a.slot - b.slot);
    const answerChars = currentQuestion?.answer?.split('') ?? [];
    const allRevealed = revealUpTo >= 5;
    return (
      <main className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-slate-600 mb-1">第 {game.current_question_index + 1} 問</p>
          <p className="text-lg font-bold text-center mb-4">{currentQuestion?.question_text}</p>
          <p className="text-center text-slate-600 mb-2">
            {allRevealed ? '全員の文字が公開されました。正解と照合してGMが判定します。' : '書いた文字を1文字ずつ公開します。正解は全員分の文字が公開されるまで表示されません。'}
          </p>
          <div className="flex justify-center gap-3 mb-6 flex-wrap">
            {[1, 2, 3, 4, 5].map((s) => {
              const a = sortedAnswers.find((x) => x.slot === s);
              const revealed = s <= revealUpTo;
              const expectedChar = answerChars[s - 1];
              return (
                <div key={s} className="flex flex-col items-center">
                  <div className="w-20 h-20 border-2 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                    {revealed && a?.image_data ? (
                      <img src={a.image_data} alt={`${s}文字目`} className="w-full h-full object-contain" />
                    ) : revealed ? (
                      <span className="text-slate-400 text-sm">未提出</span>
                    ) : (
                      <span className="text-slate-300">?</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 mt-1">{s}文字目</span>
                  {allRevealed && revealed && expectedChar && (
                    <span className="text-xs text-slate-600">正解: {expectedChar}</span>
                  )}
                </div>
              );
            })}
          </div>
          {allRevealed && (
            <p className="text-center text-slate-600 mb-4">
              正解: <span className="font-bold">{currentQuestion?.answer}</span>
            </p>
          )}
          {state === 'reveal' && isGM && revealUpTo < 5 && (
            <div className="flex justify-center">
              <button
                onClick={handleRevealNext}
                className="px-6 py-3 bg-rose-500 text-white font-bold rounded-xl"
              >
                次の文字を公開
              </button>
            </div>
          )}
          {state === 'judge' && isGM && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-slate-600">書いた文字が正解と合っていれば「正解」を押してください</p>
              <div className="flex gap-4">
              <button
                onClick={() => handleJudge(true)}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl"
              >
                正解
              </button>
              <button
                onClick={() => handleJudge(false)}
                className="px-6 py-3 bg-slate-600 text-white font-bold rounded-xl"
              >
                不正解
              </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (state === 'result') {
    const isCorrect = game.correct === true;
    return (
      <main className="min-h-screen p-4 flex flex-col items-center justify-center">
        <p className={`text-4xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? '正解！' : '不正解'}
        </p>
        <p className="mt-4 text-slate-600">正解: {currentQuestion?.answer}</p>
        {isGM && (
          <button
            onClick={handleNext}
            className="mt-8 px-8 py-4 bg-rose-500 text-white font-bold rounded-xl"
          >
            次の問題へ
          </button>
        )}
      </main>
    );
  }

  if (state === 'finished') {
    return (
      <main className="min-h-screen p-4 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold text-slate-800">5問終了！</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-3 bg-rose-500 text-white font-bold rounded-xl"
        >
          トップへ
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-center mb-2">待機中</h1>
        <p className="text-center text-slate-600 mb-4">あなた: {mySlot}文字目 - {myName}</p>
        <p className="text-center text-sm text-slate-500 mb-4">
          参加者: {players.map((p) => `${p.slot}文字目 ${p.name}`).join(' / ')}
        </p>
        {isGM && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm font-medium text-slate-700 mb-2">出題元</p>
              <div className="flex flex-wrap gap-3 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="questionSource"
                    checked={questionSource === 'all'}
                    onChange={() => setQuestionSource('all')}
                    className="rounded"
                  />
                  <span className="text-sm">全フォルダからランダム</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="questionSource"
                    checked={questionSource === 'folder'}
                    onChange={() => setQuestionSource('folder')}
                    className="rounded"
                  />
                  <span className="text-sm">1つのフォルダからランダム</span>
                </label>
                {questionSource === 'folder' && (
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="">フォルダを選択</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleStart}
                disabled={players.length < 5 || (questionSource === 'folder' && !selectedFolderId)}
                className="px-8 py-4 bg-rose-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {players.length < 5 ? `あと${5 - players.length}人待ち` : 'ゲーム開始'}
              </button>
            </div>
          </div>
        )}
        <p className="text-center mt-6">
          <button
            type="button"
            onClick={handleRejoinAsOther}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            別のスロットで参加し直す
          </button>
        </p>
      </div>
    </main>
  );
}
