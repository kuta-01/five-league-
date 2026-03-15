'use client';

import { useEffect, useState } from 'react';

const TOTAL_SECONDS = 45;

export default function Timer({
  startAt,
  onExpire,
  running,
}: {
  startAt: number | null;
  onExpire: () => void;
  running: boolean;
}) {
  const [remaining, setRemaining] = useState<number>(TOTAL_SECONDS);

  useEffect(() => {
    if (!running || startAt == null) {
      setRemaining(TOTAL_SECONDS);
      return;
    }
    const tick = () => {
      const elapsed = (Date.now() - startAt) / 1000;
      const r = Math.max(0, Math.ceil(TOTAL_SECONDS - elapsed));
      setRemaining(r);
      if (r <= 0) onExpire();
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [startAt, running, onExpire]);

  if (!running) {
    return (
      <div className="text-2xl font-mono font-bold text-slate-500">
        {TOTAL_SECONDS}秒
      </div>
    );
  }

  const color = remaining <= 10 ? 'text-red-600' : remaining <= 20 ? 'text-amber-600' : 'text-slate-700';
  return (
    <div className={`text-3xl font-mono font-bold ${color}`}>
      {remaining}秒
    </div>
  );
}
