import React, { useState, useMemo } from 'react';
import {
  Play,
  SlidersHorizontal,
  Clock,
  BookOpen,
  Layers,
  Check,
  Calculator,
  Shapes,
  BarChart3,
  Percent,
  Sparkles,
  Award,
} from 'lucide-react';
import { GradeLevel, DifficultyLevel, ThematicAxis, SimceGradeLevel } from '../../types';
import { MINEDUC_OBJECTIVES } from '../../data/mineducCurriculum';
import { SIMCE_GRADES, getSimceBankForGrade } from '../../data/simceQuestionBank';
import { formatAxisName, formatGradeLevelName } from '../../utils/chileanGrades';
import { ThemePaletteSelector } from '../ThemePaletteSelector';

export interface FreePracticeConfig {
  grade: GradeLevel;
  oaCode: string;
  difficulty: DifficultyLevel;
  count: number;
  timeLimitMinutes: number;
  title: string;
  axis: ThematicAxis;
  isSimce?: boolean;
  simceAxisFilter?: ThematicAxis | 'all';
}

interface FreePracticeViewProps {
  onStartPractice: (config: FreePracticeConfig) => void;
}

interface QuickTopic {
  id: string;
  label: string;
  subtitle: string;
  grade: GradeLevel;
  oaCode: string;
  category: 'aritmetica' | 'fracciones_porcentajes' | 'algebra' | 'geometria_datos';
}

const QUICK_TOPICS: QuickTopic[] = [
  // Aritmética y Enteros
  {
    id: 'sumas_restas_1',
    label: 'Sumas y Restas (hasta 20)',
    subtitle: '1° Básico · OA 09',
    grade: '1_basico',
    oaCode: 'OA 09',
    category: 'aritmetica',
  },
  {
    id: 'sumas_restas_3',
    label: 'Adición y Sustracción (hasta 1.000)',
    subtitle: '3° Básico · OA 06',
    grade: '3_basico',
    oaCode: 'OA 06',
    category: 'aritmetica',
  },
  {
    id: 'tablas_multiplicar',
    label: 'Tablas de Multiplicar',
    subtitle: '3° Básico · OA 08',
    grade: '3_basico',
    oaCode: 'OA 08',
    category: 'aritmetica',
  },
  {
    id: 'multiplicacion_4',
    label: 'Multiplicación (3 dígitos × 1)',
    subtitle: '4° Básico · OA 05',
    grade: '4_basico',
    oaCode: 'OA 05',
    category: 'aritmetica',
  },
  {
    id: 'division_4',
    label: 'División Exacta e Inexacta',
    subtitle: '4° Básico · OA 06',
    grade: '4_basico',
    oaCode: 'OA 06',
    category: 'aritmetica',
  },
  {
    id: 'combinadas_5',
    label: 'Operaciones Combinadas (PAPOMUDAS)',
    subtitle: '5° Básico · OA 02',
    grade: '5_basico',
    oaCode: 'OA 02',
    category: 'aritmetica',
  },
  {
    id: 'primos_multiplos_6',
    label: 'Factores, Múltiplos y Primos',
    subtitle: '6° Básico · OA 01',
    grade: '6_basico',
    oaCode: 'OA 01',
    category: 'aritmetica',
  },
  {
    id: 'enteros_suma_7',
    label: 'Números Enteros (Suma y Resta en Z)',
    subtitle: '7° Básico · OA 01',
    grade: '7_basico',
    oaCode: 'OA 01',
    category: 'aritmetica',
  },
  {
    id: 'enteros_mult_8',
    label: 'Números Enteros (Mult. y Div. en Z)',
    subtitle: '8° Básico · OA 01',
    grade: '8_basico',
    oaCode: 'OA 01',
    category: 'aritmetica',
  },
  {
    id: 'potencias_raices_8',
    label: 'Potencias y Raíces Cuadradas',
    subtitle: '8° Básico · OA 04',
    grade: '8_basico',
    oaCode: 'OA 04',
    category: 'aritmetica',
  },

  // Fracciones, Decimales y Porcentajes
  {
    id: 'fracciones_4',
    label: 'Fracciones Propias y Representación',
    subtitle: '4° Básico · OA 08',
    grade: '4_basico',
    oaCode: 'OA 08',
    category: 'fracciones_porcentajes',
  },
  {
    id: 'fracciones_mixtos_6',
    label: 'Adición y Sustracción de Fracciones',
    subtitle: '6° Básico · OA 06',
    grade: '6_basico',
    oaCode: 'OA 06',
    category: 'fracciones_porcentajes',
  },
  {
    id: 'decimales_5',
    label: 'Números Decimales hasta la Milésima',
    subtitle: '5° Básico · OA 11',
    grade: '5_basico',
    oaCode: 'OA 11',
    category: 'fracciones_porcentajes',
  },
  {
    id: 'decimales_6',
    label: 'Multiplicación y División de Decimales',
    subtitle: '6° Básico · OA 07',
    grade: '6_basico',
    oaCode: 'OA 07',
    category: 'fracciones_porcentajes',
  },
  {
    id: 'razones_6',
    label: 'Razones y Proporcionalidad',
    subtitle: '6° Básico · OA 03',
    grade: '6_basico',
    oaCode: 'OA 03',
    category: 'fracciones_porcentajes',
  },
  {
    id: 'porcentajes_7',
    label: 'Porcentajes, Descuentos e IVA',
    subtitle: '7° Básico · OA 04',
    grade: '7_basico',
    oaCode: 'OA 04',
    category: 'fracciones_porcentajes',
  },

  // Álgebra y Ecuaciones
  {
    id: 'patrones_4',
    label: 'Patrones Numéricos en Tablas',
    subtitle: '4° Básico · OA 13',
    grade: '4_basico',
    oaCode: 'OA 13',
    category: 'algebra',
  },
  {
    id: 'ecuaciones_6',
    label: 'Ecuaciones de Primer Grado (ax + b = c)',
    subtitle: '6° Básico · OA 11',
    grade: '6_basico',
    oaCode: 'OA 11',
    category: 'algebra',
  },
  {
    id: 'ecuaciones_inec_7',
    label: 'Ecuaciones e Inecuaciones Lineales',
    subtitle: '7° Básico · OA 09',
    grade: '7_basico',
    oaCode: 'OA 09',
    category: 'algebra',
  },
  {
    id: 'funciones_8',
    label: 'Función Lineal y Afín f(x) = mx + n',
    subtitle: '8° Básico · OA 10',
    grade: '8_basico',
    oaCode: 'OA 10',
    category: 'algebra',
  },

  // Geometría, Medición y Probabilidades
  {
    id: 'reloj_tiempo_2',
    label: 'Lectura del Reloj y Tiempo',
    subtitle: '2° Básico · OA 18',
    grade: '2_basico',
    oaCode: 'OA 18',
    category: 'geometria_datos',
  },
  {
    id: 'area_perimetro_5',
    label: 'Área de Triángulos y Paralelogramos',
    subtitle: '5° Básico · OA 22',
    grade: '5_basico',
    oaCode: 'OA 22',
    category: 'geometria_datos',
  },
  {
    id: 'angulos_6',
    label: 'Ángulos en Rectas y Triángulos',
    subtitle: '6° Básico · OA 17',
    grade: '6_basico',
    oaCode: 'OA 17',
    category: 'geometria_datos',
  },
  {
    id: 'circulo_7',
    label: 'Círculo y Circunferencia',
    subtitle: '7° Básico · OA 11',
    grade: '7_basico',
    oaCode: 'OA 11',
    category: 'geometria_datos',
  },
  {
    id: 'pitagoras_8',
    label: 'Teorema de Pitágoras',
    subtitle: '8° Básico · OA 12',
    grade: '8_basico',
    oaCode: 'OA 12',
    category: 'geometria_datos',
  },
  {
    id: 'promedio_5',
    label: 'Promedio (Media Aritmética)',
    subtitle: '5° Básico · OA 23',
    grade: '5_basico',
    oaCode: 'OA 23',
    category: 'geometria_datos',
  },
  {
    id: 'probabilidad_7',
    label: 'Probabilidad y Regla de Laplace',
    subtitle: '7° Básico · OA 18',
    grade: '7_basico',
    oaCode: 'OA 18',
    category: 'geometria_datos',
  },
];

const GRADE_OPTIONS: { id: GradeLevel; short: string; name: string }[] = [
  { id: '1_basico', short: '1°', name: '1° Básico' },
  { id: '2_basico', short: '2°', name: '2° Básico' },
  { id: '3_basico', short: '3°', name: '3° Básico' },
  { id: '4_basico', short: '4°', name: '4° Básico' },
  { id: '5_basico', short: '5°', name: '5° Básico' },
  { id: '6_basico', short: '6°', name: '6° Básico' },
  { id: '7_basico', short: '7°', name: '7° Básico' },
  { id: '8_basico', short: '8°', name: '8° Básico' },
];

const LENGTH_OPTIONS = [5, 10, 15, 20, 30];

const TIME_OPTIONS = [
  { minutes: 0, label: 'Libre' },
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 20, label: '20 min' },
];

const DIFFICULTY_OPTIONS: {
  id: DifficultyLevel;
  label: string;
  desc: string;
}[] = [
  { id: 'facil', label: 'Nivel 1 · Básico', desc: 'Ejercitación directa y cálculo base' },
  { id: 'medio', label: 'Nivel 2 · Intermedio', desc: 'Aplicación y variedad de ejercicios' },
  { id: 'dificil', label: 'Nivel 3 · Problemas', desc: 'Resolución de problemas cotidianos' },
  { id: 'progresivo', label: 'Progresivo (1 al 3)', desc: 'Comienza básico y sube de dificultad' },
];

export const FreePracticeView: React.FC<FreePracticeViewProps> = ({ onStartPractice }) => {
  const [browseTab, setBrowseTab] = useState<'topics' | 'curriculum' | 'simce'>('topics');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('5_basico');
  const [selectedAxisFilter, setSelectedAxisFilter] = useState<ThematicAxis | 'all'>('all');
  const [selectedOACode, setSelectedOACode] = useState<string>('OA 11');

  // SIMCE specific selectors for 4°, 6°, and 8° Básico
  const [simceGrade, setSimceGrade] = useState<SimceGradeLevel>('4_basico');
  const [simceAxis, setSimceAxis] = useState<ThematicAxis | 'all'>('all');

  const [lengthCount, setLengthCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('facil');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(0);

  const simcePool = useMemo(() => {
    const bank = getSimceBankForGrade(simceGrade);
    return simceAxis === 'all' ? bank : bank.filter(q => q.axis === simceAxis);
  }, [simceGrade, simceAxis]);

  const gradeObjectives = useMemo(
    () => MINEDUC_OBJECTIVES.filter(oa => oa.grade === selectedGrade),
    [selectedGrade]
  );

  const filteredObjectives = useMemo(
    () =>
      selectedAxisFilter === 'all'
        ? gradeObjectives
        : gradeObjectives.filter(oa => oa.axis === selectedAxisFilter),
    [gradeObjectives, selectedAxisFilter]
  );

  const activeOA = useMemo(
    () =>
      MINEDUC_OBJECTIVES.find(oa => oa.grade === selectedGrade && oa.code === selectedOACode) ||
      gradeObjectives[0] ||
      MINEDUC_OBJECTIVES[0],
    [selectedGrade, selectedOACode, gradeObjectives]
  );

  const handleSelectQuickTopic = (topic: QuickTopic) => {
    setSelectedGrade(topic.grade);
    setSelectedOACode(topic.oaCode);
  };

  const handleGradeChange = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    const firstInGrade = MINEDUC_OBJECTIVES.find(
      oa => oa.grade === grade && (selectedAxisFilter === 'all' || oa.axis === selectedAxisFilter)
    );
    if (firstInGrade) {
      setSelectedOACode(firstInGrade.code);
    } else {
      const anyInGrade = MINEDUC_OBJECTIVES.find(oa => oa.grade === grade);
      if (anyInGrade) {
        setSelectedAxisFilter('all');
        setSelectedOACode(anyInGrade.code);
      }
    }
  };

  const handleStart = () => {
    if (browseTab === 'simce') {
      const gradeLabel = formatGradeLevelName(simceGrade);
      const axisLabel = simceAxis === 'all' ? 'Ensayo Integral' : formatAxisName(simceAxis);
      const cappedCount = Math.min(lengthCount, simcePool.length);
      onStartPractice({
        grade: simceGrade,
        oaCode: simceAxis === 'all' ? 'SIMCE Integral' : `SIMCE · ${axisLabel}`,
        difficulty,
        count: cappedCount,
        timeLimitMinutes,
        title: `Ensayo SIMCE ${gradeLabel} · ${axisLabel}`,
        axis: simceAxis === 'all' ? 'numeros_operaciones' : simceAxis,
        isSimce: true,
        simceAxisFilter: simceAxis,
      });
      return;
    }

    if (!activeOA) return;
    onStartPractice({
      grade: activeOA.grade,
      oaCode: activeOA.code,
      difficulty,
      count: lengthCount,
      timeLimitMinutes,
      title: `Práctica Libre: ${activeOA.title}`,
      axis: activeOA.axis,
    });
  };

  const categorySections: {
    key: QuickTopic['category'];
    title: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'aritmetica',
      title: 'Aritmética, Operaciones y Enteros',
      icon: <Calculator className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
    },
    {
      key: 'fracciones_porcentajes',
      title: 'Fracciones, Decimales, Razones y Porcentajes',
      icon: <Percent className="w-4 h-4 tq-text-accent" />,
    },
    {
      key: 'algebra',
      title: 'Patrones, Álgebra y Funciones',
      icon: <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
    },
    {
      key: 'geometria_datos',
      title: 'Geometría, Medición y Probabilidades',
      icon: <Shapes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    },
  ];

  return (
    <div className="max-w-[1320px] mx-auto py-4 md:py-6 space-y-6 font-sans">
      {/* Header Banner */}
      <div className="tq-card border rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium tq-text-accent">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acceso Abierto · Sin inicio de sesión ni registro de notas</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight tq-text">
              Práctica Libre ThatQuiz
            </h1>
            <p className="text-sm tq-text-2 max-w-2xl">
              Elige cualquier contenido matemático de 1° a 8° Básico, ajusta el largo, el nivel y el tiempo, ejercita libremente y obtén tu nota inmediata para seguir practicando.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs tq-text-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 tq-border">
            <div>
              <span className="block tq-text-muted">Escala de nota</span>
              <strong className="tq-text font-mono tabular-nums">1.0 a 7.0 (60%)</strong>
            </div>
            <span className="tq-text-muted opacity-40" aria-hidden="true">|</span>
            <div>
              <span className="block tq-text-muted">Cobertura curricular</span>
              <strong className="tq-text tabular-nums">{MINEDUC_OBJECTIVES.length} OAs MINEDUC</strong>
            </div>
          </div>
        </div>

        {/* Palette switcher right on Free Practice entry */}
        <div className="pt-3 border-t tq-border">
          <ThemePaletteSelector variant="inline-bar" title="Paleta de colores" />
        </div>
      </div>

      {/* Main Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone (8 cols): Topic / OA Picker */}
        <section className="lg:col-span-8 tq-card border rounded-2xl p-5 md:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b tq-border pb-4">
            <div>
              <h2 className="text-base font-bold tq-text">
                1. Selecciona el contenido que quieres ejercitar
              </h2>
              <p className="text-xs tq-text-muted mt-0.5">
                Acceso directo por tema clásico o explora por curso y Objetivo de Aprendizaje.
              </p>
            </div>

            {/* Segmented Control */}
            <div className="flex flex-wrap items-center gap-1 p-1 tq-muted rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setBrowseTab('topics')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  browseTab === 'topics'
                    ? 'tq-card tq-text shadow-2xs'
                    : 'tq-text-2 hover:tq-text'
                }`}
              >
                Temas Clásicos
              </button>
              <button
                type="button"
                onClick={() => setBrowseTab('curriculum')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  browseTab === 'curriculum'
                    ? 'tq-card tq-text shadow-2xs'
                    : 'tq-text-2 hover:tq-text'
                }`}
              >
                Por Curso y OA (1° a 8°)
              </button>
              <button
                type="button"
                onClick={() => setBrowseTab('simce')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  browseTab === 'simce'
                    ? 'tq-btn-primary shadow-2xs'
                    : 'tq-text-accent hover:tq-text'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>SIMCE 4°·6°·8°</span>
              </button>
            </div>
          </div>

          {browseTab === 'simce' ? (
            <div className="space-y-5">
              <div className="p-4 tq-tint border rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold tq-text-accent">
                  <Award className="w-4 h-4" />
                  <span>Sección Especial SIMCE · Preguntas Reales con Alternativas (A, B, C, D)</span>
                </div>
                <p className="text-xs tq-text-2 leading-relaxed">
                  Ejercita de manera independiente con ítems reales extraídos de cuadernillos liberados de la Agencia de Calidad de la Educación y ensayos oficiales chilenos para 4°, 6° y 8° Básico.
                </p>
              </div>

              {/* Grade Selection: 4°, 6°, 8° */}
              <div className="space-y-2">
                <label className="block text-xs font-bold tq-text-2">
                  Nivel SIMCE:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SIMCE_GRADES.map(g => {
                    const active = simceGrade === g.id;
                    const count = getSimceBankForGrade(g.id).length;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSimceGrade(g.id);
                          setSimceAxis('all');
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'tq-tint border-[var(--tq-accent)] ring-1 ring-[var(--tq-accent)]/40'
                            : 'tq-subtle border-[var(--tq-border)] hover:bg-[var(--tq-card-bg)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${active ? 'tq-text-accent' : 'tq-text'}`}>
                            {g.label}
                          </span>
                          <span className="font-mono text-[11px] tq-text-muted">{count} ítems</span>
                        </div>
                        <p className="text-[11px] tq-text-muted mt-1 line-clamp-2">{g.targetDesc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Axis Filter */}
              <div className="space-y-2">
                <label className="block text-xs font-bold tq-text-2">
                  Enfoque del Ensayo SIMCE:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'all', label: 'Ensayo Integral SIMCE (Todos los ejes)' },
                      { id: 'numeros_operaciones', label: 'Números y Operaciones' },
                      { id: 'patrones_algebra', label: 'Patrones y Álgebra' },
                      { id: 'geometria', label: 'Geometría' },
                      { id: 'medicion', label: 'Medición' },
                      { id: 'datos_probabilidades', label: 'Datos y Probabilidades' },
                    ] as const
                  ).map(ax => {
                    const active = simceAxis === ax.id;
                    const count =
                      ax.id === 'all'
                        ? getSimceBankForGrade(simceGrade).length
                        : getSimceBankForGrade(simceGrade).filter(q => q.axis === ax.id).length;
                    return (
                      <button
                        key={ax.id}
                        type="button"
                        onClick={() => setSimceAxis(ax.id)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          active
                            ? 'tq-tint border-[var(--tq-accent)] font-bold tq-text'
                            : 'tq-card border-[var(--tq-border)] tq-text-2 hover:bg-[var(--tq-subtle-bg)]'
                        }`}
                      >
                        <span>{ax.label}</span>
                        <span className="font-mono text-[11px] tq-text-muted shrink-0">{count} preg.</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : browseTab === 'topics' ? (
            <div className="space-y-6">
              {categorySections.map(cat => {
                const items = QUICK_TOPICS.filter(t => t.category === cat.key);
                return (
                  <div key={cat.key} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold tq-text-2">
                      {cat.icon}
                      <span>{cat.title}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                      {items.map(topic => {
                        const isSelected =
                          selectedGrade === topic.grade && selectedOACode === topic.oaCode;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => handleSelectQuickTopic(topic)}
                            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                              isSelected
                                ? 'tq-tint border-[var(--tq-accent)] ring-1 ring-[var(--tq-accent)]/30'
                                : 'tq-subtle border-[var(--tq-border)] hover:border-[var(--tq-border-strong)] hover:bg-[var(--tq-card-bg)]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className={`text-xs font-bold leading-snug ${isSelected ? 'tq-text-accent' : 'tq-text'}`}>
                                {topic.label}
                              </div>
                              <div className="text-[11px] tq-text-muted mt-1">
                                {topic.subtitle}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 tq-text-accent shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grade Selector Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold tq-text-2">
                  Curso (Educación Básica):
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {GRADE_OPTIONS.map(g => {
                    const active = selectedGrade === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleGradeChange(g.id)}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'tq-btn-primary border-[var(--tq-accent)] shadow-2xs'
                            : 'tq-card tq-text-2 hover:border-[var(--tq-border-strong)] hover:bg-[var(--tq-subtle-bg)]'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Axis Filter */}
              <div className="space-y-2">
                <label className="block text-xs font-bold tq-text-2">
                  Eje Temático MINEDUC:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Todos los ejes' },
                      { id: 'numeros_operaciones', label: 'Números y Operaciones' },
                      { id: 'patrones_algebra', label: 'Patrones y Álgebra' },
                      { id: 'geometria', label: 'Geometría' },
                      { id: 'medicion', label: 'Medición' },
                      { id: 'datos_probabilidades', label: 'Datos y Probabilidades' },
                    ] as const
                  ).map(ax => {
                    const active = selectedAxisFilter === ax.id;
                    return (
                      <button
                        key={ax.id}
                        type="button"
                        onClick={() => setSelectedAxisFilter(ax.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'tq-btn-primary border-[var(--tq-accent)]'
                            : 'tq-subtle tq-text-2 hover:bg-[var(--tq-card-bg)] hover:tq-text'
                        }`}
                      >
                        {ax.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OA List */}
              <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
                {filteredObjectives.map(oa => {
                  const isSelected = activeOA.code === oa.code && activeOA.grade === oa.grade;
                  return (
                    <button
                      key={`${oa.grade}-${oa.code}`}
                      type="button"
                      onClick={() => setSelectedOACode(oa.code)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'tq-tint border-[var(--tq-accent)] ring-1 ring-[var(--tq-accent)]/30'
                          : 'tq-card border-[var(--tq-border)] hover:border-[var(--tq-border-strong)] hover:bg-[var(--tq-subtle-bg)]'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs tq-text-muted">
                          <span className="font-mono font-bold tq-text-accent">{oa.code}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatAxisName(oa.axis)}</span>
                        </div>
                        <div className="text-sm font-bold tq-text">
                          {oa.title}
                        </div>
                        <p className="text-xs tq-text-2 line-clamp-2">
                          {oa.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 tq-text-accent shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Right Zone (4 cols): ThatQuiz Practice Configurator */}
        <aside className="lg:col-span-4 tq-card border rounded-2xl p-5 md:p-6 shadow-2xs space-y-5 lg:sticky lg:top-20">
          <div className="flex items-center gap-2 border-b tq-border pb-3">
            <SlidersHorizontal className="w-4 h-4 tq-text-accent" />
            <h2 className="text-base font-bold tq-text">
              2. Configura tu Práctica
            </h2>
          </div>

          {/* Selected Content Summary */}
          <div className="p-3.5 rounded-xl tq-subtle border space-y-1">
            {browseTab === 'simce' ? (
              <>
                <div className="flex flex-wrap items-center gap-1.5 text-xs tq-text-accent font-semibold">
                  <span>{formatGradeLevelName(simceGrade)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">Formato SIMCE A/B/C/D</span>
                </div>
                <div className="text-sm font-bold tq-text leading-snug">
                  {simceAxis === 'all' ? 'Ensayo Integral SIMCE (Todos los ejes)' : `SIMCE · ${formatAxisName(simceAxis)}`}
                </div>
                <p className="text-xs tq-text-2">
                  Preguntas estandarizadas con puntaje simulado (escala 150–350 pts) y nota chilena al finalizar.
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1.5 text-xs tq-text-accent font-semibold">
                  <span>{formatGradeLevelName(activeOA.grade)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{activeOA.code}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tq-text-2">{formatAxisName(activeOA.axis)}</span>
                </div>
                <div className="text-sm font-bold tq-text leading-snug">
                  {activeOA.title}
                </div>
                <p className="text-xs tq-text-2 line-clamp-3">
                  {activeOA.description}
                </p>
              </>
            )}
          </div>

          {/* Largo (Cantidad de ejercicios) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold tq-text flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 tq-text-muted" />
                <span>Largo (Cantidad de ejercicios)</span>
              </label>
              <span className="font-mono font-bold tq-text-accent tabular-nums">
                {browseTab === 'simce' ? Math.min(lengthCount, simcePool.length) : lengthCount} preguntas
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {LENGTH_OPTIONS.map(num => {
                const effectiveMax = browseTab === 'simce' ? simcePool.length : 30;
                const disabled = num > effectiveMax;
                const active = (browseTab === 'simce' ? Math.min(lengthCount, simcePool.length) : lengthCount) === num;
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={disabled}
                    onClick={() => setLengthCount(num)}
                    className={`py-2.5 rounded-xl border font-mono text-xs font-bold tabular-nums transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                      active
                        ? 'tq-btn-primary border-[var(--tq-accent)] shadow-2xs'
                        : 'tq-subtle tq-text-2 hover:bg-[var(--tq-card-bg)] hover:border-[var(--tq-border-strong)]'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nivel de Dificultad */}
          <div className="space-y-2">
            <label className="text-xs font-bold tq-text flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 tq-text-muted" />
              <span>Nivel de dificultad</span>
            </label>

            <div className="grid grid-cols-1 gap-1.5">
              {DIFFICULTY_OPTIONS.map(opt => {
                const active = difficulty === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDifficulty(opt.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      active
                        ? 'tq-tint border-[var(--tq-accent)] tq-text'
                        : 'tq-subtle border-[var(--tq-border)] tq-text-2 hover:bg-[var(--tq-card-bg)] hover:border-[var(--tq-border-strong)]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[11px] tq-text-muted">{opt.desc}</div>
                    </div>
                    {active && <Check className="w-4 h-4 tq-text-accent shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duración / Tiempo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold tq-text flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 tq-text-muted" />
                <span>Tiempo</span>
              </label>
              <span className="font-mono tq-text-2 font-semibold">
                {timeLimitMinutes === 0 ? 'Sin límite' : `${timeLimitMinutes} min`}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {TIME_OPTIONS.map(opt => {
                const active = timeLimitMinutes === opt.minutes;
                return (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => setTimeLimitMinutes(opt.minutes)}
                    className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'tq-btn-primary border-[var(--tq-accent)]'
                        : 'tq-subtle tq-text-2 hover:bg-[var(--tq-card-bg)] hover:border-[var(--tq-border-strong)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-2 border-t tq-border space-y-2.5">
            <button
              type="button"
              onClick={handleStart}
              className="w-full py-3.5 px-5 tq-btn-primary font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {browseTab === 'simce'
                  ? `Comenzar Ensayo SIMCE (${Math.min(lengthCount, simcePool.length)} preg.)`
                  : `Comenzar Práctica (${lengthCount} ejercicios)`}
              </span>
            </button>

            <p className="text-[11px] tq-text-muted text-center leading-relaxed">
              Al terminar verás tu nota (1.0 a 7.0) y la corrección paso a paso. No se guarda ningún registro.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
