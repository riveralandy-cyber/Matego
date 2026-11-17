import React from 'react';
import { VisualType } from '../../types';

interface MathVisualsProps {
  visualType: VisualType;
  visualData?: any;
}

export const MathVisuals: React.FC<MathVisualsProps> = ({ visualType, visualData }) => {
  if (visualType === 'none' || !visualData) return null;

  if (visualType === 'fraction_bar') {
    const { numerator = 1, denominator = 4 } = visualData;
    const items = Array.from({ length: denominator }, (_, i) => i < numerator);

    return (
      <div className="my-4 flex flex-col items-center">
        <div className="flex border-2 border-slate-700 bg-white rounded overflow-hidden max-w-sm w-full h-12 shadow-sm">
          {items.map((isFilled, idx) => (
            <div
              key={idx}
              className={`flex-1 border-r border-slate-400 last:border-r-0 flex items-center justify-center font-mono text-xs font-semibold ${
                isFilled ? 'bg-sky-500 text-white' : 'bg-slate-50 text-slate-400'
              }`}
            >
              {isFilled ? '1' : ''}
            </div>
          ))}
        </div>
        <span className="text-xs tq-text-muted mt-2">
          {denominator} partes iguales, {numerator} sombreadas
        </span>
      </div>
    );
  }

  if (visualType === 'grid_multiplication') {
    const { rows = 3, cols = 4 } = visualData;
    const displayRows = Math.min(rows, 8);
    const displayCols = Math.min(cols, 10);

    return (
      <div className="my-4 flex flex-col items-center">
        <div className="inline-block p-3 bg-slate-50 dark:bg-slate-100 border tq-border rounded-lg">
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${displayCols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: displayRows * displayCols }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-indigo-500/80 border border-indigo-600 shadow-xs flex items-center justify-center"
              />
            ))}
          </div>
        </div>
        <span className="text-xs tq-text-muted mt-2">
          Arreglo de {rows} filas por {cols} columnas
        </span>
      </div>
    );
  }

  if (visualType === 'geometry_shape') {
    const { shape, width, height, radius, legA, legB, unit = 'cm' } = visualData;

    return (
      <div className="my-4 flex flex-col items-center">
        <svg
          viewBox="0 0 240 140"
          className="w-64 h-36 border border-slate-200 bg-slate-50 rounded-lg shadow-xs"
        >
          {shape === 'cuadrado' && (
            <g>
              <rect x="75" y="25" width="90" height="90" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.5" rx="3" />
              <text x="120" y="20" textAnchor="middle" fontSize="12" fill="#0369a1" fontWeight="bold">{width} {unit}</text>
              <text x="65" y="75" textAnchor="end" fontSize="12" fill="#0369a1" fontWeight="bold">{height} {unit}</text>
            </g>
          )}

          {shape === 'rectangulo' && (
            <g>
              <rect x="40" y="35" width="160" height="70" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.5" rx="3" />
              <text x="120" y="28" textAnchor="middle" fontSize="12" fill="#0369a1" fontWeight="bold">{width} {unit}</text>
              <text x="30" y="75" textAnchor="end" fontSize="12" fill="#0369a1" fontWeight="bold">{height} {unit}</text>
            </g>
          )}

          {shape === 'triangulo_rectangulo' && (
            <g>
              <polygon points="50,110 190,110 50,30" fill="#fef3c7" stroke="#d97706" strokeWidth="2.5" />
              {/* Right angle marker */}
              <rect x="50" y="96" width="14" height="14" fill="none" stroke="#b45309" strokeWidth="1.5" />
              <text x="120" y="126" textAnchor="middle" fontSize="12" fill="#b45309" fontWeight="bold">cateto b = {legB || 4} {unit}</text>
              <text x="40" y="70" textAnchor="end" fontSize="12" fill="#b45309" fontWeight="bold">cateto a = {legA || 3} {unit}</text>
              <text x="135" y="65" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="bold">c = ?</text>
            </g>
          )}

          {shape === 'circulo' && (
            <g>
              <circle cx="120" cy="70" r="50" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2.5" />
              <line x1="120" y1="70" x2="170" y2="70" stroke="#6d28d9" strokeWidth="2" strokeDasharray="3,3" />
              <circle cx="120" cy="70" r="3" fill="#6d28d9" />
              <text x="145" y="64" textAnchor="middle" fontSize="11" fill="#6d28d9" fontWeight="bold">r = {radius} {unit}</text>
            </g>
          )}

          {shape === 'pentagono' && (
            <g>
              <polygon points="120,25 185,60 160,115 80,115 55,60" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.5" />
              <text x="120" y="75" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="bold">5 lados</text>
            </g>
          )}
        </svg>
      </div>
    );
  }

  if (visualType === 'number_line') {
    const { start = 0, end = 20, numbers, missing } = visualData;
    return (
      <div className="my-4 flex flex-col items-center w-full max-w-md">
        <svg viewBox="0 0 320 60" className="w-full h-16 bg-slate-50 border border-slate-200 rounded-lg p-2">
          {/* Main axis line with arrows */}
          <line x1="20" y1="35" x2="300" y2="35" stroke="#334155" strokeWidth="2.5" />
          <polygon points="15,35 25,30 25,40" fill="#334155" />
          <polygon points="305,35 295,30 295,40" fill="#334155" />

          {numbers ? (
            numbers.map((num: number, idx: number) => {
              const xPos = 40 + idx * 75;
              const isMissing = num === missing;
              return (
                <g key={idx}>
                  <line x1={xPos} y1="28" x2={xPos} y2="42" stroke="#475569" strokeWidth="2" />
                  <circle cx={xPos} cy="35" r="4" fill={isMissing ? '#e11d48' : '#0284c7'} />
                  <text
                    x={xPos}
                    y="20"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill={isMissing ? '#e11d48' : '#1e293b'}
                  >
                    {isMissing ? '?' : num}
                  </text>
                </g>
              );
            })
          ) : (
            <>
              <line x1="60" y1="28" x2="60" y2="42" stroke="#475569" strokeWidth="2" />
              <text x="60" y="22" textAnchor="middle" fontSize="10" fill="#475569">{start}</text>
              <line x1="160" y1="28" x2="160" y2="42" stroke="#e11d48" strokeWidth="3" />
              <text x="160" y="22" textAnchor="middle" fontSize="12" fill="#e11d48" fontWeight="bold">?</text>
              <line x1="260" y1="28" x2="260" y2="42" stroke="#475569" strokeWidth="2" />
              <text x="260" y="22" textAnchor="middle" fontSize="10" fill="#475569">{end}</text>
            </>
          )}
        </svg>
      </div>
    );
  }

  if (visualType === 'balance_equation') {
    const { left = 'x + 5', right = '12' } = visualData;
    return (
      <div className="my-4 flex flex-col items-center">
        <svg viewBox="0 0 280 120" className="w-72 h-32 bg-slate-50 border border-slate-200 rounded-lg">
          {/* Base */}
          <polygon points="140,80 120,110 160,110" fill="#64748b" />
          <line x1="50" y1="45" x2="230" y2="45" stroke="#334155" strokeWidth="4" />
          {/* Left Pan */}
          <line x1="60" y1="45" x2="60" y2="70" stroke="#475569" strokeWidth="1.5" />
          <path d="M 35 70 Q 60 85 85 70 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          <rect x="42" y="52" width="36" height="20" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" rx="3" />
          <text x="60" y="66" textAnchor="middle" fontSize="10" fill="#0369a1" fontWeight="bold">{left}</text>

          {/* Right Pan */}
          <line x1="220" y1="45" x2="220" y2="70" stroke="#475569" strokeWidth="1.5" />
          <path d="M 195 70 Q 220 85 245 70 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          <rect x="202" y="52" width="36" height="20" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" rx="3" />
          <text x="220" y="66" textAnchor="middle" fontSize="11" fill="#854d0e" fontWeight="bold">{right}</text>
          
          <text x="140" y="35" textAnchor="middle" fontSize="12" fill="#059669" fontWeight="bold">=</text>
        </svg>
        <span className="text-xs tq-text-muted mt-1">Balanza en equilibrio (=)</span>
      </div>
    );
  }

  if (visualType === 'bar_chart') {
    const { title = 'Gráfico', unit = '', items = [] } = visualData as {
      title?: string;
      unit?: string;
      items: { label: string; value: number }[];
    };
    const maxVal = Math.max(10, ...items.map(i => i.value));
    const ceilMax = Math.ceil(maxVal / 5) * 5;
    const barColors = ['#0284c7', '#4f46e5', '#0d9488', '#d97706', '#e11d48'];

    return (
      <div className="my-4 flex flex-col items-center w-full">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full max-w-md shadow-xs text-slate-900">
          <div className="text-xs font-bold text-center text-slate-800 mb-3">
            {title} {unit ? `(${unit})` : ''}
          </div>
          <svg viewBox="0 0 320 155" className="w-full h-40">
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = 120 - ratio * 95;
              const tickVal = Math.round(ceilMax * ratio);
              return (
                <g key={idx}>
                  <line x1="36" y1={y} x2="305" y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray={idx === 0 ? undefined : '2,2'} />
                  <text x="30" y={y + 3} textAnchor="end" fontSize="9" fill="#475569" fontWeight="600">
                    {tickVal}
                  </text>
                </g>
              );
            })}
            {/* Y axis */}
            <line x1="36" y1="20" x2="36" y2="120" stroke="#334155" strokeWidth="1.5" />
            {/* X axis */}
            <line x1="36" y1="120" x2="305" y2="120" stroke="#334155" strokeWidth="1.5" />

            {items.map((item, idx) => {
              const slotWidth = 260 / Math.max(1, items.length);
              const barWidth = Math.min(38, slotWidth * 0.56);
              const x = 42 + idx * slotWidth + (slotWidth - barWidth) / 2;
              const barH = (item.value / ceilMax) * 95;
              const y = 120 - barH;
              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(2, barH)}
                    fill={barColors[idx % barColors.length]}
                    rx="3"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#0f172a"
                  >
                    {item.value}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y="136"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#334155"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  if (visualType === 'table_data') {
    const { title, headers = [], rows = [] } = visualData as {
      title?: string;
      headers: string[];
      rows: string[][];
    };
    return (
      <div className="my-4 flex flex-col items-center w-full">
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-xs max-w-md w-full text-slate-900">
          {title && (
            <div className="bg-slate-200/70 px-3 py-1.5 text-xs font-bold text-slate-800 text-center border-b border-slate-200">
              {title}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse tabular-nums">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 font-bold text-slate-700 border-r last:border-r-0 border-slate-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="bg-white border-b last:border-b-0 border-slate-200">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-3 py-2 border-r last:border-r-0 border-slate-200 ${
                          cell === '?' ? 'font-black text-rose-600 bg-rose-50' : cIdx === 0 ? 'font-bold text-slate-800 bg-slate-50/60' : 'font-mono font-semibold text-slate-900'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (visualType === 'angle_figure') {
    const { kind, degrees = 143, label, a = 52, b = 68, acute = 65 } = visualData;
    return (
      <div className="my-4 flex flex-col items-center">
        <svg viewBox="0 0 280 140" className="w-72 h-36 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
          {kind === 'angle_arc' && (
            <g>
              <line x1="140" y1="100" x2="245" y2="100" stroke="#0f172a" strokeWidth="2.5" />
              <line x1="140" y1="100" x2="55" y2="42" stroke="#0f172a" strokeWidth="2.5" />
              <path d="M 172 100 A 32 32 0 0 0 113 82" fill="#e0e7ff" fillOpacity="0.65" stroke="#4f46e5" strokeWidth="2" />
              <circle cx="140" cy="100" r="3.5" fill="#0f172a" />
              <text x="140" y="118" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">L</text>
              <text x="242" y="116" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">P</text>
              <text x="52" y="34" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">M</text>
              <text x="142" y="55" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#4338ca">
                {label || `${degrees}°`}
              </text>
            </g>
          )}

          {kind === 'triangle_angles' && (
            <g>
              <polygon points="45,112 235,112 155,28" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2.5" />
              <text x="36" y="124" fontSize="11" fontWeight="bold" fill="#334155">A</text>
              <text x="238" y="124" fontSize="11" fontWeight="bold" fill="#334155">B</text>
              <text x="155" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">C</text>
              <text x="76" y="103" fontSize="11" fontWeight="bold" fill="#0369a1">{a}°</text>
              <text x="195" y="103" fontSize="11" fontWeight="bold" fill="#0369a1">{b}°</text>
              <text x="155" y="54" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#dc2626">x</text>
            </g>
          )}

          {kind === 'transversal' && (
            <g>
              {/* Parallel lines L1 and L2 */}
              <line x1="30" y1="45" x2="250" y2="45" stroke="#0f172a" strokeWidth="2.2" />
              <line x1="30" y1="98" x2="250" y2="98" stroke="#0f172a" strokeWidth="2.2" />
              <text x="255" y="48" fontSize="10" fontWeight="bold" fill="#475569">L1</text>
              <text x="255" y="101" fontSize="10" fontWeight="bold" fill="#475569">L2</text>
              {/* Transversal T */}
              <line x1="95" y1="18" x2="185" y2="125" stroke="#4f46e5" strokeWidth="2.2" />
              <text x="190" y="128" fontSize="10" fontWeight="bold" fill="#4f46e5">T</text>
              {/* Angle markers */}
              <text x="136" y="39" fontSize="11" fontWeight="bold" fill="#0284c7">α = {acute}°</text>
              <text x="115" y="91" fontSize="11" fontWeight="bold" fill="#dc2626">β = ?</text>
              <text x="34" y="132" fontSize="9" fill="#64748b">L1 // L2</text>
            </g>
          )}
        </svg>
      </div>
    );
  }

  if (visualType === 'cube_prism') {
    const { kind = 'prism', length = 5, width = 4, height = 3, radius = 3, unit = 'cm' } = visualData;
    return (
      <div className="my-4 flex flex-col items-center">
        <svg viewBox="0 0 260 140" className="w-64 h-36 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
          {kind === 'cylinder' ? (
            <g>
              <ellipse cx="130" cy="36" rx="46" ry="13" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.2" />
              <path d="M 84 36 L 84 102 A 46 13 0 0 0 176 102 L 176 36" fill="#bae6fd" fillOpacity="0.45" stroke="#0284c7" strokeWidth="2.2" />
              <ellipse cx="130" cy="102" rx="46" ry="13" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />
              {/* Radius line */}
              <line x1="130" y1="36" x2="176" y2="36" stroke="#dc2626" strokeWidth="2" />
              <circle cx="130" cy="36" r="2.5" fill="#dc2626" />
              <text x="153" y="31" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#dc2626">
                r = {radius} {unit}
              </text>
              {/* Height label */}
              <text x="184" y="72" fontSize="11" fontWeight="bold" fill="#0369a1">
                h = {height} {unit}
              </text>
            </g>
          ) : (
            <g>
              {/* Front face */}
              <rect x="65" y="52" width="95" height="62" fill="#e0e7ff" stroke="#4338ca" strokeWidth="2.2" />
              {/* Top face */}
              <polygon points="65,52 100,26 195,26 160,52" fill="#c7d2fe" stroke="#4338ca" strokeWidth="2.2" />
              {/* Right side face */}
              <polygon points="160,52 195,26 195,88 160,114" fill="#a5b4fc" stroke="#4338ca" strokeWidth="2.2" />
              {/* Hidden edges */}
              <line x1="65" y1="114" x2="100" y2="88" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="3,3" />
              <line x1="100" y1="26" x2="100" y2="88" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="3,3" />
              <line x1="100" y1="88" x2="195" y2="88" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="3,3" />
              {/* Dimension labels */}
              <text x="112" y="130" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
                {length} {unit}
              </text>
              <text x="190" y="110" fontSize="11" fontWeight="bold" fill="#1e293b">
                {width} {unit}
              </text>
              <text x="56" y="86" textAnchor="end" fontSize="11" fontWeight="bold" fill="#1e293b">
                {height} {unit}
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  }

  return null;
};
