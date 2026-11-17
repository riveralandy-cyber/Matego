import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pen, RotateCcw, X } from 'lucide-react';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState<'#0f172a' | '#2563eb' | '#dc2626'>('#0f172a');
  const [lineWidth, setLineWidth] = useState<number>(3);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Default white background with subtle grid lines like a Chilean cuadriculado notebook!
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw subtle math grid (cuadrícula escolar)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x <= rect.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rect.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 18;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Redraw school math grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x <= rect.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rect.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-3xl h-[80vh] tq-card rounded-xl shadow-2xl border tq-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 tq-subtle border-b tq-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tq-text">
              Pizarra de Borrador (Cuaderno de Cálculos)
            </span>
            <span className="text-xs tq-text-muted hidden sm:inline">
              Úsalo para ordenar algoritmos, reservas o divisiones
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tool buttons */}
            <div className="flex items-center tq-card border tq-border rounded-md p-0.5">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  tool === 'pen' ? 'tq-btn-primary' : 'tq-text-2 hover:bg-[var(--tq-muted-bg)]'
                }`}
                title="Lápiz grafito"
              >
                <Pen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lápiz</span>
              </button>
              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  tool === 'eraser' ? 'tq-btn-primary' : 'tq-text-2 hover:bg-[var(--tq-muted-bg)]'
                }`}
                title="Goma de borrar"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Goma</span>
              </button>
            </div>

            {/* Colors */}
            {tool === 'pen' && (
              <div className="flex items-center gap-1 px-1.5 bg-white border border-slate-200 rounded-md py-1">
                <button
                  type="button"
                  onClick={() => setColor('#0f172a')}
                  className={`w-4 h-4 rounded-full bg-slate-900 border cursor-pointer ${
                    color === '#0f172a' ? 'ring-2 ring-slate-400' : ''
                  }`}
                  title="Grafito"
                />
                <button
                  type="button"
                  onClick={() => setColor('#2563eb')}
                  className={`w-4 h-4 rounded-full bg-blue-600 border cursor-pointer ${
                    color === '#2563eb' ? 'ring-2 ring-blue-300' : ''
                  }`}
                  title="Pasta azul"
                />
                <button
                  type="button"
                  onClick={() => setColor('#dc2626')}
                  className={`w-4 h-4 rounded-full bg-rose-600 border cursor-pointer ${
                    color === '#dc2626' ? 'ring-2 ring-rose-300' : ''
                  }`}
                  title="Pasta roja"
                />
              </div>
            )}

            <button
              type="button"
              onClick={clearCanvas}
              className="px-2.5 py-1.5 text-xs tq-text-2 tq-card border tq-border hover:bg-[var(--tq-muted-bg)] rounded-md flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 tq-text-muted" />
              <span>Limpiar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 tq-text-muted hover:tq-text hover:bg-[var(--tq-muted-bg)] rounded-md transition-colors ml-2 cursor-pointer"
              title="Cerrar borrador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas area with crisp cuadriculado paper */}
        <div className="flex-1 relative cursor-crosshair overflow-hidden touch-none bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 tq-subtle border-t tq-border text-xs tq-text-muted flex justify-between items-center">
          <span>Tus apuntes quedan aquí durante toda la evaluación.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 tq-btn-primary rounded text-xs font-medium cursor-pointer"
          >
            Volver a la prueba
          </button>
        </div>
      </div>
    </div>
  );
};
