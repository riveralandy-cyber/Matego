import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SIMCE_GRADES,
  getSimceBankForGrade,
  buildSimceExamQuestions,
  pickReplacementSimceQuestion,
} from '../../data/simceQuestionBank';
import { formatAxisName, formatDifficultyName } from '../../utils/chileanGrades';
import {
  DifficultyLevel,
  Question,
  QuizAssignment,
  SimceGradeLevel,
  ThematicAxis,
} from '../../types';
import { MathVisuals } from '../QuizTaker/MathVisuals';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Edit3,
  Layers,
  Play,
  RefreshCw,
  Shuffle,
  X,
} from 'lucide-react';

function isSimceGrade(grade: string): grade is SimceGradeLevel {
  return grade === '4_basico' || grade === '6_basico' || grade === '8_basico';
}

export const SimceCreatorView: React.FC = () => {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    addQuizAssignment,
    setActiveTeacherTab,
    currentTeacher,
    teacherStudents,
    teacherAssignments,
    setActiveQuizTaking,
  } = useApp();

  const currentSelectedCourse = courses.find(c => c.id === selectedCourseId);

  const [simceGrade, setSimceGrade] = useState<SimceGradeLevel>(() =>
    currentSelectedCourse && isSimceGrade(currentSelectedCourse.grade)
      ? currentSelectedCourse.grade
      : '4_basico'
  );

  // Courses matching the selected SIMCE grade (e.g. 4°A, 4°B)
  const simceLevelCourses = useMemo(
    () => courses.filter(c => c.grade === simceGrade),
    [courses, simceGrade]
  );

  const [targetCourseId, setTargetCourseId] = useState<string>(() => {
    if (currentSelectedCourse && isSimceGrade(currentSelectedCourse.grade)) {
      return currentSelectedCourse.id;
    }
    return courses.find(c => c.grade === '4_basico')?.id || courses[0]?.id || '';
  });

  // Sync when teacher changes active course in sidebar to another 4°/6°/8°
  useEffect(() => {
    if (currentSelectedCourse && isSimceGrade(currentSelectedCourse.grade)) {
      setSimceGrade(currentSelectedCourse.grade);
      setTargetCourseId(currentSelectedCourse.id);
    }
  }, [currentSelectedCourse?.id]);

  // Keep targetCourseId aligned when switching SIMCE grade tabs directly
  useEffect(() => {
    if (!simceLevelCourses.some(c => c.id === targetCourseId) && simceLevelCourses[0]) {
      setTargetCourseId(simceLevelCourses[0].id);
    }
  }, [simceGrade, simceLevelCourses, targetCourseId]);

  const [axisFilter, setAxisFilter] = useState<ThematicAxis | 'all'>('all');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('progresivo');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(45);
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [customTitle, setCustomTitle] = useState<string>('Ensayo SIMCE Matemática · 4° Básico');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);

  // Edit question modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);

  const fullBankForGrade = useMemo(() => getSimceBankForGrade(simceGrade), [simceGrade]);
  const maxPoolCount = useMemo(
    () =>
      axisFilter === 'all'
        ? fullBankForGrade.length
        : fullBankForGrade.filter(q => q.axis === axisFilter).length,
    [fullBankForGrade, axisFilter]
  );

  // Ensure questionCount never exceeds pool
  useEffect(() => {
    if (questionCount > maxPoolCount && maxPoolCount > 0) {
      setQuestionCount(maxPoolCount);
    }
  }, [maxPoolCount, questionCount]);

  // Auto-build SIMCE exam whenever level, axis, difficulty, or count changes
  useEffect(() => {
    const built = buildSimceExamQuestions({
      grade: simceGrade,
      axisFilter,
      difficulty,
      count: questionCount,
    });
    setQuestions(built);
    setActivePreviewIndex(0);

    const gradeLabel = SIMCE_GRADES.find(g => g.id === simceGrade)?.label || 'SIMCE';
    const scopeLabel = axisFilter === 'all' ? 'Ensayo Integral' : formatAxisName(axisFilter);
    setCustomTitle(`Ensayo SIMCE ${gradeLabel} · ${scopeLabel}`);
  }, [simceGrade, axisFilter, difficulty, questionCount]);

  const handleRegenerate = () => {
    const built = buildSimceExamQuestions({
      grade: simceGrade,
      axisFilter,
      difficulty,
      count: questionCount,
    });
    setQuestions(built);
    setActivePreviewIndex(0);
  };

  const handleReplaceSingleQuestion = (idxToReplace: number) => {
    const targetQ = questions[idxToReplace];
    if (!targetQ) return;
    const replacement = pickReplacementSimceQuestion({
      grade: simceGrade,
      axisFilter,
      existingIds: questions.map(q => q.id),
      preferredAxis: targetQ.axis,
    });
    if (!replacement) return;

    setQuestions(prev => prev.map((q, idx) => (idx === idxToReplace ? replacement : q)));
  };

  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion({
      ...q,
      options: q.options ? [...q.options] : ['', '', '', ''],
    });
    setIsEditingModalOpen(true);
  };

  const handleSaveEditedQuestion = () => {
    if (!editingQuestion) return;
    setQuestions(prev =>
      prev.map((q, idx) => (idx === activePreviewIndex ? editingQuestion : q))
    );
    setIsEditingModalOpen(false);
  };

  const buildAssignmentObject = (): QuizAssignment | null => {
    const targetCourse = courses.find(c => c.id === targetCourseId) || simceLevelCourses[0];
    if (!targetCourse) return null;

    const shortCode = simceGrade === '4_basico' ? '4B' : simceGrade === '6_basico' ? '6B' : '8B';
    const quizCode = `SIMCE-${shortCode}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      id: `simce_quiz_${Date.now()}`,
      code: quizCode,
      title: customTitle.trim() || `Ensayo SIMCE ${shortCode}`,
      courseId: targetCourse.id,
      teacherId: currentTeacher.id,
      teacherName: currentTeacher.name,
      gradeLevel: simceGrade,
      axis: axisFilter === 'all' ? 'numeros_operaciones' : axisFilter,
      oaCode: axisFilter === 'all' ? 'SIMCE Integral' : `SIMCE · ${formatAxisName(axisFilter)}`,
      difficulty,
      totalQuestions: questions.length,
      deadline,
      timeLimitMinutes,
      questions,
      createdAt: new Date().toISOString().split('T')[0],
      isSimce: true,
      simceAxisFilter: axisFilter,
    };
  };

  const handleAssignToCourse = () => {
    const newQuiz = buildAssignmentObject();
    if (!newQuiz) return;
    setSelectedCourseId(newQuiz.courseId);
    addQuizAssignment(newQuiz);
    setActiveTeacherTab('quizzes');
  };

  const handlePracticeWithClass = () => {
    const liveQuiz = buildAssignmentObject();
    if (!liveQuiz) return;
    setActiveQuizTaking({
      ...liveQuiz,
      code: 'SIMCE-VIVO',
    });
  };

  const existingSimceAssignments = useMemo(
    () => teacherAssignments.filter(a => a.isSimce || a.oaCode.startsWith('SIMCE')),
    [teacherAssignments]
  );

  const lengthChoices = useMemo(() => {
    const presets = [5, 10, 15, 20, 25, 30, 40].filter(n => n <= maxPoolCount);
    if (!presets.includes(maxPoolCount) && maxPoolCount > 0) {
      presets.push(maxPoolCount);
    }
    return presets;
  }, [maxPoolCount]);

  const activeGradeInfo = SIMCE_GRADES.find(g => g.id === simceGrade) || SIMCE_GRADES[0];
  const currentQ = questions[activePreviewIndex];

  return (
    <div className="space-y-3.5 min-w-0">
      {/* Top Header & Level Switcher (4°, 6°, 8°) */}
      <div className="tq-card border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tq-text-accent">
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>Banco Oficial SIMCE Chile · Preguntas Liberadas</span>
            </div>
            <h1 className="text-lg font-bold tq-text leading-tight">
              Sección Especial SIMCE · 4°, 6° y 8° Básico
            </h1>
            <p className="text-xs tq-text-muted max-w-2xl">
              Crea evaluaciones formato SIMCE (A, B, C, D) con ítems reales para asignar a tus cursos o proyectar en clases.
            </p>
          </div>

          {/* 3 SIMCE Grade Buttons */}
          <div className="flex items-center gap-1 p-1 tq-muted rounded-xl shrink-0">
            {SIMCE_GRADES.map(g => {
              const active = simceGrade === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSimceGrade(g.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'tq-btn-primary shadow-2xs'
                      : 'tq-text-2 hover:tq-text hover:bg-[var(--tq-card-bg)]'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grade Spec Strip */}
        <div className="px-3 py-2 tq-subtle border rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="tq-text-2 font-medium">{activeGradeInfo.targetDesc}</span>
          <span className="font-mono font-bold tq-text-accent shrink-0">
            {fullBankForGrade.length} ítems reales ({simceGrade.replace('_basico', '° Básico')})
          </span>
        </div>
      </div>

      {/* Main Two-Column Creator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-w-0">
        {/* Left Config Panel (5 cols) */}
        <div className="lg:col-span-5 tq-card border rounded-xl p-4 shadow-xs space-y-3 min-w-0">
          <h2 className="text-sm font-bold tq-text border-b tq-border pb-2">
            1. Configuración del Ensayo SIMCE ({activeGradeInfo.label})
          </h2>

          {/* Target Course */}
          <div>
            <label className="block text-xs font-semibold tq-text-2 mb-1">
              Curso Destino ({activeGradeInfo.label}):
            </label>
            <select
              value={targetCourseId}
              onChange={e => setTargetCourseId(e.target.value)}
              className="w-full text-xs border tq-input rounded-lg p-2.5 font-medium focus:outline-hidden"
            >
              {simceLevelCourses.map(c => {
                const count = teacherStudents.filter(s => s.courseId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.section} · {count > 0 ? `${count} alumnos en tu lista` : 'Sin lista cargada'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Axis / Coverage Selection */}
          <div>
            <label className="block text-xs font-semibold tq-text-2 mb-1.5">
              Cobertura por Eje Temático SIMCE:
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {(
                [
                  { id: 'all', label: 'Ensayo Integral SIMCE (Todos los ejes)', count: fullBankForGrade.length },
                  { id: 'numeros_operaciones', label: 'Números y Operaciones', count: fullBankForGrade.filter(q => q.axis === 'numeros_operaciones').length },
                  { id: 'patrones_algebra', label: 'Patrones y Álgebra', count: fullBankForGrade.filter(q => q.axis === 'patrones_algebra').length },
                  { id: 'geometria', label: 'Geometría', count: fullBankForGrade.filter(q => q.axis === 'geometria').length },
                  { id: 'medicion', label: 'Medición', count: fullBankForGrade.filter(q => q.axis === 'medicion').length },
                  { id: 'datos_probabilidades', label: 'Datos y Probabilidades', count: fullBankForGrade.filter(q => q.axis === 'datos_probabilidades').length },
                ] as const
              ).map(ax => {
                const active = axisFilter === ax.id;
                return (
                  <button
                    key={ax.id}
                    type="button"
                    onClick={() => setAxisFilter(ax.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                      active
                        ? 'tq-tint border-[var(--tq-accent)] tq-text font-bold'
                        : 'tq-subtle border-[var(--tq-border)] tq-text-2 hover:bg-[var(--tq-card-bg)]'
                    }`}
                  >
                    <span>{ax.label}</span>
                    <span className="font-mono text-[11px] tq-text-muted tabular-nums">
                      {ax.count} ítems
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty / Standard Level */}
          <div>
            <label className="block text-xs font-semibold tq-text-2 mb-1.5">
              Nivel de Complejidad SIMCE:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'progresivo', label: 'Progresivo (Oficial)', desc: 'Elemental → Adecuado' },
                  { id: 'facil', label: 'Nivel Elemental', desc: 'Conceptos y cálculo base' },
                  { id: 'medio', label: 'Nivel Intermedio', desc: 'Aplicación y representación' },
                  { id: 'dificil', label: 'Nivel Adecuado', desc: 'Problemas complejos' },
                ] as const
              ).map(opt => {
                const active = difficulty === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDifficulty(opt.id)}
                    className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'border-[var(--tq-accent)] tq-tint tq-text ring-1 ring-[var(--tq-accent)]/40'
                        : 'tq-card border-[var(--tq-border)] tq-text-2 hover:border-[var(--tq-border-strong)]'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] tq-text-muted mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold tq-text-2 mb-1">
                Cantidad de Preguntas:
              </label>
              <div className="flex flex-wrap gap-1">
                {lengthChoices.map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold cursor-pointer ${
                      questionCount === num
                        ? 'tq-btn-primary border-[var(--tq-accent)]'
                        : 'tq-subtle tq-text-2 hover:bg-[var(--tq-card-bg)]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tq-text-2 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 tq-text-muted" />
                <span>Tiempo Límite:</span>
              </label>
              <select
                value={timeLimitMinutes}
                onChange={e => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full text-xs border tq-input rounded-lg p-2 font-medium focus:outline-hidden"
              >
                <option value={0}>Sin límite de tiempo</option>
                <option value={25}>25 minutos</option>
                <option value={45}>45 minutos (Ensayo corto)</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos (SIMCE oficial)</option>
              </select>
            </div>
          </div>

          {/* Title & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold tq-text-2 mb-1">
                Título del Ensayo:
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                className="w-full text-xs border tq-input rounded-lg p-2 font-medium focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tq-text-2 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 tq-text-muted" />
                <span>Fecha Límite:</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full text-xs border tq-input rounded-lg p-2 font-medium focus:outline-hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t tq-border space-y-2">
            <button
              type="button"
              onClick={handleAssignToCourse}
              className="w-full py-3 px-4 tq-btn-primary text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Asignar Ensayo SIMCE al Curso ({questions.length} preguntas)</span>
            </button>

            <button
              type="button"
              onClick={handlePracticeWithClass}
              className="w-full py-2.5 px-4 tq-btn-gradient-alt text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Ejercitar / Proyectar con Estudiantes Ahora</span>
            </button>
          </div>
        </div>

        {/* Right Booklet Preview & Inspector (7 cols) */}
        <div className="lg:col-span-7 tq-card border rounded-xl p-4 shadow-xs flex flex-col justify-between min-w-0">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b tq-border pb-3">
              <div>
                <h2 className="text-sm font-bold tq-text flex items-center gap-2">
                  <BookOpen className="w-4 h-4 tq-text-accent" />
                  <span>2. Cuadernillo SIMCE · Vista Previa ({questions.length} ítems)</span>
                </h2>
                <p className="text-[11px] tq-text-muted mt-0.5">
                  Revisa cada pregunta, alterna ítems del banco o edita enunciados y alternativas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegenerate}
                className="px-3 py-1.5 tq-subtle border hover:bg-[var(--tq-muted-bg)] rounded-lg text-xs font-bold tq-text-2 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Mezclar / Nuevo Ensayo</span>
              </button>
            </div>

            {/* Numbered Question Selector Grid */}
            <div className="flex flex-wrap gap-1.5">
              {questions.map((q, idx) => {
                const isActive = idx === activePreviewIndex;
                return (
                  <button
                    key={q.id + '-' + idx}
                    type="button"
                    onClick={() => setActivePreviewIndex(idx)}
                    className={`w-8 h-8 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                      isActive
                        ? 'tq-btn-primary border-[var(--tq-accent)] shadow-2xs'
                        : 'tq-subtle tq-text-2 hover:border-[var(--tq-border-strong)]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Active SIMCE Item Card */}
            {currentQ && (
              <div className="p-5 tq-subtle border rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b tq-border pb-2.5">
                  <div className="flex flex-wrap items-center gap-2 tq-text-muted">
                    <span className="font-bold tq-text-accent">
                      Pregunta {activePreviewIndex + 1}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium tq-text-2">
                      {currentQ.axis ? formatAxisName(currentQ.axis) : 'Matemática'}
                    </span>
                    {currentQ.simceSkill && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Habilidad: <strong className="tq-text">{currentQ.simceSkill}</strong></span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{currentQ.oaCode}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleReplaceSingleQuestion(activePreviewIndex)}
                      className="px-2.5 py-1 tq-card border rounded-lg text-[11px] font-bold tq-text-2 hover:tq-text flex items-center gap-1 cursor-pointer"
                      title="Reemplazar por otra pregunta del banco SIMCE"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>Cambiar ítem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(currentQ)}
                      className="px-2.5 py-1 tq-card border rounded-lg text-[11px] font-bold tq-text-accent hover:opacity-85 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>

                {/* Stem & Stimulus */}
                <div className="space-y-3 text-center">
                  <h3 className="text-base md:text-lg font-bold tq-text leading-relaxed max-w-2xl mx-auto">
                    {currentQ.prompt}
                  </h3>
                  {currentQ.context && (
                    <div className="inline-block px-4 py-2 tq-card border rounded-xl font-mono text-lg font-black tq-text-accent">
                      {currentQ.context}
                    </div>
                  )}
                </div>

                <MathVisuals
                  visualType={currentQ.visualType}
                  visualData={currentQ.visualData}
                />

                {/* Official A/B/C/D Alternatives */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
                  {(currentQ.options || []).map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isCorrect = opt === currentQ.correctAnswer;
                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 font-bold'
                            : 'tq-card border tq-text-2'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md font-mono text-[11px] font-black flex items-center justify-center shrink-0 border ${
                            isCorrect
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'tq-muted tq-text-2 tq-border'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Metadata & Distractor Analysis */}
                <div className="p-3.5 tq-card border rounded-xl text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] tq-text-muted">
                    <span>Fuente: <strong className="tq-text-2">{currentQ.simceSource || 'Banco SIMCE Chile'}</strong></span>
                    <span>{formatDifficultyName(currentQ.difficulty)}</span>
                  </div>
                  <p className="tq-text-2 leading-relaxed">
                    <strong className="tq-text">Clave y análisis pedagógico:</strong> {currentQ.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Prev / Next Footer */}
          <div className="flex items-center justify-between pt-4 border-t tq-border mt-4 text-xs">
            <button
              type="button"
              disabled={activePreviewIndex === 0}
              onClick={() => setActivePreviewIndex(prev => prev - 1)}
              className="px-3 py-1.5 font-bold tq-text-2 hover:tq-text disabled:opacity-30 cursor-pointer"
            >
              ← Pregunta Anterior
            </button>
            <span className="tq-text-muted font-medium tabular-nums">
              Pregunta {activePreviewIndex + 1} de {questions.length}
            </span>
            <button
              type="button"
              disabled={activePreviewIndex === questions.length - 1}
              onClick={() => setActivePreviewIndex(prev => prev + 1)}
              className="px-3 py-1.5 font-bold tq-text-2 hover:tq-text disabled:opacity-30 cursor-pointer"
            >
              Siguiente Pregunta →
            </button>
          </div>
        </div>
      </div>

      {/* Assigned SIMCE Exams Quick List */}
      {existingSimceAssignments.length > 0 && (
        <div className="tq-card border rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tq-text flex items-center gap-2">
              <Layers className="w-4 h-4 tq-text-accent" />
              <span>Ensayos SIMCE asignados por ti ({existingSimceAssignments.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setActiveTeacherTab('quizzes')}
              className="text-xs font-bold tq-text-accent hover:underline cursor-pointer"
            >
              Ir a Ver Exámenes →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {existingSimceAssignments.map(quiz => {
              const course = courses.find(c => c.id === quiz.courseId);
              return (
                <div key={quiz.id} className="p-3.5 tq-subtle border rounded-xl flex flex-col justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono font-bold tq-text-accent">
                      {quiz.code} · {course?.section}
                    </div>
                    <div className="text-xs font-bold tq-text mt-0.5 line-clamp-1">
                      {quiz.title}
                    </div>
                    <div className="text-[11px] tq-text-muted mt-1">
                      {quiz.totalQuestions} preguntas · Plazo: {quiz.deadline}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveQuizTaking(quiz)}
                    className="mt-1 py-1.5 px-3 tq-card border hover:border-[var(--tq-border-strong)] rounded-lg text-[11px] font-bold tq-text flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 tq-text-accent fill-current" />
                    <span>Proyectar / Probar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {isEditingModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="tq-card rounded-3xl border-2 shadow-2xl max-w-lg w-full p-6 relative font-sans space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b tq-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 tq-text-accent" />
                <h3 className="text-sm font-bold tq-text">
                  Editar Pregunta SIMCE {activePreviewIndex + 1}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="w-7 h-7 rounded-full tq-muted hover:opacity-80 flex items-center justify-center tq-text-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Enunciado de la Pregunta:
              </label>
              <textarea
                rows={3}
                value={editingQuestion.prompt}
                onChange={e => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                className="w-full text-xs p-2.5 border tq-input rounded-xl focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Estímulo / Expresión destacada (opcional):
              </label>
              <input
                type="text"
                value={editingQuestion.context || ''}
                onChange={e => setEditingQuestion({ ...editingQuestion, context: e.target.value })}
                className="w-full text-xs font-mono p-2 border tq-input rounded-xl focus:outline-hidden"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold tq-text-2">
                Alternativas (A, B, C, D) — marca cuál es correcta:
              </label>
              {(editingQuestion.options || ['', '', '', '']).map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isCorrect = opt === editingQuestion.correctAnswer;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: opt })}
                      className={`w-7 h-7 rounded-lg font-mono text-xs font-bold border shrink-0 cursor-pointer ${
                        isCorrect
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'tq-muted tq-text-2 tq-border'
                      }`}
                      title="Marcar como respuesta correcta"
                    >
                      {letter}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => {
                        const val = e.target.value;
                        const nextOpts = [...(editingQuestion.options || ['', '', '', ''])];
                        const wasCorrect = nextOpts[idx] === editingQuestion.correctAnswer;
                        nextOpts[idx] = val;
                        setEditingQuestion({
                          ...editingQuestion,
                          options: nextOpts,
                          correctAnswer: wasCorrect ? val : editingQuestion.correctAnswer,
                        });
                      }}
                      className="flex-1 text-xs p-2 border tq-input rounded-xl focus:outline-hidden"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Explicación pedagógica:
              </label>
              <textarea
                rows={2}
                value={editingQuestion.explanation}
                onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                className="w-full text-xs p-2.5 border tq-input rounded-xl focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t tq-border">
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold tq-text-2 hover:bg-[var(--tq-muted-bg)] rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditedQuestion}
                className="px-4 py-2 text-xs font-bold tq-btn-primary rounded-xl shadow-xs cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
