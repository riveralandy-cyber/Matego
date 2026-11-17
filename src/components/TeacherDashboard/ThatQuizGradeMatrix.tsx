import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  BarChart2,
  Edit,
  FileText,
  Trash2,
  CheckSquare,
  Check,
  X,
  RotateCcw,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { formatGrade } from '../../utils/chileanGrades';
import { Student } from '../../types';
import { EvaluationDetailModal } from './EvaluationDetailModal';

interface ThatQuizGradeMatrixProps {
  onSelectStudentForReport: (studentId: string) => void;
}

// Chilean descriptor based on average grade with dark-mode aware pastel colors
function getChileanDescriptor(avg: number | null): { text: string; colorClass: string } {
  if (avg === null) return { text: '', colorClass: '' };
  if (avg >= 6.5) return { text: 'Sobresaliente', colorClass: 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800' };
  if (avg >= 6.0) return { text: 'Muy bueno', colorClass: 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-800' };
  if (avg >= 5.5) return { text: 'Bueno', colorClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' };
  if (avg >= 4.0) return { text: 'Suficiente', colorClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800' };
  if (avg >= 3.0) return { text: 'Regular', colorClass: 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800' };
  return { text: 'Insuficiente', colorClass: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800' };
}

export const ThatQuizGradeMatrix: React.FC<ThatQuizGradeMatrixProps> = ({ onSelectStudentForReport }) => {
  const {
    selectedCourseId,
    selectedCourse,
    teacherStudents,
    teacherAssignments,
    teacherAttempts,
    currentTeacher,
    setIsTeacherLoginModalOpen,
    setActiveTeacherTab,
    updateQuizAttemptGrade,
    deleteQuizAttempt,
    deleteQuizAttempts,
  } = useApp();

  const [period, setPeriod] = useState<string>('Desde 2026.07.27');
  const [showGraphModal, setShowGraphModal] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [selectedAttemptIdForDetail, setSelectedAttemptIdForDetail] = useState<string | null>(null);
  const [openedFromStudentModal, setOpenedFromStudentModal] = useState<boolean>(false);

  // Grade marking & deletion state
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedCellKeys, setSelectedCellKeys] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<boolean>(false);
  const [deletedNotice, setDeletedNotice] = useState<string | null>(null);

  // Individual modal deletion state
  const [confirmDeleteAttemptId, setConfirmDeleteAttemptId] = useState<string | null>(null);
  const [modalDeleteNotice, setModalDeleteNotice] = useState<string | null>(null);

  useEffect(() => {
    setIsSelectMode(false);
    setSelectedCellKeys([]);
    setConfirmBulkDelete(false);
    setDeletedNotice(null);
    setConfirmDeleteAttemptId(null);
    setModalDeleteNotice(null);
    setSelectedAttemptIdForDetail(null);
    setOpenedFromStudentModal(false);
  }, [selectedCourseId]);

  const courseStudents = teacherStudents.filter(s => s.courseId === selectedCourseId);
  const courseAssignments = teacherAssignments.filter(a => a.courseId === selectedCourseId);

  // Split student full name into Apellido and Nombre for the ThatQuiz format
  const parsedStudents = courseStudents.map(st => {
    let apellido = '';
    let nombre = '';

    const parts = st.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 3) {
      nombre = parts.slice(0, 2).join(' ');
      apellido = parts.slice(2).join(' ');
    } else if (parts.length === 2) {
      nombre = parts[0];
      apellido = parts[1];
    } else {
      nombre = parts[0] || '';
      apellido = '';
    }

    // Student's grades map
    const studentAttempts = teacherAttempts.filter(a => a.studentId === st.id);
    const gradesByQuizId: Record<string, number> = {};
    const attemptIdsByQuizId: Record<string, string[]> = {};
    studentAttempts.forEach(att => {
      if (gradesByQuizId[att.quizId] === undefined) {
        gradesByQuizId[att.quizId] = att.chileanGrade;
      }
      if (!attemptIdsByQuizId[att.quizId]) {
        attemptIdsByQuizId[att.quizId] = [];
      }
      attemptIdsByQuizId[att.quizId].push(att.id);
    });

    const incompleteQuizzes: Record<string, boolean> = {};

    // Average grade calculation
    const recordedGrades = Object.values(gradesByQuizId);
    const avg =
      recordedGrades.length > 0
        ? Math.round((recordedGrades.reduce((a, b) => a + b, 0) / recordedGrades.length) * 10) / 10
        : null;

    return {
      student: st,
      apellido,
      nombre,
      gradesByQuizId,
      attemptIdsByQuizId,
      incompleteQuizzes,
      average: avg,
      descriptorObj: getChileanDescriptor(avg),
    };
  });

  const totalSelectableGrades = useMemo(
    () =>
      parsedStudents.reduce(
        (acc, row) =>
          acc +
          courseAssignments.filter(
            q => row.gradesByQuizId[q.id] !== undefined && !row.incompleteQuizzes[q.id]
          ).length,
        0
      ),
    [parsedStudents, courseAssignments]
  );

  const selectedCellSet = useMemo(() => new Set(selectedCellKeys), [selectedCellKeys]);

  const toggleSelectMode = () => {
    setIsSelectMode(prev => {
      const next = !prev;
      if (!next) {
        setSelectedCellKeys([]);
        setConfirmBulkDelete(false);
      } else {
        setDeletedNotice(null);
      }
      return next;
    });
  };

  const toggleCellSelection = (studentId: string, quizId: string) => {
    const key = `${studentId}::${quizId}`;
    setConfirmBulkDelete(false);
    setSelectedCellKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleConfirmBulkDelete = () => {
    if (selectedCellKeys.length === 0) return;
    const idsToDelete: string[] = [];

    selectedCellKeys.forEach(key => {
      const [studentId, quizId] = key.split('::');
      const row = parsedStudents.find(p => p.student.id === studentId);
      const cellAttemptIds = row?.attemptIdsByQuizId[quizId] || [];
      idsToDelete.push(...cellAttemptIds);
    });

    if (idsToDelete.length > 0) {
      const count = selectedCellKeys.length;
      deleteQuizAttempts(idsToDelete);
      setDeletedNotice(
        count === 1
          ? 'Se eliminó 1 nota. La evaluación volvió a quedar disponible para que el estudiante la repita.'
          : `Se eliminaron ${count} notas. Las evaluaciones volvieron a quedar disponibles para repetirse.`
      );
    }

    setSelectedCellKeys([]);
    setConfirmBulkDelete(false);
    setIsSelectMode(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Apellido',
      'Nombre',
      ...courseAssignments.map(q => q.title),
      'Promedio',
      'Desempeño',
    ];

    const rows = parsedStudents.map(p => {
      const examGrades = courseAssignments.map(q => {
        const g = p.gradesByQuizId[q.id];
        return g !== undefined ? formatGrade(g) : '';
      });
      return [
        `"${p.apellido}"`,
        `"${p.nombre}"`,
        ...examGrades,
        p.average !== null ? formatGrade(p.average) : '',
        `"${p.descriptorObj.text}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Notas_MateClic_${selectedCourse?.section.replace(/\s+/g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Main Container */}
      <div className="tq-card p-5 sm:p-6 rounded-2xl border shadow-sm tq-text">
        {/* Top ThatQuiz Header Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b tq-border">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 tq-subtle px-3 py-1.5 rounded-xl border">
              <span className="font-bold text-xs tq-text-2">Período:</span>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="bg-transparent text-xs font-bold tq-text-accent focus:outline-hidden cursor-pointer"
              >
                <option value="Desde 2026.07.27" className="tq-card tq-text">Desde 2026.07.27</option>
                <option value="Primer Semestre 2026" className="tq-card tq-text">Primer Semestre 2026</option>
                <option value="Segundo Semestre 2026" className="tq-card tq-text">Segundo Semestre 2026</option>
                <option value="Todo el Año Escolar" className="tq-card tq-text">Todo el Año Escolar</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowGraphModal(true)}
              className="bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-100 border border-purple-200/80 dark:border-purple-800 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
              <span>Gráfica</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-900 dark:text-sky-100 border border-sky-200/80 dark:border-sky-800 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-sky-700 dark:text-sky-300" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
              <span>Descargar CSV</span>
            </button>

            <button
              type="button"
              onClick={toggleSelectMode}
              disabled={totalSelectableGrades === 0 && !isSelectMode}
              className={`border text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                isSelectMode
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                  : 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-900 dark:text-rose-100 border-rose-200/80 dark:border-rose-800'
              }`}
              title="Marcar una o varias notas de la tabla para borrarlas y permitir repetir la evaluación"
            >
              {isSelectMode ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Salir de selección</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-rose-700 dark:text-rose-300" />
                  <span>Marcar notas</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsTeacherLoginModalOpen(true)}
              className="px-2.5 py-1 tq-subtle hover:bg-[var(--tq-tint-bg)] border rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Cambiar o editar nombre del profesor"
            >
              <span className="tq-text-muted font-medium">Docente:</span>
              <span className="font-bold tq-text">Prof. {currentTeacher?.name || selectedCourse?.teacherName}</span>
              <span className="text-[10px] tq-text-accent underline font-bold">Cambiar</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs tq-text-muted font-medium hidden sm:inline">Curso:</span>
              <span className="px-3 py-1 tq-accent-soft border tq-border rounded-xl text-sm font-black tracking-tight">
                {selectedCourse?.section.replace('° Básico ', '°')}
              </span>
            </div>
          </div>
        </div>

        {/* Grade Marking & Bulk Delete Bar */}
        {isSelectMode && (
          <div className="mt-3 p-3.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5 text-xs">
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-bold text-rose-900 dark:text-rose-100">
                  {selectedCellKeys.length === 0
                    ? 'Modo selección activo: haz clic en las notas que deseas borrar'
                    : `${selectedCellKeys.length} ${selectedCellKeys.length === 1 ? 'nota marcada' : 'notas marcadas'} para borrar`}
                </p>
                <p className="text-[11px] text-rose-800/85 dark:text-rose-200/80">
                  Al borrar una nota, la evaluación vuelve a quedar disponible para que el estudiante la repita.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {confirmBulkDelete ? (
                <div className="flex flex-wrap items-center gap-2 bg-rose-100 dark:bg-rose-900/70 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700">
                  <span className="text-[11px] font-bold text-rose-900 dark:text-rose-100">
                    ¿Confirmas borrar {selectedCellKeys.length}{' '}
                    {selectedCellKeys.length === 1 ? 'nota' : 'notas'}?
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmBulkDelete}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar borrado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBulkDelete(false)}
                    className="px-2.5 py-1 tq-card border tq-border tq-text-2 text-xs font-semibold rounded-lg hover:opacity-85 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  {selectedCellKeys.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCellKeys([])}
                      className="px-3 py-1.5 tq-card border tq-border tq-text-2 text-xs font-semibold rounded-xl hover:opacity-85 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Limpiar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={selectedCellKeys.length === 0}
                    onClick={() => setConfirmBulkDelete(true)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      Borrar {selectedCellKeys.length > 0 ? `(${selectedCellKeys.length})` : 'marcadas'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Confirmation feedback after deleting grades */}
        {deletedNotice && (
          <div className="mt-3 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{deletedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setDeletedNotice(null)}
              className="p-1 rounded-lg hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Secondary Sub-Bar */}
        <div className="pt-3 pb-3 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-full font-bold text-[11px]">
              Escala oficial chilena: 1.0 - 7.0 (60% exigencia)
            </span>
            <span className="tq-text-muted">·</span>
            <span className="text-xs tq-text-muted">
              {isSelectMode
                ? 'Haz clic sobre cualquier nota para marcarla o desmarcarla.'
                : 'Pincha cualquier nota para ver su detalle completo, haz clic en un estudiante para ver su ficha, o usa «Marcar notas» para borrar.'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block w-3.5 h-3.5 bg-amber-200 dark:bg-amber-700 border border-amber-400 dark:border-amber-500 rounded-sm" />
            <span className="tq-text-2 font-medium text-[11px]">Guardado / no acabado</span>
          </div>
        </div>

        {/* Matrix Table with 45-degree tilted headers */}
        <div className="tq-card border rounded-xl shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              {/* Extra height for 45-degree headers */}
              <tr className="tq-subtle border-b tq-border">
                <th className="py-3 px-3.5 border-r tq-border font-bold uppercase w-28 align-bottom tq-text">
                  Apellido
                </th>
                <th className="py-3 px-3.5 border-r tq-border font-bold uppercase w-28 align-bottom tq-text">
                  Nombre
                </th>

                {/* Exam columns with tilted text */}
                {courseAssignments.map((q, qIndex) => {
                  const tintClasses = [
                    'text-sky-900 dark:text-sky-300',
                    'text-indigo-900 dark:text-indigo-300',
                    'text-purple-900 dark:text-purple-300',
                    'text-emerald-900 dark:text-emerald-300',
                    'text-teal-900 dark:text-teal-300',
                    'text-amber-900 dark:text-amber-300',
                    'text-rose-900 dark:text-rose-300',
                    'text-blue-900 dark:text-blue-300',
                  ];
                  const tintClass = tintClasses[qIndex % tintClasses.length];

                  return (
                    <th
                      key={q.id}
                      className="border-r tq-border p-0 h-44 w-12 align-bottom relative tq-subtle"
                    >
                      <div className="w-12 h-40 relative overflow-visible flex items-end justify-center pb-3">
                        <div className={`whitespace-nowrap transform -rotate-45 origin-bottom-left text-[11px] font-bold ${tintClass} absolute bottom-2 left-6 tracking-tight max-w-[150px] truncate`}>
                          {q.title}
                        </div>
                      </div>
                    </th>
                  );
                })}

                <th className="py-3 px-3 border-r tq-border font-bold uppercase text-center w-20 align-bottom tq-text">
                  Promedio
                </th>
                <th className="py-3 px-4 font-bold uppercase text-left w-32 align-bottom tq-text">
                  Desempeño
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--tq-border)] tq-text-2 font-mono text-xs">
              {parsedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={courseAssignments.length + 4}
                    className="py-12 text-center tq-text-muted font-sans space-y-3"
                  >
                    <p className="font-medium tq-text-2">
                      No tienes una lista cargada para <strong className="tq-text">{selectedCourse?.section}</strong> con tu cuenta (Prof. {currentTeacher?.name}).
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTeacherTab('courses')}
                        className="px-3.5 py-1.5 tq-btn-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Cargar mi lista de curso
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTeacherTab('create_quiz')}
                        className="px-3.5 py-1.5 tq-muted hover:opacity-85 tq-text-2 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Crear examen
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                parsedStudents.map((row) => (
                  <tr
                    key={row.student.id}
                    onClick={() => {
                      if (isSelectMode) return;
                      setConfirmDeleteAttemptId(null);
                      setModalDeleteNotice(null);
                      setSelectedStudentDetail(row.student);
                    }}
                    className={`transition-colors ${
                      isSelectMode
                        ? 'hover:bg-[var(--tq-tint-bg)]/25'
                        : 'hover:bg-[var(--tq-tint-bg)]/50 cursor-pointer'
                    }`}
                  >
                    <td className="py-2 px-3.5 border-r tq-border font-sans font-bold uppercase whitespace-nowrap tq-text">
                      {row.apellido}
                    </td>
                    <td className="py-2 px-3.5 border-r tq-border font-sans font-semibold uppercase whitespace-nowrap tq-text-2">
                      {row.nombre}
                    </td>

                    {/* Exam grades */}
                    {courseAssignments.map(q => {
                      const grade = row.gradesByQuizId[q.id];
                      const isIncomplete = row.incompleteQuizzes[q.id];
                      const cellKey = `${row.student.id}::${q.id}`;
                      const isSelected = selectedCellSet.has(cellKey);

                      if (isIncomplete) {
                        return (
                          <td
                            key={q.id}
                            className="py-2 px-1 text-center border-r tq-border bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-sans font-bold text-[10px]"
                            title="Guardado / no acabado"
                          >
                            Pendiente
                          </td>
                        );
                      }

                      if (grade === undefined) {
                        return (
                          <td
                            key={q.id}
                            className="py-2 px-1 text-center border-r tq-border tq-text-muted opacity-50"
                          >
                            —
                          </td>
                        );
                      }

                      const gradeNum = grade;
                      const isHigh = gradeNum >= 6.0;
                      const isPassing = gradeNum >= 4.0;

                      return (
                        <td
                          key={q.id}
                          onClick={e => {
                            e.stopPropagation();
                            if (isSelectMode) {
                              toggleCellSelection(row.student.id, q.id);
                            } else {
                              const attId = row.attemptIdsByQuizId[q.id]?.[0];
                              if (attId) {
                                setOpenedFromStudentModal(false);
                                setSelectedAttemptIdForDetail(attId);
                              }
                            }
                          }}
                          className={`py-1.5 px-1 text-center border-r tq-border tabular-nums transition-all cursor-pointer ${
                            isSelectMode
                              ? isSelected
                                ? 'bg-rose-100 dark:bg-rose-950/80 ring-2 ring-inset ring-rose-500'
                                : 'hover:bg-rose-50/80 dark:hover:bg-rose-950/40'
                              : 'hover:bg-[var(--tq-tint-bg)] hover:underline'
                          }`}
                          title={
                            isSelectMode
                              ? isSelected
                                ? 'Clic para desmarcar esta nota'
                                : 'Clic para marcar esta nota y borrarla'
                              : 'Clic para ver el detalle de esta evaluación'
                          }
                        >
                          {isSelectMode ? (
                            <span className="inline-flex items-center justify-center gap-1 font-bold text-xs">
                              <span
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                                  isSelected
                                    ? 'bg-rose-600 border-rose-600 text-white'
                                    : 'tq-card border-[var(--tq-border)]'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                              <span
                                className={
                                  isSelected
                                    ? 'text-rose-700 dark:text-rose-200 line-through'
                                    : isHigh
                                    ? 'text-indigo-700 dark:text-cyan-300'
                                    : isPassing
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-rose-600 dark:text-rose-400'
                                }
                              >
                                {formatGrade(grade)}
                              </span>
                            </span>
                          ) : (
                            <span
                              className={`inline-block font-bold text-xs ${
                                isHigh
                                  ? 'text-indigo-700 dark:text-cyan-300'
                                  : isPassing
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {formatGrade(grade)}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Promedio */}
                    <td className="py-2 px-2 text-center border-r tq-border font-bold text-sm tq-subtle tabular-nums tq-text">
                      {row.average !== null ? (
                        <span
                          className={
                            row.average >= 6.0
                              ? 'text-indigo-700 dark:text-cyan-300 font-black'
                              : row.average >= 4.0
                              ? 'text-emerald-700 dark:text-emerald-300 font-black'
                              : 'text-rose-600 dark:text-rose-400 font-black'
                          }
                        >
                          {formatGrade(row.average)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Chilean descriptor chip */}
                    <td className="py-2 px-3 font-sans text-xs">
                      {row.descriptorObj.text ? (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${row.descriptorObj.colorClass}`}
                        >
                          {row.descriptorObj.text}
                        </span>
                      ) : (
                        <span className="tq-text-muted opacity-50">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudentDetail && !selectedAttemptIdForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-2xs">
          <div className="tq-card rounded-2xl shadow-xl border max-w-lg w-full p-6">
            <div className="flex items-start justify-between pb-3 border-b tq-border">
              <div>
                <span className="text-[10px] uppercase font-bold tq-text-accent tracking-wider">
                  Ficha de Estudiante · {selectedCourse?.section}
                </span>
                <h3 className="text-lg font-bold tq-text mt-0.5">
                  {selectedStudentDetail.name}
                </h3>
                <span className="text-xs tq-text-muted font-mono">
                  {selectedStudentDetail.rut ? `RUN: ${selectedStudentDetail.rut} · ` : ''}
                  Código: {selectedStudentDetail.accessCode} · PIN: {selectedStudentDetail.pin}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="w-8 h-8 rounded-full tq-muted hover:opacity-80 tq-text-muted flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List of quizzes for this student */}
            <div className="my-4 max-h-64 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tq-text-2 block">
                  Evaluaciones rendidas:
                </span>
                <span className="text-[11px] tq-text-muted">
                  Pincha una evaluación para ver su detalle completo
                </span>
              </div>

              {modalDeleteNotice && (
                <div className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 text-[11px] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{modalDeleteNotice}</span>
                </div>
              )}

              {teacherAttempts.filter(a => a.studentId === selectedStudentDetail.id).length === 0 ? (
                <p className="text-xs tq-text-muted italic p-3 tq-subtle rounded-xl text-center">
                  No registra evaluaciones aún en este período.
                </p>
              ) : (
                teacherAttempts
                  .filter(a => a.studentId === selectedStudentDetail.id)
                  .map(att => {
                    const isConfirming = confirmDeleteAttemptId === att.id;
                    return (
                      <div
                        key={att.id}
                        className="p-3 tq-subtle border hover:border-[var(--tq-border-strong)] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenedFromStudentModal(true);
                            setSelectedAttemptIdForDetail(att.id);
                          }}
                          className="min-w-0 flex-1 text-left cursor-pointer group"
                        >
                          <span className="font-bold tq-text group-hover:tq-text-accent group-hover:underline block truncate">
                            {att.quizTitle}
                          </span>
                          <span className="tq-text-muted text-[11px]">
                            {att.oaCode} · {att.completedAt} · {att.score}/{att.totalQuestions} ({att.percentage}%)
                          </span>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right mr-1">
                            <span className="font-mono font-black text-sm tq-text-accent">
                              {formatGrade(att.chileanGrade)}
                            </span>
                            <span className="text-[10px] font-semibold tq-text-muted block">
                              Nivel {att.performanceLevel}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenedFromStudentModal(true);
                              setSelectedAttemptIdForDetail(att.id);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border tq-border tq-card hover:bg-[var(--tq-tint-bg)] tq-text-accent text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Ver detalle completo de esta evaluación"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalle</span>
                          </button>

                          {isConfirming ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-700 px-2 py-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteQuizAttempt(att.id);
                                  setConfirmDeleteAttemptId(null);
                                  setModalDeleteNotice(
                                    `Nota de «${att.quizTitle}» eliminada. El estudiante ya puede repetir esta evaluación.`
                                  );
                                }}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded cursor-pointer"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteAttemptId(null)}
                                className="px-2 py-0.5 tq-card border tq-border tq-text-2 text-[11px] font-semibold rounded cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setModalDeleteNotice(null);
                                setConfirmDeleteAttemptId(att.id);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Borrar esta nota para permitir repetir la evaluación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Borrar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-4 border-t tq-border flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const sId = selectedStudentDetail.id;
                  setSelectedStudentDetail(null);
                  onSelectStudentForReport(sId);
                }}
                className="px-4 py-2.5 tq-btn-primary text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Generar Informe Oficial en PDF para Apoderado</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 tq-muted hover:opacity-85 tq-text-2 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specific Evaluation Attempt Detail Modal (ThatQuiz-style breakdown) */}
      {(() => {
        if (!selectedAttemptIdForDetail) return null;
        const targetAttempt = teacherAttempts.find(a => a.id === selectedAttemptIdForDetail);
        if (!targetAttempt) return null;
        const parsedRow = parsedStudents.find(p => p.student.id === targetAttempt.studentId);
        const formattedName = parsedRow
          ? [parsedRow.apellido, parsedRow.nombre].filter(Boolean).join(', ')
          : targetAttempt.studentName;
        const targetAssignment = courseAssignments.find(q => q.id === targetAttempt.quizId);

        return (
          <EvaluationDetailModal
            attempt={targetAttempt}
            assignment={targetAssignment}
            courseSection={selectedCourse?.section}
            formattedStudentName={formattedName}
            onClose={() => {
              setSelectedAttemptIdForDetail(null);
              setOpenedFromStudentModal(false);
            }}
            onBackToStudent={
              openedFromStudentModal && selectedStudentDetail
                ? () => setSelectedAttemptIdForDetail(null)
                : undefined
            }
            onUpdateGrade={updateQuizAttemptGrade}
            onDeleteAttempt={attemptId => {
              deleteQuizAttempt(attemptId);
              setSelectedAttemptIdForDetail(null);
              if (openedFromStudentModal && selectedStudentDetail) {
                setModalDeleteNotice(
                  `Nota de «${targetAttempt.quizTitle}» eliminada. El estudiante ya puede repetir esta evaluación.`
                );
              } else {
                setDeletedNotice(
                  `Nota de «${targetAttempt.quizTitle}» eliminada. El estudiante ya puede repetir esta evaluación.`
                );
              }
            }}
            onOpenReport={sId => {
              setSelectedAttemptIdForDetail(null);
              setSelectedStudentDetail(null);
              setOpenedFromStudentModal(false);
              onSelectStudentForReport(sId);
            }}
          />
        );
      })()}

      {/* Graph Modal */}
      {showGraphModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-2xs">
          <div className="tq-card rounded-2xl shadow-xl border max-w-lg w-full p-6">
            <h3 className="text-base font-bold tq-text mb-1">
              Gráfica de Rendimiento · {selectedCourse?.section}
            </h3>
            <p className="text-xs tq-text-muted mb-4">
              Distribución de notas chilenas (escala 1.0 a 7.0 al 60% de exigencia)
            </p>

            <div className="space-y-3 py-2">
              {[
                { label: 'Sobresaliente (6.5 - 7.0)', count: parsedStudents.filter(p => p.average !== null && p.average >= 6.5).length, color: 'bg-purple-400' },
                { label: 'Muy bueno (6.0 - 6.4)', count: parsedStudents.filter(p => p.average !== null && p.average >= 6.0 && p.average < 6.5).length, color: 'bg-sky-400' },
                { label: 'Bueno (5.5 - 5.9)', count: parsedStudents.filter(p => p.average !== null && p.average >= 5.5 && p.average < 6.0).length, color: 'bg-emerald-400' },
                { label: 'Suficiente (4.0 - 5.4)', count: parsedStudents.filter(p => p.average !== null && p.average >= 4.0 && p.average < 5.5).length, color: 'bg-amber-400' },
                { label: 'Insuficiente / Regular (< 4.0)', count: parsedStudents.filter(p => p.average !== null && p.average < 4.0).length, color: 'bg-rose-400' },
              ].map(item => (
                <div key={item.label} className="text-xs">
                  <div className="flex justify-between font-medium mb-1">
                    <span className="tq-text-2">{item.label}</span>
                    <span className="font-mono font-bold tq-text">{item.count} alumnos</span>
                  </div>
                  <div className="w-full tq-muted h-3 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full transition-all`}
                      style={{
                        width: `${parsedStudents.length > 0 ? (item.count / parsedStudents.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-3 border-t tq-border text-right">
              <button
                type="button"
                onClick={() => setShowGraphModal(false)}
                className="px-4 py-2 tq-btn-primary text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar Gráfica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-2xs">
          <div className="tq-card rounded-2xl shadow-xl border max-w-md w-full p-6">
            <h3 className="text-base font-bold tq-text mb-1">
              Configuración de Escala MateClic
            </h3>
            <p className="text-xs tq-text-muted mb-4">
              Escuela Ricardo Silva Arriagada · SLEP Chinchorro
            </p>

            <div className="space-y-3 text-xs tq-text-2 tq-subtle p-4 rounded-xl border">
              <div className="flex justify-between">
                <span>Escala de notas:</span>
                <strong className="tq-text-accent">1.0 a 7.0</strong>
              </div>
              <div className="flex justify-between">
                <span>Exigencia de aprobación:</span>
                <strong className="tq-text-accent">60% (Nota 4.0)</strong>
              </div>
              <div className="flex justify-between">
                <span>Docente a cargo:</span>
                <strong className="tq-text">{currentTeacher?.name ? `Prof. ${currentTeacher.name}` : 'Docente'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Establecimiento:</span>
                <strong className="tq-text">Escuela Ricardo Silva Arriagada</strong>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t tq-border text-right">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2 tq-btn-primary text-xs font-bold rounded-xl cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
