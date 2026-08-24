'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface SignaturePadHandle {
  /** PNG em base64, ou null se nada foi desenhado ainda. */
  toDataURL: () => string | null;
  clear: () => void;
}

interface SignaturePadProps {
  /** Chamado sempre que o "há traço desenhado" muda (util para habilitar um botão). */
  onDrawnChange?: (temTraco: boolean) => void;
  height?: number;
}

/**
 * Campo de assinatura por toque/caneta. Tecnica extraida do fluxo que ja
 * funciona de ponta a ponta em AnamneseLimpezaDePele.tsx: Pointer Events
 * (unifica mouse/touch/caneta), pressao da Apple Pencil quando disponivel, e
 * resize com devicePixelRatio + ResizeObserver para o traco nao ficar borrado
 * ou desalinhado em qualquer tamanho de tela.
 */
const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  { onDrawnChange, height = 160 },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, displayWidth, displayHeight);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(container);
    const handleOrientation = () => setTimeout(resizeCanvas, 150);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, [resizeCanvas]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const marcarComoDesenhado = () => {
    if (hasDrawnRef.current) return;
    hasDrawnRef.current = true;
    setHasDrawn(true);
    onDrawnChange?.(true);
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);

    const { x, y } = getCoords(e);
    isDrawingRef.current = true;

    ctx.strokeStyle = '#1c1c1c';
    ctx.lineWidth = e.pointerType === 'pen' ? 2.5 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);

    // Suporte a pressao da Apple Pencil, quando disponivel.
    if (e.pointerType === 'pen' && e.pressure > 0) {
      ctx.lineWidth = 1 + e.pressure * 3;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    marcarComoDesenhado();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      try { canvas.releasePointerCapture(e.pointerId); } catch { /* ignora */ }
    }
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    hasDrawnRef.current = false;
    setHasDrawn(false);
    onDrawnChange?.(false);
  }, [onDrawnChange]);

  useImperativeHandle(ref, () => ({
    clear,
    toDataURL: () => (hasDrawnRef.current && canvasRef.current ? canvasRef.current.toDataURL('image/png') : null),
  }), [clear]);

  return (
    <div
      ref={containerRef}
      className="relative border-2 border-dashed border-outline-variant rounded-2xl bg-surface overflow-hidden"
      style={{ height, touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ touchAction: 'none' }}
      />
      {!hasDrawn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-[11px] text-outline pointer-events-none select-none">
          <span className="material-symbols-outlined text-3xl opacity-40">draw</span>
          <p className="mt-1">Assine aqui com o dedo, mouse ou caneta</p>
        </div>
      )}
    </div>
  );
});

export default SignaturePad;
