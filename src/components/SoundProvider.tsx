'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type SoundContextValue = {
  playCorrect: () => void;
  playWrong: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = 'fiveleague_sound_settings';
const BGM_SRC = '/audio/bgm_quiz.mp3';
const CORRECT_SRC = '/audio/se_correct.mp3';
const WRONG_SRC = '/audio/se_wrong.mp3';

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      playCorrect: () => {},
      playWrong: () => {},
    };
  }
  return ctx;
}

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const correctRef = useRef<HTMLAudioElement | null>(null);
  const wrongRef = useRef<HTMLAudioElement | null>(null);

  const [ready, setReady] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [seEnabled, setSeEnabled] = useState(true);
  const [volume, setVolume] = useState(0.45);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { bgmEnabled?: boolean; seEnabled?: boolean; volume?: number };
        if (typeof parsed.bgmEnabled === 'boolean') setBgmEnabled(parsed.bgmEnabled);
        if (typeof parsed.seEnabled === 'boolean') setSeEnabled(parsed.seEnabled);
        if (typeof parsed.volume === 'number') setVolume(Math.min(1, Math.max(0, parsed.volume)));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ bgmEnabled, seEnabled, volume }));
    } catch {}
  }, [bgmEnabled, seEnabled, volume]);

  useEffect(() => {
    const bgm = new Audio(BGM_SRC);
    bgm.loop = true;
    bgm.preload = 'auto';
    bgm.volume = volume;
    bgmRef.current = bgm;

    const correct = new Audio(CORRECT_SRC);
    correct.preload = 'auto';
    correct.volume = volume;
    correctRef.current = correct;

    const wrong = new Audio(WRONG_SRC);
    wrong.preload = 'auto';
    wrong.volume = volume;
    wrongRef.current = wrong;

    return () => {
      bgm.pause();
      bgmRef.current = null;
      correctRef.current = null;
      wrongRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (bgmRef.current) bgmRef.current.volume = volume;
    if (correctRef.current) correctRef.current.volume = volume;
    if (wrongRef.current) wrongRef.current.volume = volume;
  }, [volume]);

  const enableAudio = useCallback(async () => {
    setReady(true);
    if (bgmEnabled && bgmRef.current) {
      try {
        bgmRef.current.currentTime = 0;
        await bgmRef.current.play();
      } catch {
        // ユーザー操作が足りない場合は次の操作で再試行
      }
    }
  }, [bgmEnabled]);

  useEffect(() => {
    if (!ready || !bgmRef.current) return;
    if (bgmEnabled) {
      bgmRef.current.play().catch(() => {});
    } else {
      bgmRef.current.pause();
    }
  }, [ready, bgmEnabled]);

  const playEffect = useCallback((audio: HTMLAudioElement | null) => {
    if (!ready || !seEnabled || !audio) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }, [ready, seEnabled]);

  const value = useMemo<SoundContextValue>(() => ({
    playCorrect: () => playEffect(correctRef.current),
    playWrong: () => playEffect(wrongRef.current),
  }), [playEffect]);

  return (
    <SoundContext.Provider value={value}>
      {children}

      <div className="fixed right-3 bottom-3 z-50">
        <div className="bg-white/95 rounded-xl shadow-lg border border-slate-200 p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-700">音声設定</p>
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="text-xs text-slate-500 underline"
            >
              {panelOpen ? '閉じる' : '開く'}
            </button>
          </div>

          {!ready && (
            <button
              type="button"
              onClick={enableAudio}
              className="w-full mb-2 px-3 py-2 bg-rose-500 text-white text-sm font-bold rounded-lg"
            >
              BGM/効果音を有効化
            </button>
          )}

          {panelOpen && (
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm">
                <span>BGM</span>
                <input
                  type="checkbox"
                  checked={bgmEnabled}
                  onChange={(e) => setBgmEnabled(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between text-sm">
                <span>効果音</span>
                <input
                  type="checkbox"
                  checked={seEnabled}
                  onChange={(e) => setSeEnabled(e.target.checked)}
                />
              </label>
              <label className="block text-sm">
                音量: {Math.round(volume * 100)}%
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </SoundContext.Provider>
  );
}
