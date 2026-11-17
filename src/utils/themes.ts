import { ThemePaletteId } from '../types';

export interface ThemePaletteDefinition {
  id: ThemePaletteId;
  name: string;
  shortLabel: string;
  description: string;
  isDark: boolean;
  swatches: [string, string, string, string]; // [pageBg, cardBg, primaryAccent, secondaryAccent]
}

export const THEME_PALETTES: ThemePaletteDefinition[] = [
  {
    id: 'estandar',
    name: 'Estándar (Original)',
    shortLabel: 'Estándar',
    description: 'Paleta clásica actual de la plataforma con tonos índigo y cielo.',
    isDark: false,
    swatches: ['#F8FAFC', '#FFFFFF', '#4F46E5', '#0EA5E9'],
  },
  {
    id: 'pastel',
    name: 'Colores Pasteles',
    shortLabel: 'Pasteles',
    description: 'Tonos suaves en lavanda, menta y rosa pastel para lectura relajada.',
    isDark: false,
    swatches: ['#FDF8FC', '#F5EDFF', '#9F7AEA', '#F472B6'],
  },
  {
    id: 'claro',
    name: 'Claro y Blanco',
    shortLabel: 'Claro',
    description: 'Fondo blanco luminoso minimalista con contrastes nítidos en azul.',
    isDark: false,
    swatches: ['#FFFFFF', '#F1F5F9', '#0284C7', '#334155'],
  },
  {
    id: 'nocturno',
    name: 'Modo Nocturno Vivo',
    shortLabel: 'Nocturno',
    description: 'Fondo negro profundo con acentos cian, esmeralda y ámbar vivos.',
    isDark: true,
    swatches: ['#070B14', '#131C2E', '#22D3EE', '#34D399'],
  },
  {
    id: 'vibrante',
    name: 'Colores Vibrantes',
    shortLabel: 'Vibrante',
    description: 'Paleta energética con violeta intenso, azul eléctrico y coral.',
    isDark: false,
    swatches: ['#FFFDF9', '#EDE9FE', '#7C3AED', '#F97316'],
  },
];

export const DEFAULT_THEME_ID: ThemePaletteId = 'estandar';

export interface StoredThemePreferences {
  teachers: Record<string, ThemePaletteId>;
  students: Record<string, ThemePaletteId>;
  guest: ThemePaletteId;
}

const THEME_STORAGE_KEY = 'thatquiz_chile_theme_preferences';

export function isValidThemeId(val: unknown): val is ThemePaletteId {
  return (
    val === 'estandar' ||
    val === 'pastel' ||
    val === 'claro' ||
    val === 'nocturno' ||
    val === 'vibrante'
  );
}

export function loadStoredThemePreferences(): StoredThemePreferences {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        teachers: parsed.teachers && typeof parsed.teachers === 'object' ? parsed.teachers : {},
        students: parsed.students && typeof parsed.students === 'object' ? parsed.students : {},
        guest: isValidThemeId(parsed.guest) ? parsed.guest : DEFAULT_THEME_ID,
      };
    }
  } catch {
    // fallback safely
  }
  return {
    teachers: {},
    students: {},
    guest: DEFAULT_THEME_ID,
  };
}

export function saveStoredThemePreferences(prefs: StoredThemePreferences): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}

export function applyThemeToDocument(themeId: ThemePaletteId): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', themeId);
  if (themeId === 'nocturno') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
