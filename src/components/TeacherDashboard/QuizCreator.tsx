import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MINEDUC_OBJECTIVES } from '../../data/mineducCurriculum';
import { generateQuestionsForOA, generateSingleUniqueQuestion } from '../../utils/questionGenerator';
import { formatAxisName, formatGradeLevelName } from '../../utils/chileanGrades';
import { ThematicAxis, DifficultyLevel, Question, QuizAssignment } from '../../types';
import { MathVisuals } from '../QuizTaker/MathVisuals';
import { Sparkles, RefreshCw, Calendar, Clock, BookOpen, Layers, Check, ArrowRight, Shuffle, Edit3, ShieldCheck, X } from 'lucide-react';

export const QuizCreator: React.FC = () => {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    addQuizAssignment,
    setActiveTeacherTab,
    activeOAForCreation,
    setActiveOAForCreation,
    currentTeacher,
    teacherStudents,
  } = useApp();

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const gradeLevel = selectedCourse?.grade || '5_basico';

  // Filter available OAs for this grade
  const availableOAs = MINEDUC_OBJECTIVES.filter(oa => oa.grade === gradeLevel);

  const [selectedOA, setSelectedOA] = useState<string>(activeOAForCreation || availableOAs[0]?.code || 'OA 02');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('progresivo');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(20);
  const [customTitle, setCustomTitle] = useState<string>('');

  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);

  const currentOAObj = availableOAs.find(oa => oa.code === selectedOA) || availableOAs[0];

  // Consume activeOAForCreation if redirected from CurriculumView
  useEffect(() => {
    if (activeOAForCreation) {
      setSelectedOA(activeOAForCreation);
      setActiveOAForCreation(null);
    }
  }, [activeOAForCreation]);

  // Sync selectedOA when switching grades
  useEffect(() => {
    if (!availableOAs.some(oa => oa.code === selectedOA)) {
      if (availableOAs[0]) {
        setSelectedOA(availableOAs[0].code);
      }
    }
  }, [gradeLevel, availableOAs, selectedOA]);

  // Auto-generate questions whenever OA, difficulty or count changes
  useEffect(() => {
    if (!currentOAObj) return;
    const questions = generateQuestionsForOA({
      grade: gradeLevel,
      oaCode: currentOAObj.code,
      difficulty,
      count: questionCount,
    });
    setGeneratedQuestions(questions);
    setActivePreviewIndex(0);

    if (!customTitle || customTitle.startsWith('Evaluación:') || customTitle.startsWith('Evaluación MateClic:')) {
      setCustomTitle(`Evaluación MateClic: ${currentOAObj.title}`);
    }
  }, [selectedCourseId, gradeLevel, selectedOA, difficulty, questionCount]);

  const handleRegenerate = () => {
    if (!currentOAObj) return;
    const questions = generateQuestionsForOA({
      grade: gradeLevel,
      oaCode: currentOAObj.code,
      difficulty,
      count: questionCount,
    });
    setGeneratedQuestions(questions);
    setActivePreviewIndex(0);
  };

  const handleReplaceSingleQuestion = (indexToReplace: number) => {
    if (!currentOAObj) return;
    const otherQuestions = generatedQuestions.filter((_, idx) => idx !== indexToReplace);
    const replacement = generateSingleUniqueQuestion({
      grade: gradeLevel,
      oaCode: currentOAObj.code,
      difficulty,
      existingQuestions: otherQuestions,
      index: indexToReplace + 1,
    });

    setGeneratedQuestions(prev => {
      const updated = [...prev];
      updated[indexToReplace] = replacement;
      return updated;
    });
  };

  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion({ ...q });
    setIsEditingModalOpen(true);
  };

  const handleSaveEditedQuestion = () => {
    if (!editingQuestion) return;
    setGeneratedQuestions(prev =>
      prev.map((q, idx) => (idx === activePreviewIndex ? editingQuestion : q))
    );
    setIsEditingModalOpen(false);
  };

  const handleSaveAndAssign = () => {
    if (!selectedCourse) return;

    const quizCode = `QUIZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newQuiz: QuizAssignment = {
      id: `quiz_${Date.now()}`,
      code: quizCode,
      title: customTitle.trim() || `Evaluación ${currentOAObj.code}`,
      courseId: selectedCourse.id,
      teacherId: currentTeacher.id,
      teacherName: currentTeacher.name,
      gradeLevel: selectedCourse.grade,
      axis: currentOAObj.axis,
      oaCode: currentOAObj.code,
      difficulty,
      totalQuestions: generatedQuestions.length,
      deadline,
      timeLimitMinutes,
      questions: generatedQuestions,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addQuizAssignment(newQuiz);
    setActiveTeacherTab('quizzes');
  };

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="tq-card border rounded-xl p-5 shadow-xs">
        <h1 className="text-xl font-bold tq-text">
          Crear Nueva Evaluación MateClic
        </h1>
        <p className="text-xs tq-text-muted mt-1">
          Configura los contenidos curriculares MINEDUC, el nivel de dificultad y asigna una fecha límite para tus estudiantes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters (5 cols) */}
        <div className="lg:col-span-5 tq-card border rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold tq-text border-b tq-border pb-2">
            1. Parámetros Pedagógicos
          </h2>

          {/* Course select */}
          <div>
            <label className="block text-xs font-semibold tq-text-2 mb-1">
              Curso Destino:
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full text-xs border tq-input rounded-lg p-2.5 font-medium focus:outline-hidden"
            >
              {courses.map(c => {
                const myCount = teacherStudents.filter(s => s.courseId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.section} · {myCount > 0 ? `${myCount} alumnos en tu lista` : 'Sin lista cargada'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* OA MINEDUC select */}
          <div>
            <label className="block text-xs font-semibold tq-text-2 mb-1">
              Objetivo de Aprendizaje (OA MINEDUC):
            </label>
            <select
              value={selectedOA}
              onChange={e => setSelectedOA(e.target.value)}
              className="w-full text-xs border tq-input rounded-lg p-2.5 font-medium focus:outline-hidden"
            >
              {availableOAs.map(oa => (
                <option key={oa.code} value={oa.code}>
                  {oa.code}: {oa.title} ({formatAxisName(oa.axis)})
                </option>
              ))}
            </select>
            {currentOAObj && (
              <p className="text-[11px] tq-text-muted mt-1.5 p-2 tq-subtle rounded border italic">
                {currentOAObj.description}
              </p>
            )}
          </div>

          {/* Difficulty Level */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold tq-text-2">
                Nivel Pedagógico de Dificultad:
              </label>
              <span className="text-[11px] font-medium tq-accent-soft px-2 py-0.5 rounded-full border tq-border">
                {difficulty === 'progresivo'
                  ? 'Progresión 1 ➔ 2 ➔ 3'
                  : difficulty === 'facil'
                  ? 'Nivel 1: Ejercitación'
                  : difficulty === 'medio'
                  ? 'Nivel 2: Aplicación'
                  : 'Nivel 3: Problemas'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setDifficulty('facil')}
                className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                  difficulty === 'facil'
                    ? 'border-[var(--tq-accent)] tq-tint tq-text shadow-2xs ring-1 ring-[var(--tq-accent)]'
                    : 'tq-card border-[var(--tq-border)] tq-text-2 hover:border-[var(--tq-border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Nivel 1: Ejercitación Básica</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 rounded">Directo</span>
                </div>
                <p className="text-[11px] tq-text-muted mt-0.5">Cálculo directo, algoritmos y conceptos esenciales.</p>
              </button>

              <button
                type="button"
                onClick={() => setDifficulty('medio')}
                className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                  difficulty === 'medio'
                    ? 'border-[var(--tq-accent)] tq-tint tq-text shadow-2xs ring-1 ring-[var(--tq-accent)]'
                    : 'tq-card border-[var(--tq-border)] tq-text-2 hover:border-[var(--tq-border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Nivel 2: Aplicación Intermedia</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 rounded">Incógnitas</span>
                </div>
                <p className="text-[11px] tq-text-muted mt-0.5">Términos faltantes, propiedades y relaciones.</p>
              </button>

              <button
                type="button"
                onClick={() => setDifficulty('dificil')}
                className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                  difficulty === 'dificil'
                    ? 'border-[var(--tq-accent)] tq-tint tq-text shadow-2xs ring-1 ring-[var(--tq-accent)]'
                    : 'tq-card border-[var(--tq-border)] tq-text-2 hover:border-[var(--tq-border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Nivel 3: Resolución de Problemas</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 rounded">Contextualizado</span>
                </div>
                <p className="text-[11px] tq-text-muted mt-0.5">Problemas cotidianos reales en $ CLP y vida escolar.</p>
              </button>

              <button
                type="button"
                onClick={() => setDifficulty('progresivo')}
                className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                  difficulty === 'progresivo'
                    ? 'border-[var(--tq-accent)] tq-tint tq-text shadow-2xs ring-1 ring-[var(--tq-accent)]'
                    : 'tq-card border-[var(--tq-border)] tq-text-2 hover:border-[var(--tq-border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Modo Progresivo (Nivel 1 al 3)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 rounded">Recomendado</span>
                </div>
                <p className="text-[11px] tq-text-muted mt-0.5">Inicia en ejercitación básica y avanza hacia problemas.</p>
              </button>
            </div>

            {/* Explanatory pedagogical route */}
            <div className="p-2.5 tq-subtle border rounded-lg text-[11px] tq-text-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--tq-accent)] shrink-0" />
              <span>
                {difficulty === 'progresivo'
                  ? 'El examen comenzará con ejercitación básica directa en los primeros ejercicios, avanzará a aplicación intermedia y finalizará con resolución de problemas contextualizados.'
                  : difficulty === 'facil'
                  ? 'Todas las preguntas serán de ejercitación directa y cálculo procedimental para afianzar la mecánica del objetivo.'
                  : difficulty === 'medio'
                  ? 'Todas las preguntas requerirán aplicar propiedades, encontrar términos faltantes o establecer relaciones.'
                  : 'Todas las preguntas serán problemas narrativos de la vida real que exigen modelar y resolver la situación.'}
              </span>
            </div>
          </div>

          {/* Number of exercises: 5 to 20 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold tq-text-2">
                Cantidad de Ejercicios:
              </label>
              <span className="font-mono text-xs font-bold tq-text-accent">
                {questionCount} ejercicios
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {[5, 8, 10, 12, 15, 20].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-1.5 text-xs font-mono font-bold rounded border transition-colors cursor-pointer ${
                    questionCount === cnt
                      ? 'border-[var(--tq-accent)] tq-btn-primary'
                      : 'tq-card border-[var(--tq-border)] tq-text-2 hover:bg-[var(--tq-subtle-bg)]'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold tq-text-2 mb-1">
                Fecha Límite:
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full text-xs border tq-input rounded-lg p-2 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tq-text-2 mb-1">
                Límite de Tiempo:
              </label>
              <select
                value={timeLimitMinutes}
                onChange={e => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full text-xs border tq-input rounded-lg p-2 focus:outline-hidden"
              >
                <option value={0}>Sin límite</option>
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tq-text-2 mb-1">
              Nombre de la Evaluación:
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              placeholder="Ej: Control Formativo 2 - Tablas"
              className="w-full text-xs border tq-input rounded-lg p-2.5 focus:outline-hidden"
            />
          </div>

          {/* Action to publish */}
          <div className="pt-3 border-t tq-border">
            <button
              type="button"
              onClick={handleSaveAndAssign}
              className="w-full py-2.5 tq-btn-primary font-semibold text-xs md:text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Publicar y Asignar al Curso</span>
            </button>
          </div>
        </div>

        {/* Right Panel: Interactive Question Preview (7 cols) */}
        <div className="lg:col-span-7 tq-card border rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b tq-border pb-3 mb-4 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tq-text">
                    2. Vista Previa Interactiva de Ejercicios MateClic
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    100% Únicas (Sin Repetición)
                  </span>
                </div>
                <span className="text-xs tq-text-muted">
                  {generatedQuestions.length} ejercicios pedagógicamente diversificados con contextos reales
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="px-3 py-1.5 text-xs tq-text-2 tq-muted hover:opacity-85 rounded-lg flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                  title="Generar otro set completo de ejercicios aleatorios"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerar todo el examen</span>
                </button>
              </div>
            </div>

            {/* Question selector tabs */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <span className="text-[11px] font-bold tq-text-muted mr-1">Pregunta:</span>
              {generatedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePreviewIndex(idx)}
                  className={`w-7 h-7 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    activePreviewIndex === idx
                      ? 'tq-btn-primary shadow-xs scale-105'
                      : 'tq-muted hover:opacity-85 tq-text-2'
                  }`}
                  title={`Pregunta ${idx + 1}: ${q.categoryLabel || 'Ejercicio'}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Currently selected question card */}
            {generatedQuestions[activePreviewIndex] && (
              <div className="p-5 border-2 tq-border rounded-2xl tq-card shadow-2xs space-y-4 min-h-[300px]">
                {/* Header of the card */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b tq-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold tq-text tq-muted px-2 py-0.5 rounded-md">
                      Ejercicio {activePreviewIndex + 1} de {generatedQuestions.length}
                    </span>
                    {generatedQuestions[activePreviewIndex].categoryLabel && (
                      <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                        {generatedQuestions[activePreviewIndex].categoryLabel}
                      </span>
                    )}
                    <span className="font-mono text-[11px] tq-text-muted hidden sm:inline">
                      {generatedQuestions[activePreviewIndex].questionType === 'multiple_choice' ? 'Alternativas' : 'Respuesta Numérica'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleReplaceSingleQuestion(activePreviewIndex)}
                      className="px-2.5 py-1 text-[11px] font-bold tq-accent-soft border tq-border rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Cambiar este ejercicio por otro diferente sin alterar el resto de la prueba"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>Cambiar solo esta pregunta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(generatedQuestions[activePreviewIndex])}
                      className="px-2.5 py-1 text-[11px] font-bold tq-subtle tq-text-2 border rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Personalizar texto o respuesta"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>

                <div className="text-center py-2">
                  <p className="text-base font-semibold tq-text leading-snug">
                    {generatedQuestions[activePreviewIndex].prompt}
                  </p>
                  {generatedQuestions[activePreviewIndex].context && (
                    <div className="mt-2 text-lg font-mono font-bold tq-text-accent tq-tint inline-block px-3.5 py-1.5 rounded-xl border">
                      {generatedQuestions[activePreviewIndex].context}
                    </div>
                  )}
                </div>

                {/* Visual */}
                <MathVisuals
                  visualType={generatedQuestions[activePreviewIndex].visualType}
                  visualData={generatedQuestions[activePreviewIndex].visualData}
                />

                {/* Multiple choice options preview if applicable */}
                {generatedQuestions[activePreviewIndex].questionType === 'multiple_choice' && (
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                    {generatedQuestions[activePreviewIndex].options?.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-xl text-xs text-center border font-medium ${
                          opt === generatedQuestions[activePreviewIndex].correctAnswer
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'tq-subtle border tq-text-2'
                        }`}
                      >
                        {opt} {opt === generatedQuestions[activePreviewIndex].correctAnswer ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                )}

                {/* Correct answer & explanation */}
                <div className="pt-3 border-t tq-border text-xs space-y-1 tq-subtle p-3 rounded-xl border">
                  <div className="flex items-center gap-2">
                    <span className="tq-text-muted font-medium">Respuesta correcta esperada:</span>
                    <span className="font-mono font-black text-emerald-800 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {generatedQuestions[activePreviewIndex].correctAnswer}
                    </span>
                  </div>
                  <p className="tq-text-2 mt-1">
                    <strong className="tq-text font-bold">Retroalimentación pedagógica MateClic:</strong>{' '}
                    {generatedQuestions[activePreviewIndex].explanation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation between preview questions */}
          <div className="flex items-center justify-between pt-4 border-t tq-border mt-4 text-xs">
            <button
              type="button"
              disabled={activePreviewIndex === 0}
              onClick={() => setActivePreviewIndex(prev => prev - 1)}
              className="px-3 py-1.5 font-bold tq-text-2 hover:tq-text disabled:opacity-30 cursor-pointer"
            >
              ← Ejercicio Anterior
            </button>
            <span className="tq-text-muted font-medium">
              Ejercicio {activePreviewIndex + 1} de {generatedQuestions.length}
            </span>
            <button
              type="button"
              disabled={activePreviewIndex === generatedQuestions.length - 1}
              onClick={() => setActivePreviewIndex(prev => prev + 1)}
              className="px-3 py-1.5 font-bold tq-text-2 hover:tq-text disabled:opacity-30 cursor-pointer"
            >
              Siguiente Ejercicio →
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Edit Question */}
      {isEditingModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
          <div className="tq-card rounded-3xl border-2 shadow-2xl max-w-lg w-full p-6 relative font-sans space-y-4">
            <div className="flex items-center justify-between border-b tq-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 tq-text-accent" />
                <h3 className="text-sm font-bold tq-text">
                  Editar Ejercicio {activePreviewIndex + 1}
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
                Contexto o Ecuación (opcional):
              </label>
              <input
                type="text"
                value={editingQuestion.context || ''}
                onChange={e => setEditingQuestion({ ...editingQuestion, context: e.target.value })}
                className="w-full text-xs font-mono p-2 border tq-input rounded-xl focus:outline-hidden"
                placeholder="Ej: (-7) + 15 = ?"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  Respuesta Correcta:
                </label>
                <input
                  type="text"
                  value={editingQuestion.correctAnswer}
                  onChange={e => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                  className="w-full text-xs font-mono font-bold p-2 border tq-input rounded-xl focus:outline-hidden text-emerald-700 dark:text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  Categoría / Etiqueta:
                </label>
                <input
                  type="text"
                  value={editingQuestion.categoryLabel || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, categoryLabel: e.target.value })}
                  className="w-full text-xs p-2 border tq-input rounded-xl focus:outline-hidden"
                  placeholder="Ej: Problema Cotidiano"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tq-text-2 mb-1">
                Explicación / Retroalimentación:
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
                className="px-3.5 py-2 text-xs font-bold tq-text-2 hover:bg-[var(--tq-muted-bg)] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditedQuestion}
                className="px-4 py-2 text-xs font-bold tq-btn-primary rounded-xl shadow-xs transition-colors cursor-pointer"
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
