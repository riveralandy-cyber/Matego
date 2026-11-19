import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, BookOpen, Clock, Calendar, Users, Play, Trash2, FolderOpen, Award, Eye, X } from 'lucide-react';
import { formatGrade, getGradeColorClass, formatDifficultyName } from '../../utils/chileanGrades';
import { QuizAssignment } from '../../types';
import { EvaluationDetailModal } from './EvaluationDetailModal';

export const QuizListView: React.FC = () => {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    selectedCourse,
    teacherAssignments,
    deleteQuizAssignment,
    teacherAttempts,
    teacherStudents,
    setActiveTeacherTab,
    startQuizAsStudent,
    currentTeacher,
    updateQuizAttemptGrade,
    deleteQuizAttempt,
  } = useApp();

  const [selectedQuizForList, setSelectedQuizForList] = useState<QuizAssignment | null>(null);
  const [selectedAttemptIdForDetail, setSelectedAttemptIdForDetail] = useState<string | null>(null);

  // Show ONLY assignments belonging to the currently selected course
  const courseAssignments = teacherAssignments.filter(
    a => a.courseId === selectedCourseId
  );

  // Courses where this teacher already has sent exams (for quick navigation tabs)
  const coursesWithExams = courses.filter(c =>
    teacherAssignments.some(a => a.courseId === c.id)
  );

  const getQuizStats = (quizId: string, courseId: string) => {
    const quizAttempts = teacherAttempts.filter(a => a.quizId === quizId);
    const completedCount = quizAttempts.length;
    const avgGrade =
      completedCount > 0
        ? quizAttempts.reduce((acc, curr) => acc + curr.chileanGrade, 0) / completedCount
        : null;
    const totalStudents = teacherStudents.filter(s => s.courseId === courseId).length;
    return { completedCount, avgGrade, totalStudents };
  };

  return (
    <div className="space-y-3.5 min-w-0">
      {/* Top Header */}
      <div className="tq-card border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h1 className="text-lg font-bold tq-text">
                Exámenes Enviados · {selectedCourse?.section || 'Curso'}
              </h1>
              <span className="font-mono text-xs tq-accent-soft px-2 py-0.5 rounded border tq-border font-bold">
                {courseAssignments.length} {courseAssignments.length === 1 ? 'examen' : 'exámenes'}
              </span>
            </div>
            <p className="text-xs tq-text-muted">
              Visualizando los exámenes asignados a <strong className="tq-text-2">{selectedCourse?.section}</strong> por <strong className="tq-text-2">Prof. {currentTeacher?.name}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="text-xs font-semibold tq-input border rounded-lg px-2.5 py-1.5 focus:outline-hidden"
              title="Cambiar de curso para ver sus exámenes"
            >
              {courses.map(c => {
                const count = teacherAssignments.filter(a => a.courseId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.section} {count > 0 ? `(${count} ${count === 1 ? 'examen' : 'exámenes'})` : '(sin exámenes)'}
                  </option>
                );
              })}
            </select>

            {(selectedCourse?.grade === '4_basico' ||
              selectedCourse?.grade === '6_basico' ||
              selectedCourse?.grade === '8_basico') && (
              <button
                type="button"
                onClick={() => setActiveTeacherTab('simce')}
                className="px-3 py-1.5 tq-tint border border-[var(--tq-border-strong)] tq-text-accent text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 hover:opacity-90 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Crear SIMCE</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTeacherTab('create_quiz')}
              className="px-3.5 py-1.5 tq-btn-primary text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Evaluación</span>
            </button>
          </div>
        </div>

        {/* Course separation tabs */}
        {coursesWithExams.length > 0 && (
          <div className="pt-2.5 border-t tq-border flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold tq-text-muted flex items-center gap-1 mr-1">
              <FolderOpen className="w-3.5 h-3.5 tq-text-accent" />
              Tus cursos con exámenes:
            </span>
            {coursesWithExams.map(course => {
              const count = teacherAssignments.filter(a => a.courseId === course.id).length;
              const isSelected = course.id === selectedCourseId;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'tq-btn-primary border-[var(--tq-accent)] shadow-2xs'
                      : 'tq-subtle tq-text-2 hover:bg-[var(--tq-tint-bg)]'
                  }`}
                >
                  <span>{course.section}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-black/20 text-white' : 'tq-card tq-text-accent border tq-border'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of Quizzes for the Selected Course Only */}
      {courseAssignments.length === 0 ? (
        <div className="p-12 text-center tq-card border rounded-xl">
          <BookOpen className="w-12 h-12 tq-text-muted opacity-50 mx-auto mb-3" />
          <h3 className="text-base font-bold tq-text">
            No hay exámenes enviados para {selectedCourse?.section}
          </h3>
          <p className="text-xs tq-text-muted mt-1 mb-4 max-w-md mx-auto">
            {coursesWithExams.length > 0
              ? `Prof. ${currentTeacher?.name}, en este curso aún no has asignado evaluaciones. Puedes cambiar de curso arriba o crear una nueva evaluación para ${selectedCourse?.section}.`
              : `Crea una evaluación de 5 a 20 ejercicios alineada con los Objetivos de Aprendizaje MINEDUC para ${selectedCourse?.section}.`}
          </p>
          <button
            type="button"
            onClick={() => setActiveTeacherTab('create_quiz')}
            className="px-4 py-2 text-xs font-semibold tq-btn-primary rounded-lg shadow-xs cursor-pointer"
          >
            Crear Evaluación para {selectedCourse?.section}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courseAssignments.map(quiz => {
            const { completedCount, avgGrade, totalStudents } = getQuizStats(quiz.id, quiz.courseId);
            const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
            const targetCourse = courses.find(c => c.id === quiz.courseId);
            const firstCourseStudent = teacherStudents.find(s => s.courseId === quiz.courseId);

            return (
              <div
                key={quiz.id}
                className="tq-card border hover:border-[var(--tq-border-strong)] rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold tq-accent-soft px-2 py-0.5 rounded border tq-border">
                        {quiz.code}
                      </span>
                      {targetCourse && (
                        <span className="text-[11px] font-bold text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                          {targetCourse.section}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] tq-text-muted font-medium">
                      {quiz.oaCode} · {formatDifficultyName(quiz.difficulty)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold tq-text leading-snug">
                    {quiz.title}
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs tq-text-2 border-t border-b tq-border py-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 tq-text-muted" />
                      <span>{quiz.totalQuestions} ejercicios</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 tq-text-muted" />
                      <span>{quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} min` : 'Sin límite'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 tq-text-muted" />
                      <span>Plazo: {quiz.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 tq-text-muted" />
                      <span>{completedCount} de {totalStudents} alumnos</span>
                    </div>
                  </div>

                  {/* Completion and Average Grade Badge */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="tq-text-muted block text-[10px] uppercase font-semibold">
                        Completitud: {completionRate}%
                      </span>
                      <div className="w-24 tq-muted h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="tq-btn-primary h-full rounded-full"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {avgGrade !== null ? (
                      <div className="text-right">
                        <span className="tq-text-muted block text-[10px] uppercase font-semibold">
                          Promedio Curso
                        </span>
                        <span className={`text-base font-mono font-black ${getGradeColorClass(avgGrade).text}`}>
                          {formatGrade(avgGrade)}
                        </span>
                      </div>
                    ) : (
                      <span className="tq-text-muted text-[11px] italic">
                        Sin respuestas aún
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="mt-4 pt-3 border-t tq-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedQuizForList(quiz)}
                      className="px-3 py-1.5 tq-tint border border-[var(--tq-border-strong)] tq-text-accent text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Ver el detalle de cada evaluación rendida en esta prueba"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver notas ({completedCount})</span>
                    </button>

                    {firstCourseStudent && (
                      <button
                        type="button"
                        onClick={() => startQuizAsStudent(quiz.id, firstCourseStudent.id)}
                        className="px-3 py-1.5 tq-btn-primary text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Probar evaluación como alumno"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Probar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(quiz.courseId);
                        setActiveTeacherTab('stats');
                      }}
                      className="px-3 py-1.5 tq-text-2 tq-muted hover:opacity-85 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Estadísticas
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteQuizAssignment(quiz.id)}
                    className="p-1.5 tq-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar evaluación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Submissions Modal for Selected Exam */}
      {selectedQuizForList && !selectedAttemptIdForDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-2xs"
          onClick={() => setSelectedQuizForList(null)}
        >
          <div
            className="tq-card border tq-border rounded-2xl shadow-xl max-w-xl w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b tq-border">
              <div>
                <span className="text-[11px] font-bold tq-text-accent uppercase tracking-wider">
                  {selectedQuizForList.code} · {selectedQuizForList.oaCode}
                </span>
                <h3 className="text-lg font-bold tq-text mt-0.5">
                  {selectedQuizForList.title}
                </h3>
                <p className="text-xs tq-text-muted">
                  Pincha cualquier estudiante para ver su nota, porcentaje, tiempos y respuestas equivocadas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuizForList(null)}
                className="w-8 h-8 rounded-full tq-muted hover:opacity-80 tq-text-muted flex items-center justify-center cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 max-h-80 overflow-y-auto space-y-2">
              {(() => {
                const quizAttempts = teacherAttempts.filter(a => a.quizId === selectedQuizForList.id);
                if (quizAttempts.length === 0) {
                  return (
                    <p className="text-xs tq-text-muted italic p-6 tq-subtle rounded-xl text-center">
                      Ningún estudiante ha rendido esta evaluación todavía.
                    </p>
                  );
                }
                return quizAttempts.map(att => {
                  const gradeStyle = getGradeColorClass(att.chileanGrade);
                  return (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => setSelectedAttemptIdForDetail(att.id)}
                      className="w-full p-3 tq-subtle border tq-border hover:border-[var(--tq-border-strong)] hover:bg-[var(--tq-tint-bg)]/50 rounded-xl flex items-center justify-between gap-3 text-left text-xs transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold tq-text block truncate">
                          {att.studentName}
                        </span>
                        <span className="text-[11px] tq-text-muted font-mono tabular-nums">
                          {att.score}/{att.totalQuestions} pts · {att.percentage}% · {att.completedAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-mono font-black text-sm tabular-nums ${gradeStyle.text}`}>
                          {formatGrade(att.chileanGrade)}
                        </span>
                        <Eye className="w-4 h-4 tq-text-accent" />
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            <div className="pt-3 border-t tq-border text-right">
              <button
                type="button"
                onClick={() => setSelectedQuizForList(null)}
                className="px-4 py-2 tq-btn-primary text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Evaluation Modal */}
      {(() => {
        if (!selectedAttemptIdForDetail) return null;
        const targetAttempt = teacherAttempts.find(a => a.id === selectedAttemptIdForDetail);
        if (!targetAttempt) return null;
        const quizCourse = courses.find(c => c.id === targetAttempt.courseId);
        const quizObj = teacherAssignments.find(a => a.id === targetAttempt.quizId);

        return (
          <EvaluationDetailModal
            attempt={targetAttempt}
            assignment={quizObj}
            courseSection={quizCourse?.section}
            onClose={() => setSelectedAttemptIdForDetail(null)}
            onBackToStudent={
              selectedQuizForList ? () => setSelectedAttemptIdForDetail(null) : undefined
            }
            onUpdateGrade={updateQuizAttemptGrade}
            onDeleteAttempt={attId => {
              deleteQuizAttempt(attId);
              setSelectedAttemptIdForDetail(null);
            }}
          />
        );
      })()}
    </div>
  );
};
