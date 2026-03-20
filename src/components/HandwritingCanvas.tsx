'use client';

import {
  useCallback,
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

export type HandwritingCanvasHandle = {
  /** 現在のキャンバスを PNG Data URL で取得（タイムアップ時の自動提出用） */
  getDataUrl: () => string | null;
};

interface HandwritingCanvasProps {
  slot: number;
  disabled?: boolean;
  /** 確定済み（提出済み）のとき true。キャンバスをロックし提出済み表示にする */
  submitted?: boolean;
  /** 変更されるとキャンバスをクリアする（書き直し用） */
  resetKey?: number;
  onSave: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

const HandwritingCanvas = forwardRef<HandwritingCanvasHandle, HandwritingCanvasProps>(function HandwritingCanvas(
  {
    slot,
    disabled = false,
    submitted = false,
    resetKey = 0,
    onSave,
    width = 120,
    height = 120,
  },
  ref
) {
  const effectiveDisabled = disabled || submitted;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      getDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL('image/png');
      },
    }),
    []
  );

  const getPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ('touches' in e) {
        const t = e.touches[0];
        return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
      }
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    },
    []
  );

  const draw = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas || effectiveDisabled) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineCap = 'round';
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#1a1a2e';
      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      lastPos.current = { x, y };
    },
    [effectiveDisabled]
  );

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (effectiveDisabled) return;
      const p = getPoint(e);
      if (p) {
        lastPos.current = p;
        setIsDrawing(true);
        draw(p.x, p.y);
      }
    },
    [effectiveDisabled, getPoint, draw]
  );

  const moveDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing || effectiveDisabled) return;
      const p = getPoint(e);
      if (p) draw(p.x, p.y);
    },
    [isDrawing, effectiveDisabled, getPoint, draw]
  );

  const endDraw = useCallback(() => {
    lastPos.current = null;
    setIsDrawing(false);
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const save = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  }, [onSave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [slot]);

  useEffect(() => {
    if (resetKey === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [resetKey]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onTouchEnd = () => endDraw();
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
    return () => {
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [endDraw]);

  return (
    <div className="canvas-container flex flex-col items-center">
      {submitted && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-green-700 ring-2 ring-green-400">
          <span className="text-lg" aria-hidden>✓</span>
          <span className="font-bold">提出済み</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`border-2 rounded-lg bg-white touch-none ${effectiveDisabled ? 'cursor-not-allowed border-green-400 opacity-90' : 'cursor-crosshair border-slate-300'}`}
        style={{ width: width, height: height, maxWidth: '100%' }}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
      />
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={clear}
          disabled={effectiveDisabled}
          className="px-3 py-1 text-sm bg-slate-200 rounded disabled:opacity-50"
        >
          消す
        </button>
        <button
          type="button"
          onClick={save}
          disabled={effectiveDisabled}
          className="px-3 py-1 text-sm bg-rose-500 text-white rounded disabled:opacity-50"
        >
          {submitted ? '確定済み' : '確定'}
        </button>
      </div>
    </div>
  );
});

export default HandwritingCanvas;
