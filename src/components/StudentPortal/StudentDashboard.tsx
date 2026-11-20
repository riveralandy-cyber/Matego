import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Calendar, Clock, Play, CheckCircle2, RotateCcw, LogOut, FileText, KeyRound, Sparkles, Palette, Award, Cloud } from 'lucide-react';
import { formatGrade, getGradeColorClass, formatAxisName, formatGradeLevelName } from '../../utils/chileanGrades';
import { QuizAssignment, QuizAttempt, SimceGradeLevel, ThematicAxis } from '../../types';
import { ChangePinModal } from './ChangePinModal';
import { ThemePaletteSelector } from '../ThemePaletteSelector';
import { getSimceBankForGrade } from '../../data/simceQuestionBank';
import { FreePracticeConfig } from '../FreePractice/FreePracticeView';

interface StudentDashboardProps {
  onStartQuiz: (quiz: QuizAssignment) => void;
  onViewAttempt: (attempt: QuizAttempt) => void;
  onStartIndependentSimce?: (config: FreePracticeConfig) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onStartQuiz,
  onViewAttempt,
  onStartIndependentSimce,
}) => {
  const {
    currentStudent,
    setCurrentStudent,
    setRole,
    courses,
    assignments,
    attempts,
    teachers,
    studentSchoolName,
    logoutStudent,
  } = useApp();
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isFirstLoginPrompt, setIsFirstLoginPrompt] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [simceAxis, setSimceAxis] = useState<ThematicAxis | 'all'>('all');
  const [simceCount, setSimceCount] = useState<number>(10);

  if (!currentStudent) return null;

  const course = courses.find(c => c.id === currentStudent.courseId);
  const isSimceLevel =
    course?.grade === '4_basico' || course?.grade === '6_basico' || course?.grade === '8_basico';
  const simceGrade = isSimceLevel ? (course!.grade as SimceGradeLevel) : null;
  const simceBankCount = simceGrade
    ? simceAxis === 'all'
      ? getSimceBankForGrade(simceGrade).length
      : getSimceBankForGrade(simceGrade).filter(q => q.axis === simceAxis).length
    : 0;
  const studentTeacher = teachers.find(t => t.id === currentStudent.teacherId);
  const studentAssignments = assignments.filter(
    a => a.courseId === currentStudent.courseId && a.teacherId === currentStudent.teacherId
  );
  const resolvedTeacherName =
    studentTeacher?.name ||
    studentAssignments.find(a => a.teacherName)?.teacherName ||
    course?.teacherName ||
    'Docente';
  const rawStudentAttempts = attempts.filter(att => att.studentId === currentStudent.id);

  // Deduplicate keeping the earliest/first completed official attempt per quiz
  const studentAttempts = React.useMemo(() => {
    const firstByQuiz = new Map<string, QuizAttempt>();
    [...rawStudentAttempts].reverse().forEach(att => {
      if (!firstByQuiz.has(att.quizId)) {
        firstByQuiz.set(att.quizId, att);
      }
    });
    // Display newest-completed quiz first in history while keeping each quiz's first official attempt
    return Array.from(firstByQuiz.values()).reverse();
  }, [rawStudentAttempts]);

  const completedQuizIds = new Set(studentAttempts.map(a => a.quizId));
  const pendingQuizzes = studentAssignments.filter(a => !completedQuizIds.has(a.id));

  const averageGrade = studentAttempts.length > 0
    ? studentAttempts.reduce((acc, curr) => acc + curr.chileanGrade, 0) / studentAttempts.length
    : null;

  const handleOpenChangePin = (firstTime: boolean = false) => {
    setIsFirstLoginPrompt(firstTime);
    setIsChangePinOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-3 px-2 sm:px-4 font-sans min-w-0">
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        isFirstLoginPrompt={isFirstLoginPrompt}
      />

      {/* Student Banner */}
      <div className="tq-card border rounded-2xl p-3.5 sm:p-4 shadow-xs mb-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 tq-brand-badge border rounded-xl flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
            {currentStudent.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tq-text">
                {currentStudent.name}
              </h1>
              <button
                type="button"
                onClick={() => handleOpenChangePin(false)}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                  currentStudent.hasCustomPin
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                }`}
                title="Haz clic para cambiar tu PIN personal"
              >
                <KeyRound className="w-3 h-3" />
                <span>PIN: {currentStudent.hasCustomPin ? 'Personal' : 'Inicial'}</span>
                <span className="underline ml-0.5 text-[10px]">Cambiar</span>
              </button>

              <button
                type="button"
                onClick={() => setShowThemePicker(prev => !prev)}
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg border tq-tint tq-text-accent flex items-center gap-1.5 transition-all cursor-pointer"
                title="Cambiar paleta de colores de tu plataforma"
              >
                <Palette className="w-3 h-3" />
                <span>Paleta de colores</span>
              </button>
              {currentStudent.ownerUid && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  <span>Nube en vivo</span>
                </span>
              )}
            </div>
            <p className="text-xs tq-text-muted mt-1">
              {course?.section} · Prof. {resolvedTeacherName}
              {studentSchoolName
                ? ` · ${studentSchoolName}`
                : studentTeacher?.schoolName && studentTeacher.schoolName !== 'Mi Establecimiento'
                ? ` · ${studentTeacher.schoolName}`
                : ''}
              {currentStudent.rut ? ` · RUN: ${currentStudent.rut}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {averageGrade !== null && (
            <div className="text-right">
              <span className="text-xs tq-text-muted uppercase tracking-wider block font-medium">
                Promedio General
              </span>
              <span className={`text-2xl font-black font-mono tabular-nums ${getGradeColorClass(averageGrade).text}`}>
                {formatGrade(averageGrade)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={logoutStudent}
            className="px-3 py-1.5 text-xs bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
            title="Cerrar sesión de estudiante"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Expandable Palette Configurator */}
      {showThemePicker && (
        <div className="mb-3.5 p-4 tq-card border-2 rounded-2xl shadow-xs">
          <ThemePaletteSelector
            variant="cards"
            title="Configura la paleta de colores de tu plataforma"
            subtitle="Tu elección queda guardada automáticamente en tu cuenta de estudiante."
          />
        </div>
      )}

      {/* First login recommendation banner if student still uses default PIN */}
      {!currentStudent.hasCustomPin && (
        <div className="mb-3.5 p-3 tq-tint border-2 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tq-text">
                  ¡Personaliza tu clave de acceso MateClic!
                </span>
                <span className="text-[10px] bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold px-2 py-0.5 rounded-full">
                  Recomendado
                </span>
              </div>
              <p className="text-xs tq-text-2 mt-0.5">
                Ingresaste con tu primer PIN provisional (<span className="font-mono font-bold tq-text">{currentStudent.pin}</span>). Cámbialo ahora por tu PIN personal de 4 dígitos para mayor comodidad y privacidad.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenChangePin(true)}
            className="shrink-0 px-3.5 py-2 tq-btn-gradient font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cambiar mi PIN ahora</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 min-w-0">
        {/* Left Column: Pending Quizzes */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div>
            <h2 className="text-lg font-bold tq-text mb-1 flex items-center gap-2">
              <span>Evaluaciones Pendientes Asignadas</span>
              <span className="text-xs px-2 py-0.5 tq-accent-soft border tq-border rounded-full font-semibold">
                {pendingQuizzes.length}
              </span>
            </h2>
            <p className="text-xs tq-text-muted">
              Actividades programadas por tu profesor de matemática con fecha límite.
            </p>
          </div>

          {pendingQuizzes.length === 0 ? (
            <div className="p-8 text-center tq-card border rounded-xl tq-text-muted">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold tq-text">¡Al día! No tienes evaluaciones pendientes.</p>
              <p className="text-xs tq-text-muted mt-1">Puedes revisar tu historial de pruebas completadas a la derecha.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className="p-5 tq-card border hover:border-[var(--tq-border-strong)] rounded-xl shadow-xs transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold tq-accent-soft px-2 py-0.5 rounded">
                          {quiz.code}
                        </span>
                        <span className="text-xs tq-text-muted">
                          {quiz.oaCode} · Nivel {quiz.difficulty}
                        </span>
                      </div>

                      <h3 className="text-base font-bold tq-text">
                        {quiz.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs tq-text-muted">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 opacity-75" />
                          {quiz.totalQuestions} ejercicios
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 opacity-75" />
                          {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} min` : 'Sin límite de tiempo'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 opacity-75" />
                          Plazo: {quiz.deadline}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartQuiz(quiz)}
                      className="px-5 py-2.5 tq-btn-primary font-medium text-xs md:text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Rendir Prueba</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Independent SIMCE Section for 4°, 6° & 8° Básico */}
          {simceGrade && onStartIndependentSimce && (
            <div className="p-5 tq-card border-2 border-[var(--tq-border-strong)] rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b tq-border pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold tq-text-accent">
                    <Award className="w-4 h-4" />
                    <span>Sección Especial SIMCE · {formatGradeLevelName(simceGrade)}</span>
                  </div>
                  <h3 className="text-base font-bold tq-text mt-0.5">
                    Ejercitación SIMCE Independiente (Formato A, B, C, D)
                  </h3>
                  <p className="text-xs tq-text-muted mt-0.5">
                    Prepara tu prueba SIMCE con preguntas reales estandarizadas de tu nivel sin afectar tus notas oficiales.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold tq-accent-soft px-2.5 py-1 rounded-lg border tq-border shrink-0 self-start sm:self-center">
                  {getSimceBankForGrade(simceGrade).length} ítems reales
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold tq-text-2 mb-1">
                    Eje temático o Ensayo Integral:
                  </label>
                  <select
                    value={simceAxis}
                    onChange={e => setSimceAxis(e.target.value as ThematicAxis | 'all')}
                    className="w-full text-xs border tq-input rounded-lg p-2 font-medium focus:outline-hidden"
                  >
                    <option value="all">Ensayo Integral SIMCE (Todos los ejes)</option>
                    <option value="numeros_operaciones">Números y Operaciones</option>
                    <option value="patrones_algebra">Patrones y Álgebra</option>
                    <option value="geometria">Geometría</option>
                    <option value="medicion">Medición</option>
                    <option value="datos_probabilidades">Datos y Probabilidades</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold tq-text-2 mb-1">
                    Cantidad de preguntas:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 15, 20].map(num => {
                      const disabled = num > simceBankCount;
                      const active = Math.min(simceCount, simceBankCount) === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSimceCount(num)}
                          className={`flex-1 py-2 rounded-lg border font-mono text-xs font-bold cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                            active
                              ? 'tq-btn-primary border-[var(--tq-accent)]'
                              : 'tq-subtle tq-text-2 hover:bg-[var(--tq-card-bg)]'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const effectiveCount = Math.max(1, Math.min(simceCount, simceBankCount));
                    const scopeTitle =
                      simceAxis === 'all' ? 'Ensayo Integral' : formatAxisName(simceAxis);
                    onStartIndependentSimce({
                      grade: simceGrade,
                      oaCode: simceAxis === 'all' ? 'SIMCE Integral' : `SIMCE · ${scopeTitle}`,
                      difficulty: 'progresivo',
                      count: effectiveCount,
                      timeLimitMinutes: 0,
                      title: `Ensayo SIMCE ${formatGradeLevelName(simceGrade)} · ${scopeTitle}`,
                      axis: simceAxis === 'all' ? 'numeros_operaciones' : simceAxis,
                      isSimce: true,
                      simceAxisFilter: simceAxis,
                    });
                  }}
                  className="px-4 py-2.5 tq-btn-primary text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    Iniciar Ensayo SIMCE ({Math.min(simceCount, simceBankCount)} preguntas)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Extra Practice CTA */}
          <div className="p-5 tq-tint border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold tq-text">
                ¿Quieres seguir practicando libremente?
              </h3>
              <p className="text-xs tq-text-2 mt-0.5">
                Elige cualquier tema o curso, decide el largo y la dificultad, y practica sin afectar tus notas oficiales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRole('practice')}
              className="px-4 py-2.5 tq-btn-gradient-alt font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ir a Práctica Libre</span>
            </button>
          </div>
        </div>

        {/* Right Column: Completed History */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tq-text mb-1 flex items-center gap-2">
              <span>Historial de Evaluaciones</span>
              <span className="text-xs tq-text-muted font-normal">
                ({studentAttempts.length})
              </span>
            </h2>
            <p className="text-xs tq-text-muted">
              Calificaciones oficiales (1.0 a 7.0) con corrección inmediata.
            </p>
          </div>

          {studentAttempts.length === 0 ? (
            <div className="p-6 text-center tq-card border rounded-xl tq-text-muted text-xs">
              Aún no has completado ninguna evaluación.
            </div>
          ) : (
            <div className="space-y-3">
              {studentAttempts.map(att => {
                const style = getGradeColorClass(att.chileanGrade);
                return (
                  <div
                    key={att.id}
                    className="p-4 tq-card border rounded-xl shadow-xs hover:border-[var(--tq-border-strong)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-mono font-semibold tq-text-muted block">
                          {att.oaCode} · {att.completedAt}
                        </span>
                        <h4 className="text-xs font-bold tq-text mt-0.5 line-clamp-1">
                          {att.quizTitle}
                        </h4>
                        <span className="text-[11px] tq-text-muted block mt-1">
                          {att.score} de {att.totalQuestions} aciertos ({att.percentage}%)
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-xl font-black font-mono tabular-nums ${style.text}`}>
                          {formatGrade(att.chileanGrade)}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                          {att.performanceLevel}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t tq-border flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onViewAttempt(att)}
                        className="tq-text-accent hover:opacity-80 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver corrección</span>
                      </button>

                      {/* Practice same topic without affecting official grade */}
                      {onStartIndependentSimce && (
                        <button
                          type="button"
                          onClick={() => {
                            const matchedQuiz = studentAssignments.find(a => a.id === att.quizId);
                            const resolvedGrade = matchedQuiz?.gradeLevel || course?.grade || '7_basico';
                            onStartIndependentSimce({
                              grade: resolvedGrade,
                              oaCode: matchedQuiz?.oaCode || att.oaCode,
                              difficulty: matchedQuiz?.difficulty || 'progresivo',
                              count: matchedQuiz?.totalQuestions || att.totalQuestions || 10,
                              timeLimitMinutes: 0,
                              title: `Práctica: ${matchedQuiz?.title || att.quizTitle}`,
                              axis: matchedQuiz?.axis || att.axis,
                              isSimce: matchedQuiz?.isSimce ?? att.isSimce,
                              simceAxisFilter: matchedQuiz?.simceAxisFilter || (att.oaCode.includes('Integral') ? 'all' : att.axis),
                            });
                          }}
                          className="tq-text-muted hover:tq-text-accent flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                          title="Genera nuevos ejercicios del mismo objetivo sin cambiar tu nota oficial"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Practicar tema (sin nota)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
