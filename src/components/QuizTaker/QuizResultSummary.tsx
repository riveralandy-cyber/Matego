import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Clock, Award, RotateCcw, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { QuizAttempt } from '../../types';
import { getGradeColorClass, formatGrade } from '../../utils/chileanGrades';

interface QuizResultSummaryProps {
  attempt: QuizAttempt;
  onRetry: () => void;
  onExit: () => void;
  isFreePractice?: boolean;
}

export const QuizResultSummary: React.FC<QuizResultSummaryProps> = ({
  attempt,
  onRetry,
  onExit,
  isFreePractice = false,
}) => {
  const gradeStyles = getGradeColorClass(attempt.chileanGrade);

  useEffect(() => {
    if (attempt.chileanGrade >= 6.0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe catch
      }
    }
  }, [attempt.chileanGrade]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  return (
    <div className="min-h-screen tq-page">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Top Banner with Grade & MINEDUC Level */}
        <div className="tq-card border rounded-xl shadow-xs overflow-hidden mb-6">
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b tq-border tq-subtle">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-semibold uppercase tracking-wider tq-text-muted">
                {isFreePractice
                  ? 'Práctica Libre Finalizada · Sin registro en plataforma'
                  : 'Evaluación Finalizada · Corrección Inmediata'}
              </span>
              <h1 className="text-2xl font-bold tq-text">
                {attempt.quizTitle}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm tq-text-2">
                {isFreePractice ? (
                  <span>Modalidad: <strong className="tq-text">Ejercitación Libre</strong></span>
                ) : (
                  <span>Estudiante: <strong className="tq-text">{attempt.studentName}</strong></span>
                )}
                <span>·</span>
                <span>OA: <strong className="tq-text">{attempt.oaCode}</strong></span>
                <span>·</span>
                <span className="flex items-center gap-1 tabular-nums">
                  <Clock className="w-4 h-4 tq-text-muted" />
                  {formatSeconds(attempt.durationSeconds)}
                </span>
              </div>
            </div>

            {/* Grade & SIMCE Score Card */}
            <div className="flex flex-wrap items-stretch justify-center gap-3">
              {attempt.isSimce && typeof attempt.simceScore === 'number' && (
                <div className="flex flex-col items-center justify-center p-4 tq-tint border-2 border-[var(--tq-border-strong)] rounded-xl shadow-sm min-w-[190px]">
                  <span className="text-[11px] uppercase font-bold tq-text-accent mb-1">
                    Puntaje SIMCE Estimado
                  </span>
                  <div className="text-4xl font-black font-mono tabular-nums tracking-tight tq-text">
                    {attempt.simceScore} <span className="text-sm font-bold tq-text-muted">pts</span>
                  </div>
                  <div className="mt-2 px-3 py-0.5 rounded-full text-xs font-bold tq-card tq-text border tq-border">
                    Estándar: {attempt.simceLevel || attempt.performanceLevel}
                  </div>
                  <span className="text-[11px] tq-text-muted mt-2">
                    Escala Agencia de Calidad
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center justify-center p-4 tq-card border-2 tq-border rounded-xl shadow-sm min-w-[190px]">
                <span className="text-xs uppercase font-bold tq-text-muted mb-1">
                  Calificación Escolar (1.0 - 7.0)
                </span>
                <div className={`text-5xl font-black tabular-nums tracking-tight ${gradeStyles.text}`}>
                  {formatGrade(attempt.chileanGrade)}
                </div>
                <div className={`mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${gradeStyles.bg} ${gradeStyles.text} border ${gradeStyles.border}`}>
                  Nivel {attempt.performanceLevel} (MINEDUC)
                </div>
                <span className="text-xs tq-text-muted mt-2 font-mono tabular-nums">
                  {attempt.score} de {attempt.totalQuestions} aciertos ({attempt.percentage}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Advice / Pedagogical summary */}
          <div className="p-4 tq-tint border-b tq-border flex items-start gap-3 text-xs md:text-sm tq-text-2">
            <BookOpen className="w-5 h-5 tq-text-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold tq-text">
                {attempt.chileanGrade >= 6.0
                  ? '¡Excelente dominio de los Objetivos de Aprendizaje!'
                  : attempt.chileanGrade >= 4.0
                  ? 'Aprobado satisfactoriamente. Con práctica constante podrás alcanzar un nivel sobresaliente.'
                  : 'Se requiere refuerzo pedagógico en este contenido curricular. Revisa las explicaciones paso a paso a continuación.'}
              </span>
              <p className="tq-text-2 mt-0.5">
                {attempt.isSimce
                  ? 'Este ensayo replica el formato de selección múltiple A/B/C/D de la Agencia de Calidad. Revisa abajo la explicación de cada pregunta y los distractores habituales.'
                  : isFreePractice
                  ? 'Esta nota es solo referencial para tu práctica libre y no queda guardada en ningún registro.'
                  : 'Escala de evaluación según normativa nacional con 60% de exigencia (nota 4.0 de aprobación).'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 tq-card flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onExit}
              className="px-4 py-2 text-sm font-medium tq-text-2 tq-muted hover:opacity-85 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {isFreePractice ? 'Cambiar tema o configuración' : 'Volver a mis evaluaciones'}
            </button>

            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium tq-btn-primary rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {isFreePractice ? 'Practicar otra vez (nuevos ejercicios)' : 'Reintentar prueba con nuevos ejercicios'}
            </button>
          </div>
        </div>

        {/* Detailed Step-by-Step Exercise Review */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tq-text flex items-center gap-2">
            <span>Revisión Detallada Ejercicio por Ejercicio</span>
            <span className="text-xs font-normal tq-text-muted">
              ({attempt.score} correctas · {attempt.totalQuestions - attempt.score} erradas)
            </span>
          </h2>

          {attempt.answers.length === 0 ? (
            <div className="p-6 tq-card border rounded-lg text-center tq-text-muted">
              No hay respuestas grabadas en este intento preliminar.
            </div>
          ) : (
            attempt.answers.map((ans, idx) => (
              <div
                key={ans.questionId || idx}
                className={`p-4 md:p-5 rounded-xl border transition-colors tq-card ${
                  ans.isCorrect
                    ? 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                    : 'border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      ans.isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200'
                    }`}>
                      {idx + 1}
                    </span>

                    <div>
                      <h3 className="text-sm md:text-base font-semibold tq-text">
                        {ans.prompt}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs md:text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="tq-text-muted">Tu respuesta:</span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                            ans.isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                          }`}>
                            {ans.studentAnswer || '(Sin responder)'}
                          </span>
                        </div>

                        {!ans.isCorrect && (
                          <div className="flex items-center gap-1.5">
                            <span className="tq-text-muted">Respuesta correcta:</span>
                            <span className="font-mono font-bold px-2 py-0.5 tq-muted tq-text rounded">
                              {ans.correctAnswer}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {ans.isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Correcta
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full">
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        Errada
                      </span>
                    )}
                  </div>
                </div>

                {/* Pedagogical Step Explanation */}
                {ans.explanation && (
                  <div className="mt-3 pt-3 border-t tq-border flex items-start gap-2 text-xs md:text-sm tq-text-2 tq-subtle p-2.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 tq-text-muted shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold tq-text">Explicación paso a paso: </span>
                      <span>{ans.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
