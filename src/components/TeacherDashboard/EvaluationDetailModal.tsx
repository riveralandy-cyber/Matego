import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, FileText, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { QuizAttempt, QuizAssignment } from '../../types';
import { formatGrade } from '../../utils/chileanGrades';

interface EvaluationDetailModalProps {
  attempt: QuizAttempt;
  assignment?: QuizAssignment;
  courseSection?: string;
  formattedStudentName?: string;
  onClose: () => void;
  onBackToStudent?: () => void;
  onUpdateGrade: (attemptId: string, updates: { chileanGrade?: number; percentage?: number }) => void;
  onDeleteAttempt: (attemptId: string) => void;
  onOpenReport?: (studentId: string) => void;
}

export function getChileanGradeDescriptor(grade: number): { text: string; headerClass: string } {
  if (grade >= 6.5) {
    return {
      text: 'Sobresaliente',
      headerClass: 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100',
    };
  }
  if (grade >= 6.0) {
    return {
      text: 'Muy bueno',
      headerClass: 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-100',
    };
  }
  if (grade >= 5.5) {
    return {
      text: 'Bueno',
      headerClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-100',
    };
  }
  if (grade >= 4.0) {
    return {
      text: 'Suficiente',
      headerClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-100',
    };
  }
  if (grade >= 3.0) {
    return {
      text: 'Regular',
      headerClass: 'bg-orange-100 dark:bg-orange-950/80 text-orange-900 dark:text-orange-100',
    };
  }
  return {
    text: 'Insuficiente',
    headerClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-100',
  };
}

function formatDurationClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const EvaluationDetailModal: React.FC<EvaluationDetailModalProps> = ({
  attempt,
  assignment,
  courseSection,
  formattedStudentName,
  onClose,
  onBackToStudent,
  onUpdateGrade,
  onDeleteAttempt,
  onOpenReport,
}) => {
  const [editingField, setEditingField] = useState<'grade' | 'percentage' | null>(null);
  const [gradeInput, setGradeInput] = useState<string>(formatGrade(attempt.chileanGrade));
  const [percentageInput, setPercentageInput] = useState<string>(String(attempt.percentage));
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  useEffect(() => {
    setEditingField(null);
    setGradeInput(formatGrade(attempt.chileanGrade));
    setPercentageInput(String(attempt.percentage));
    setConfirmDelete(false);
  }, [attempt.id, attempt.chileanGrade, attempt.percentage]);

  const totalQ = Math.max(1, attempt.totalQuestions || attempt.answers.length || 1);
  const hasRecordedAnswers = attempt.answers && attempt.answers.length > 0;

  // Breakdown counts matching ThatQuiz definitions:
  // Cumplido = answered questions; Sin cumplir = skipped/empty;
  // Acertado = correct; Equivocado = answered & incorrect.
  const answeredCount = hasRecordedAnswers
    ? attempt.answers.filter(a => a.studentAnswer.trim() !== '').length
    : totalQ;
  const skippedCount = hasRecordedAnswers
    ? Math.max(0, attempt.answers.length - answeredCount)
    : 0;
  const correctCount = attempt.score;
  const wrongAnsweredCount = hasRecordedAnswers
    ? attempt.answers.filter(a => !a.isCorrect && a.studentAnswer.trim() !== '').length
    : Math.max(0, totalQ - correctCount);

  const avgSecondsPerQuestion = (attempt.durationSeconds / totalQ).toFixed(2);
  const descriptor = getChileanGradeDescriptor(attempt.chileanGrade);

  const wrongItems = (attempt.answers || [])
    .map((ans, index) => ({ ans, number: index + 1 }))
    .filter(({ ans }) => !ans.isCorrect && ans.studentAnswer.trim() !== '');

  const skippedItems = (attempt.answers || [])
    .map((ans, index) => ({ ans, number: index + 1 }))
    .filter(({ ans }) => ans.studentAnswer.trim() === '');

  const handleSaveGrade = () => {
    const parsed = parseFloat(gradeInput.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      onUpdateGrade(attempt.id, { chileanGrade: parsed });
    }
    setEditingField(null);
  };

  const handleSavePercentage = () => {
    const parsed = parseFloat(percentageInput.replace('%', '').trim());
    if (!Number.isNaN(parsed)) {
      onUpdateGrade(attempt.id, { percentage: parsed });
    }
    setEditingField(null);
  };

  const displayName = (formattedStudentName || attempt.studentName).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-3 sm:p-5 backdrop-blur-2xs"
      onClick={onClose}
    >
      <div
        className="tq-card border tq-border rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Modal Bar */}
        <div className="px-5 py-3 tq-subtle border-b tq-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {onBackToStudent && (
              <button
                type="button"
                onClick={onBackToStudent}
                className="px-2.5 py-1 tq-card border tq-border hover:opacity-85 tq-text-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ficha</span>
              </button>
            )}
            <span className="text-xs font-bold tq-text-muted truncate">
              Detalle de Evaluación{courseSection ? ` · ${courseSection}` : ''}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full tq-muted hover:opacity-80 tq-text-muted flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar detalle de evaluación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Centered ThatQuiz-inspired Student & Exam Header */}
          <div className="text-center space-y-1 pb-4 border-b tq-border">
            <h2 className="text-lg sm:text-xl font-black tracking-tight tq-text">
              {displayName}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-sm font-bold tq-text-2">
              <span>{attempt.quizTitle}</span>
              {assignment?.code && (
                <span className="font-mono text-xs tq-text-accent tracking-wide">
                  {assignment.code}
                </span>
              )}
              <span className="tq-text-muted font-normal">·</span>
              <span className="text-xs font-semibold tq-text-muted">{attempt.oaCode}</span>
            </div>
            <p className="text-xs font-mono tabular-nums tq-text-muted pt-0.5">
              {attempt.completedAt}
            </p>
          </div>

          {/* 2-Column Core Layout matching reference image */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Structured Evaluation Metrics Table */}
            <div className="md:col-span-5">
              <div className="tq-card border tq-border rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs border-collapse font-sans">
                  <thead>
                    <tr className={`border-b tq-border ${descriptor.headerClass}`}>
                      <th colSpan={2} className="py-2 px-3 text-center text-sm font-extrabold tracking-tight">
                        {descriptor.text}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--tq-border)]">
                    {/* Nota + [Editar] */}
                    <tr className="tq-card">
                      <td className="py-2 px-3 tq-subtle border-r tq-border font-semibold tq-text-2">
                        <div className="flex items-center justify-between gap-2">
                          <span>Nota</span>
                          {editingField !== 'grade' && (
                            <button
                              type="button"
                              onClick={() => {
                                setGradeInput(formatGrade(attempt.chileanGrade));
                                setEditingField('grade');
                              }}
                              className="text-[11px] font-semibold tq-text-accent hover:underline cursor-pointer"
                            >
                              [Editar]
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono font-black text-sm tabular-nums text-right tq-text">
                        {editingField === 'grade' ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min="1.0"
                              max="7.0"
                              value={gradeInput}
                              onChange={e => setGradeInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveGrade();
                                if (e.key === 'Escape') setEditingField(null);
                              }}
                              className="w-16 px-1.5 py-0.5 text-right text-xs font-mono font-bold tq-input border rounded focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveGrade}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              title="Guardar nota"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingField(null)}
                              className="p-1 rounded tq-muted tq-text-2 hover:opacity-80 cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={
                              attempt.chileanGrade >= 6.0
                                ? 'text-indigo-700 dark:text-cyan-300'
                                : attempt.chileanGrade >= 4.0
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {formatGrade(attempt.chileanGrade)}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Porcentaje + [Editar] */}
                    <tr className="tq-card">
                      <td className="py-2 px-3 tq-subtle border-r tq-border font-semibold tq-text-2">
                        <div className="flex items-center justify-between gap-2">
                          <span>Porcentaje</span>
                          {editingField !== 'percentage' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPercentageInput(String(attempt.percentage));
                                setEditingField('percentage');
                              }}
                              className="text-[11px] font-semibold tq-text-accent hover:underline cursor-pointer"
                            >
                              [Editar]
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold tabular-nums text-right tq-text">
                        {editingField === 'percentage' ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              value={percentageInput}
                              onChange={e => setPercentageInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSavePercentage();
                                if (e.key === 'Escape') setEditingField(null);
                              }}
                              className="w-16 px-1.5 py-0.5 text-right text-xs font-mono font-bold tq-input border rounded focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSavePercentage}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              title="Guardar porcentaje y recalcular nota"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingField(null)}
                              className="p-1 rounded tq-muted tq-text-2 hover:opacity-80 cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          `${attempt.percentage}%`
                        )}
                      </td>
                    </tr>

                    {/* Puntos */}
                    <tr>
                      <td className="py-2 px-3 tq-subtle border-r tq-border font-semibold tq-text-2">
                        Puntos
                      </td>
                      <td className="py-2 px-3 font-mono font-bold tabular-nums text-right tq-text">
                        {attempt.score}/{attempt.totalQuestions}
                      </td>
                    </tr>

                    {/* Cumplido */}
                    <tr>
                      <td className="py-2 px-3 tq-subtle border-r tq-border font-semibold tq-text-2">
                        Cumplido
                      </td>
                      <td className="py-2 px-3 font-mono font-bold tabular-nums text-right tq-text">
                        {answeredCount}
                      </td>
                    </tr>

                    {/* Sin cumplir */}
                    <tr>
                      <td className="py-2 px-3 tq-subtle border-r tq-border font-semibold tq-text-2">
                        Sin cumplir
                      </td>
                      <td className="py-2 px-3 font-mono font-bold tabular-nums text-right tq-text">
                        {skippedCount}
                      </td>
                    </tr>

                    {/* Acertado */}
                    <tr>
                      <td className="py-2 px-3 tq-subtle border-r tq-border font-semibold tq-text-2">
                        Acertado
                      </td>
                      <td className="py-2 px-3 font-mono font-bold tabular-nums text-right text-emerald-700 dark:text-emerald-300">
                        {correctCount}
                      </td>
                    </tr>

                    {/* Equivocado */}
                    <tr>
                      <td className="py-2 px-3 tq-subtle border-r tq-border font-semibold tq-text-2">
                        Equivocado
                      </td>
                      <td
                        className={`py-2 px-3 font-mono font-bold tabular-nums text-right ${
                          wrongAnsweredCount > 0
                            ? 'text-rose-700 dark:text-rose-300'
                            : 'tq-text'
                        }`}
                      >
                        {wrongAnsweredCount}
                      </td>
                    </tr>

                    {/* Tiempo */}
                    <tr>
                      <td className="py-2 px-3 tq-subtle border-r tq-border font-semibold tq-text-2">
                        Tiempo
                      </td>
                      <td className="py-2 px-3 font-mono font-bold tabular-nums text-right tq-text">
                        {formatDurationClock(attempt.durationSeconds)}
                      </td>
                    </tr>

                    {/* Segundos (promedio) */}
                    <tr>
                      <td className="py-2 px-3 tq-subtle border-r tq-border font-semibold tq-text-2 leading-tight">
                        Segundos (promedio)
                      </td>
                      <td className="py-2 px-3 font-mono font-bold tabular-nums text-right tq-text">
                        {avgSecondsPerQuestion}
                      </td>
                    </tr>

                    {/* Optional SIMCE score row when applicable */}
                    {attempt.isSimce && typeof attempt.simceScore === 'number' && (
                      <tr>
                        <td className="py-2 px-3 tq-tint border-r tq-border font-bold tq-text-accent">
                          Puntaje SIMCE
                        </td>
                        <td className="py-2 px-3 tq-tint font-mono font-black tabular-nums text-right tq-text-accent">
                          {attempt.simceScore} pts
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] tq-text-muted">
                Al editar el porcentaje, la nota chilena se recalcula al 60% de exigencia.
              </p>
            </div>

            {/* Right Column: Respuestas equivocadas (y sin cumplir) */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 border-b tq-border">
                  <h3 className="text-sm font-extrabold text-rose-800 dark:text-rose-300">
                    Respuestas equivocadas
                  </h3>
                  <span className="text-xs font-mono font-bold tabular-nums tq-text-muted">
                    {wrongItems.length} {wrongItems.length === 1 ? 'error' : 'errores'}
                  </span>
                </div>

                {!hasRecordedAnswers ? (
                  <div className="mt-3 p-4 rounded-xl tq-subtle border tq-border text-xs tq-text-muted">
                    Este registro no cuenta con el detalle por pregunta. Solo se almacena el resumen general ({attempt.score}/{attempt.totalQuestions}).
                  </div>
                ) : wrongItems.length === 0 && skippedItems.length === 0 ? (
                  <div className="mt-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold">
                      Sin respuestas equivocadas. Todas las preguntas fueron respondidas correctamente.
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {wrongItems.map(({ ans, number }) => (
                      <div
                        key={ans.questionId || number}
                        className="p-3 rounded-xl tq-subtle border tq-border text-xs space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold tq-text leading-snug">
                            <span className="font-mono font-black text-rose-700 dark:text-rose-300 mr-1.5">
                              {number}.
                            </span>
                            {ans.prompt}
                          </p>
                          <span className="text-[11px] font-mono tabular-nums tq-text-muted shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ans.timeSpentSeconds}s
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs pt-0.5">
                          <span className="tq-text-muted font-sans">Respondió:</span>
                          <span className="font-bold text-rose-700 dark:text-rose-300">
                            {ans.studentAnswer}
                          </span>
                          <span className="tq-text-muted font-sans">· Correcta:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">
                            ({ans.correctAnswer})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {hasRecordedAnswers && skippedItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b tq-border">
                    <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                      Preguntas sin cumplir (omitidas)
                    </h4>
                    <span className="text-xs font-mono font-bold tabular-nums tq-text-muted">
                      {skippedItems.length}
                    </span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                    {skippedItems.map(({ ans, number }) => (
                      <div
                        key={ans.questionId || number}
                        className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800 text-xs space-y-1"
                      >
                        <p className="font-semibold tq-text leading-snug">
                          <span className="font-mono font-black text-amber-700 dark:text-amber-300 mr-1.5">
                            {number}.
                          </span>
                          {ans.prompt}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                          <span className="text-amber-800 dark:text-amber-200 font-sans italic">
                            Sin responder
                          </span>
                          <span className="tq-text-muted font-sans">· Correcta:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">
                            ({ans.correctAnswer})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 tq-subtle border-t tq-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2 bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="font-bold text-rose-900 dark:text-rose-100">
                  ¿Borrar esta nota para que el estudiante repita la evaluación?
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteAttempt(attempt.id)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 tq-card border tq-border tq-text-2 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar nota</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenReport && (
              <button
                type="button"
                onClick={() => onOpenReport(attempt.studentId)}
                className="px-3.5 py-1.5 tq-card border tq-border hover:opacity-85 tq-text-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 tq-text-accent" />
                <span>Informe PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 tq-btn-primary text-xs font-bold rounded-xl cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
