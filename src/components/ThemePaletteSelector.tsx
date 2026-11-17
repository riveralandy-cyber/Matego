import React from 'react';
import { Check, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { THEME_PALETTES, ThemePaletteDefinition } from '../utils/themes';
import { ThemePaletteId } from '../types';

interface ThemePaletteSelectorProps {
  variant?: 'compact' | 'cards' | 'inline-bar';
  title?: string;
  subtitle?: string;
}

export const ThemePaletteSelector: React.FC<ThemePaletteSelectorProps> = ({
  variant = 'compact',
  title = 'Paleta de colores',
  subtitle,
}) => {
  const { activeTheme, setThemePreference } = useApp();

  const handleSelect = (id: ThemePaletteId) => {
    setThemePreference(id);
  };

  if (variant === 'inline-bar') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tq-text-muted flex items-center gap-1.5 mr-1">
          <Palette className="w-3.5 h-3.5 tq-text-accent" />
          <span>{title}:</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {THEME_PALETTES.map((p: ThemePaletteDefinition) => {
            const isSelected = activeTheme === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelect(p.id)}
                title={`${p.name} — ${p.description}`}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'tq-accent-soft border-[var(--tq-accent)] ring-1 ring-[var(--tq-accent)]'
                    : 'tq-card hover:bg-[var(--tq-subtle-bg)]'
                }`}
              >
                <span className="flex items-center -space-x-1 shrink-0" aria-hidden="true">
                  <span
                    className="w-3 h-3 rounded-full border border-black/15 dark:border-white/25"
                    style={{ backgroundColor: p.swatches[0] }}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-black/15 dark:border-white/25"
                    style={{ backgroundColor: p.swatches[2] }}
                  />
                </span>
                <span>{p.shortLabel}</span>
                {isSelected && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tq-text">
            <Palette className="w-4 h-4 tq-text-accent" />
            <span>{title}</span>
          </div>
          {subtitle && (
            <p className="text-[11px] tq-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {THEME_PALETTES.map(p => {
            const isSelected = activeTheme === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelect(p.id)}
                className={`text-left p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                  isSelected
                    ? 'tq-tint border-[var(--tq-accent)] ring-1 ring-[var(--tq-accent)]'
                    : 'tq-subtle border-[var(--tq-border)] hover:border-[var(--tq-border-strong)]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 shrink-0" aria-hidden="true">
                      {p.swatches.map((hex, i) => (
                        <span
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/25"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold tq-text truncate">{p.name}</span>
                  </div>
                  <p className="text-[11px] tq-text-muted mt-1 leading-snug">
                    {p.description}
                  </p>
                </div>

                {isSelected && (
                  <span className="w-5 h-5 rounded-full tq-btn-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Compact 5-button grid (used on login cards & sidebar)
  return (
    <div className="p-3 rounded-2xl tq-subtle border space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tq-text-2">
          <Palette className="w-3.5 h-3.5 tq-text-accent" />
          <span>{title}</span>
        </div>
        <span className="text-[10px] font-semibold tq-text-accent">
          {THEME_PALETTES.find(p => p.id === activeTheme)?.shortLabel}
        </span>
      </div>

      {subtitle && (
        <p className="text-[11px] tq-text-muted leading-snug">{subtitle}</p>
      )}

      <div className="grid grid-cols-5 gap-1.5">
        {THEME_PALETTES.map(p => {
          const isSelected = activeTheme === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelect(p.id)}
              title={`${p.name}: ${p.description}`}
              className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                isSelected
                  ? 'tq-card border-[var(--tq-accent)] ring-2 ring-[var(--tq-accent)]/30 shadow-2xs'
                  : 'tq-card border-[var(--tq-border)] opacity-85 hover:opacity-100 hover:border-[var(--tq-border-strong)]'
              }`}
            >
              <span className="flex items-center -space-x-1" aria-hidden="true">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/30"
                  style={{ backgroundColor: p.swatches[0] }}
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/30"
                  style={{ backgroundColor: p.swatches[2] }}
                />
              </span>
              <span className="text-[10px] font-bold tq-text truncate w-full px-0.5">
                {p.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
