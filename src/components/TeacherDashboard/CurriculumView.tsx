import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MINEDUC_OBJECTIVES } from '../../data/mineducCurriculum';
import { GradeLevel, ThematicAxis, LearningObjective } from '../../types';
import { formatAxisName, formatGradeLevelName } from '../../utils/chileanGrades';
import { BookOpen, Search, Sparkles, PlusCircle, CheckCircle2, Filter, Layers, Award, ArrowRight } from 'lucide-react';

export const CurriculumView: React.FC = () => {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    setActiveTeacherTab,
    setActiveOAForCreation,
    currentTeacher,
  } = useApp();

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('7_basico');
  const [selectedAxis, setSelectedAxis] = useState<ThematicAxis | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Pastel styling configuration per grade level with dark-mode support
  const GRADE_BUTTONS: { id: GradeLevel; label: string; badge: string; pastelActive: string; pastelIdle: string }[] = [
    { id: '1_basico', label: '1° Básico', badge: '1°B', pastelActive: 'bg-sky-100 dark:bg-sky-900/70 border-sky-400 text-sky-950 dark:text-sky-100 font-black shadow-xs', pastelIdle: 'hover:bg-sky-50/70 dark:hover:bg-sky-950/50 border-[var(--tq-border)] text-sky-900 dark:text-sky-200' },
    { id: '2_basico', label: '2° Básico', badge: '2°B', pastelActive: 'bg-emerald-100 dark:bg-emerald-900/70 border-emerald-400 text-emerald-950 dark:text-emerald-100 font-black shadow-xs', pastelIdle: 'hover:bg-emerald-50/70 dark:hover:bg-emerald-950/50 border-[var(--tq-border)] text-emerald-900 dark:text-emerald-200' },
    { id: '3_basico', label: '3° Básico', badge: '3°B', pastelActive: 'bg-amber-100 dark:bg-amber-900/70 border-amber-400 text-amber-950 dark:text-amber-100 font-black shadow-xs', pastelIdle: 'hover:bg-amber-50/70 dark:hover:bg-amber-950/50 border-[var(--tq-border)] text-amber-900 dark:text-amber-200' },
    { id: '4_basico', label: '4° Básico', badge: '4°B', pastelActive: 'bg-orange-100 dark:bg-orange-900/70 border-orange-400 text-orange-950 dark:text-orange-100 font-black shadow-xs', pastelIdle: 'hover:bg-orange-50/70 dark:hover:bg-orange-950/50 border-[var(--tq-border)] text-orange-900 dark:text-orange-200' },
    { id: '5_basico', label: '5° Básico', badge: '5°B', pastelActive: 'bg-indigo-100 dark:bg-indigo-900/70 border-indigo-400 text-indigo-950 dark:text-indigo-100 font-black shadow-xs', pastelIdle: 'hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 border-[var(--tq-border)] text-indigo-900 dark:text-indigo-200' },
    { id: '6_basico', label: '6° Básico', badge: '6°B', pastelActive: 'bg-purple-100 dark:bg-purple-900/70 border-purple-400 text-purple-950 dark:text-purple-100 font-black shadow-xs', pastelIdle: 'hover:bg-purple-50/70 dark:hover:bg-purple-950/50 border-[var(--tq-border)] text-purple-900 dark:text-purple-200' },
    { id: '7_basico', label: '7° Básico', badge: '7°B', pastelActive: 'bg-pink-100 dark:bg-pink-900/70 border-pink-400 text-pink-950 dark:text-pink-100 font-black ring-2 ring-pink-300 dark:ring-pink-700 shadow-xs', pastelIdle: 'hover:bg-pink-50/70 dark:hover:bg-pink-950/50 border-[var(--tq-border)] text-pink-900 dark:text-pink-200' },
    { id: '8_basico', label: '8° Básico', badge: '8°B', pastelActive: 'bg-teal-100 dark:bg-teal-900/70 border-teal-400 text-teal-950 dark:text-teal-100 font-black shadow-xs', pastelIdle: 'hover:bg-teal-50/70 dark:hover:bg-teal-950/50 border-[var(--tq-border)] text-teal-900 dark:text-teal-200' },
  ];

  // Thematic axes
  const AXES: { id: ThematicAxis | 'todos'; label: string; chipClass: string }[] = [
    { id: 'todos', label: 'Todos los Ejes', chipClass: 'tq-muted tq-text-2 border-[var(--tq-border)]' },
    { id: 'numeros_operaciones', label: 'Números y Operaciones', chipClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-800' },
    { id: 'patrones_algebra', label: 'Patrones y Álgebra', chipClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800' },
    { id: 'geometria', label: 'Geometría', chipClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' },
    { id: 'medicion', label: 'Medición', chipClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800' },
    { id: 'datos_probabilidades', label: 'Datos y Probabilidades', chipClass: 'bg-pink-50 dark:bg-pink-950/60 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-800' },
  ];

  const gradeObjectives = MINEDUC_OBJECTIVES.filter(oa => oa.grade === selectedGrade);

  const filteredObjectives = gradeObjectives.filter(oa => {
    const matchesAxis = selectedAxis === 'todos' || oa.axis === selectedAxis;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesAxis;

    const matchesQuery =
      oa.code.toLowerCase().includes(query) ||
      oa.title.toLowerCase().includes(query) ||
      oa.description.toLowerCase().includes(query) ||
      oa.indicators.some(ind => ind.toLowerCase().includes(query));

    return matchesAxis && matchesQuery;
  });

  const getAxisBadgeColor = (axis: ThematicAxis) => {
    switch (axis) {
      case 'numeros_operaciones':
        return 'bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800';
      case 'patrones_algebra':
        return 'bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 'geometria':
        return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800';
      case 'medicion':
        return 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800';
      case 'datos_probabilidades':
        return 'bg-pink-100 dark:bg-pink-950/70 text-pink-900 dark:text-pink-200 border-pink-200 dark:border-pink-800';
      default:
        return 'tq-muted tq-text-2 border-[var(--tq-border)]';
    }
  };

  const handleCreateQuizFromOA = (oa: LearningObjective) => {
    // Pick or sync matching course for this grade
    const targetCourse = courses.find(c => c.grade === oa.grade);
    if (targetCourse) {
      setSelectedCourseId(targetCourse.id);
    }
    setActiveOAForCreation(oa.code);
    setActiveTeacherTab('create_quiz');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header card */}
      <div className="tq-card border rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b tq-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider tq-accent-soft px-2.5 py-0.5 rounded-full border tq-border">
                Curículum Nacional MINEDUC
              </span>
              <span className="text-xs font-semibold tq-text-muted">
                Escuela Ricardo Silva Arriagada · SLEP Chinchorro
              </span>
            </div>
            <h1 className="text-2xl font-black tq-text mt-1 flex items-center gap-2">
              <span>Objetivos de Aprendizaje (OA) Matemática</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs tq-text-muted mt-1 max-w-3xl">
              Bases curriculares oficiales de 1° a 8° año Básico para la asignatura de Matemática. Cada objetivo incluye sus indicadores de logro pedagógicos oficiales y permite generar automáticamente evaluaciones ThatQuiz personalizadas con 5 a 20 ejercicios interactivos.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="tq-tint p-3 rounded-2xl border text-right">
              <div className="text-[10px] tq-text-accent font-bold uppercase">Docente responsable</div>
              <div className="text-xs font-bold tq-text">{currentTeacher?.name || 'Prof. Landy Rivera'}</div>
              <div className="text-[10px] tq-text-muted">Arica, Región XV</div>
            </div>
          </div>
        </div>

        {/* Grade Level Selectors (1° to 8° Básico) */}
        <div className="mt-5">
          <label className="text-xs font-bold tq-text-2 uppercase tracking-wider block mb-2">
            Selecciona el Nivel Educativo:
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {GRADE_BUTTONS.map(btn => {
              const isSelected = selectedGrade === btn.id;
              const countInGrade = MINEDUC_OBJECTIVES.filter(o => o.grade === btn.id).length;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setSelectedGrade(btn.id)}
                  className={`p-2.5 rounded-2xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    isSelected ? btn.pastelActive : `tq-card ${btn.pastelIdle}`
                  }`}
                >
                  <span className="text-xs">{btn.label}</span>
                  <span className="text-[10px] opacity-75 mt-0.5">{countInGrade} Objetivos</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thematic Axes Pills & Search Filter */}
        <div className="mt-5 pt-4 border-t tq-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold tq-text-2 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 tq-text-accent" />
              Eje:
            </span>
            {AXES.map(ax => {
              const isSelected = selectedAxis === ax.id;
              return (
                <button
                  key={ax.id}
                  type="button"
                  onClick={() => setSelectedAxis(ax.id)}
                  className={`px-3 py-1 text-xs rounded-xl border transition-all font-semibold cursor-pointer ${
                    isSelected
                      ? 'tq-btn-primary border-[var(--tq-accent)] shadow-2xs font-bold'
                      : `${ax.chipClass} hover:opacity-85`
                  }`}
                >
                  {ax.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar en OA (ej: fracciones, ángulos)..."
              className="w-full pl-9 pr-3 py-2 text-xs tq-input border rounded-xl focus:outline-hidden transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Summary indicator */}
      <div className="flex items-center justify-between text-xs tq-text-2 px-2">
        <span className="font-bold">
          Mostrando <span className="tq-text-accent font-black">{filteredObjectives.length}</span> objetivos curriculares para <span className="tq-text font-bold">{formatGradeLevelName(selectedGrade)}</span>
        </span>
        <span className="tq-text-muted text-[11px]">
          Alineado con Bases Curriculares Decreto N° 2960 / Actualización MINEDUC
        </span>
      </div>

      {/* Grid of Learning Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredObjectives.map(oa => {
          return (
            <div
              key={`${oa.grade}-${oa.code}`}
              className="tq-card rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Badges bar */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl tq-btn-primary font-mono font-black text-xs shadow-2xs tracking-wide">
                      {oa.code}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${getAxisBadgeColor(oa.axis)}`}>
                      {formatAxisName(oa.axis)}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold tq-text-muted">
                    {formatGradeLevelName(oa.grade)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold tq-text group-hover:tq-text-accent transition-colors mb-2">
                  {oa.title}
                </h3>

                {/* Description */}
                <p className="text-xs tq-text-2 leading-relaxed mb-4 tq-subtle p-3 rounded-2xl border">
                  {oa.description}
                </p>

                {/* Indicators list */}
                {oa.indicators && oa.indicators.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider tq-text-muted block">
                      Indicadores de Evaluación MINEDUC:
                    </span>
                    <ul className="space-y-1">
                      {oa.indicators.map((ind, i) => (
                        <li key={i} className="text-[11px] tq-text-2 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="pt-3 border-t tq-border flex items-center justify-between gap-2">
                <span className="text-[11px] tq-text-muted flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Eje oficial evaluable
                </span>

                <button
                  type="button"
                  onClick={() => handleCreateQuizFromOA(oa)}
                  className="px-3.5 py-2 tq-btn-gradient hover:opacity-95 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Crear prueba de este OA</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredObjectives.length === 0 && (
        <div className="tq-card rounded-3xl p-10 text-center border border-dashed tq-border">
          <BookOpen className="w-10 h-10 tq-text-muted opacity-50 mx-auto mb-2" />
          <p className="text-sm font-bold tq-text-2">No se encontraron objetivos de aprendizaje</p>
          <p className="text-xs tq-text-muted mt-1">Prueba seleccionando otro eje temático o limpiando tu búsqueda.</p>
        </div>
      )}
    </div>
  );
};
