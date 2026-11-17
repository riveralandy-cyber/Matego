import { PerformanceLevel } from '../types';

/**
 * Calcula la calificación chilena oficial (escala 1.0 a 7.0)
 * basada en el porcentaje de exigencia oficial MINEDUC (estándar 60%).
 */
export function calculateChileanGrade(
  score: number,
  maxScore: number,
  exigencyPercent: number = 60
): number {
  if (maxScore <= 0) return 1.0;
  if (score <= 0) return 1.0;
  if (score >= maxScore) return 7.0;

  const passingScore = (maxScore * exigencyPercent) / 100;

  let grade: number;
  if (score < passingScore) {
    // Escala inferior: de 1.0 a 3.9
    grade = 1.0 + (3.0 * (score / passingScore));
  } else {
    // Escala superior: de 4.0 a 7.0
    grade = 4.0 + (3.0 * ((score - passingScore) / (maxScore - passingScore)));
  }

  // Redondear a 1 decimal
  return Math.round(grade * 10) / 10;
}

/**
 * Determina el Nivel de Logro según los estándares pedagógicos MINEDUC
 */
export function getMineducPerformanceLevel(grade: number): PerformanceLevel {
  if (grade < 4.0) {
    return 'Insuficiente';
  } else if (grade <= 5.0) {
    return 'Elemental';
  } else {
    return 'Adecuado';
  }
}

/**
 * Color de la nota chilena:
 * En Chile, notas menores a 4.0 son rojas ("rojos").
 * Notas 4.0 o superiores son azules/verdes ("azules").
 */
export function getGradeColorClass(
  grade: number,
  forPaper: boolean = false
): {
  text: string;
  bg: string;
  border: string;
} {
  if (grade < 4.0) {
    return forPaper
      ? {
          text: 'text-rose-700',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
        }
      : {
          text: 'text-rose-700 dark:text-rose-300',
          bg: 'bg-rose-50 dark:bg-rose-950/60',
          border: 'border-rose-200 dark:border-rose-800',
        };
  } else if (grade <= 5.0) {
    return forPaper
      ? {
          text: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
        }
      : {
          text: 'text-amber-700 dark:text-amber-300',
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          border: 'border-amber-200 dark:border-amber-800',
        };
  } else {
    return forPaper
      ? {
          text: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
        }
      : {
          text: 'text-emerald-700 dark:text-emerald-300',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          border: 'border-emerald-200 dark:border-emerald-800',
        };
  }
}

export function formatGrade(grade: number): string {
  return grade.toFixed(1);
}

export function formatChileanPesos(amount: number): string {
  return '$' + amount.toLocaleString('es-CL');
}

export function formatGradeLevelName(grade: string): string {
  const map: Record<string, string> = {
    '1_basico': '1° Básico',
    '2_basico': '2° Básico',
    '3_basico': '3° Básico',
    '4_basico': '4° Básico',
    '5_basico': '5° Básico',
    '6_basico': '6° Básico',
    '7_basico': '7° Básico',
    '8_basico': '8° Básico',
  };
  return map[grade] || grade;
}

export function formatAxisName(axis: string): string {
  const map: Record<string, string> = {
    numeros_operaciones: 'Números y Operaciones',
    patrones_algebra: 'Patrones y Álgebra',
    geometria: 'Geometría',
    medicion: 'Medición',
    datos_probabilidades: 'Datos y Probabilidades',
  };
  return map[axis] || axis;
}

export function formatDifficultyName(diff: string): string {
  const map: Record<string, string> = {
    facil: 'Nivel 1 (Ejercitación Básica)',
    medio: 'Nivel 2 (Aplicación Intermedia)',
    dificil: 'Nivel 3 (Resolución de Problemas)',
    progresivo: 'Progresivo (Niveles 1 al 3)',
  };
  return map[diff] || diff;
}

/**
 * Calcula puntaje simulado en escala oficial SIMCE (150 a 350 pts aprox.)
 * y Nivel de Logro según estándares de la Agencia de Calidad de la Educación.
 */
export function calculateSimceScore(
  score: number,
  maxScore: number,
  gradeLevel: string = '4_basico'
): { score: number; level: PerformanceLevel } {
  if (maxScore <= 0) return { score: 150, level: 'Insuficiente' };
  const ratio = Math.max(0, Math.min(1, score / maxScore));
  const simcePts = Math.round(150 + ratio * 200); // 0% -> 150 pts, 50% -> 250 pts, 100% -> 350 pts

  const adecuadoCut = gradeLevel === '6_basico' ? 290 : 295;
  const elementalCut = gradeLevel === '6_basico' ? 240 : 245;

  let level: PerformanceLevel = 'Insuficiente';
  if (simcePts >= adecuadoCut) {
    level = 'Adecuado';
  } else if (simcePts >= elementalCut) {
    level = 'Elemental';
  }

  return { score: simcePts, level };
}
