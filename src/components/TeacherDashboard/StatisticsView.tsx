import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, User, FileText, Search, Filter } from 'lucide-react';
import { formatGrade, getGradeColorClass, formatAxisName } from '../../utils/chileanGrades';
import { QuizAttempt, PerformanceLevel } from '../../types';

interface StatisticsViewProps {
  onSelectStudentForReport: (studentId: string) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ onSelectStudentForReport }) => {
  const { courses, selectedCourseId, setSelectedCourseId, selectedCourse, teacherStudents, teacherAssignments, teacherAttempts } = useApp();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedOaFilter, setSelectedOaFilter] = useState<string>('all');

  const courseStudents = teacherStudents.filter(s => s.courseId === selectedCourseId);
  const courseAssignments = teacherAssignments.filter(a => a.courseId === selectedCourseId);
  const courseAttempts = teacherAttempts.filter(a => a.courseId === selectedCourseId);

  // Distinct OAs present in assignments
  const distinctOAs = Array.from(new Set(courseAssignments.map(a => a.oaCode)));

  // Filter attempts based on OA
  const filteredAttempts = selectedOaFilter === 'all'
    ? courseAttempts
    : courseAttempts.filter(a => a.oaCode === selectedOaFilter);

  // Aggregate metrics
  const totalAttempts = filteredAttempts.length;
  const overallAverage =
    totalAttempts > 0
      ? filteredAttempts.reduce((acc, curr) => acc + curr.chileanGrade, 0) / totalAttempts
      : null;

  const approvedAttempts = filteredAttempts.filter(a => a.chileanGrade >= 4.0).length;
  const approvalRate = totalAttempts > 0 ? Math.round((approvedAttempts / totalAttempts) * 100) : 0;

  // MINEDUC Distribution
  const countsByLevel: Record<PerformanceLevel, number> = {
    Adecuado: filteredAttempts.filter(a => a.performanceLevel === 'Adecuado').length,
    Elemental: filteredAttempts.filter(a => a.performanceLevel === 'Elemental').length,
    Insuficiente: filteredAttempts.filter(a => a.performanceLevel === 'Insuficiente').length,
  };

  // Student specific aggregates
  const studentRows = courseStudents
    .filter(st => st.name.toLowerCase().includes(studentSearch.toLowerCase()) || st.rut.includes(studentSearch))
    .map(st => {
      const stAttempts = courseAttempts.filter(a => a.studentId === st.id);
      const avg =
        stAttempts.length > 0
          ? stAttempts.reduce((acc, curr) => acc + curr.chileanGrade, 0) / stAttempts.length
          : null;
      
      // Oa specific grades map
      const oaGrades: Record<string, number | undefined> = {};
      stAttempts.forEach(att => {
        oaGrades[att.oaCode] = att.chileanGrade;
      });

      return {
        student: st,
        attemptsCount: stAttempts.length,
        averageGrade: avg,
        oaGrades,
        needsReinforcement: avg !== null && avg < 4.0,
      };
    });

  // Students requiring reinforcement
  const alertStudents = studentRows.filter(r => r.needsReinforcement || (r.averageGrade !== null && r.averageGrade < 4.5));

  return (
    <div className="space-y-3.5 min-w-0">
      {/* Top Filter and Course Selection */}
      <div className="tq-card border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tq-text">
            Seguimiento de Progreso e Indicadores Pedagógicos
          </h1>
          <p className="text-xs tq-text-muted mt-0.5">
            Métricas alineadas con estándares MINEDUC (Escala 1.0 a 7.0 al 60% de exigencia).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div>
            <label className="block text-[10px] uppercase font-bold tq-text-muted mb-0.5">
              Curso:
            </label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="text-xs font-semibold tq-input border rounded-lg px-2.5 py-1.5 focus:outline-hidden"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tq-text-muted mb-0.5">
              Filtrar por OA:
            </label>
            <select
              value={selectedOaFilter}
              onChange={e => setSelectedOaFilter(e.target.value)}
              className="text-xs font-semibold tq-input border rounded-lg px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="all">Todos los OAs evaluados</option>
              {distinctOAs.map(oa => (
                <option key={oa} value={oa}>
                  {oa}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
        {/* Promedio General */}
        <div className="tq-card border rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold tq-text-muted uppercase tracking-wider block">
            Promedio del Curso
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black font-mono tabular-nums ${
                overallAverage !== null ? getGradeColorClass(overallAverage).text : 'tq-text-muted'
              }`}
            >
              {overallAverage !== null ? formatGrade(overallAverage) : '—'}
            </span>
            <span className="text-xs tq-text-muted">escala 1.0 a 7.0</span>
          </div>
          <span className="text-[11px] tq-text-muted mt-1 block">
            {totalAttempts} pruebas evaluadas
          </span>
        </div>

        {/* Tasa de Aprobación */}
        <div className="tq-card border rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold tq-text-muted uppercase tracking-wider block">
            Tasa de Aprobación (≥ 4.0)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tabular-nums tq-text">
              {approvalRate}%
            </span>
            <span className="text-xs tq-text-muted">({approvedAttempts}/{totalAttempts})</span>
          </div>
          <div className="w-full tq-muted h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${approvalRate}%` }} />
          </div>
        </div>

        {/* Distribución MINEDUC */}
        <div className="tq-card border rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold tq-text-muted uppercase tracking-wider block mb-2">
            Niveles de Logro MINEDUC
          </span>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">Adecuado (≥ 5.1):</span>
              <span className="font-mono font-bold tq-text">{countsByLevel.Adecuado}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-700 dark:text-amber-300 font-medium">Elemental (4.0 - 5.0):</span>
              <span className="font-mono font-bold tq-text">{countsByLevel.Elemental}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rose-700 dark:text-rose-300 font-medium">Insuficiente (&lt; 4.0):</span>
              <span className="font-mono font-bold text-rose-700 dark:text-rose-300">{countsByLevel.Insuficiente}</span>
            </div>
          </div>
        </div>

        {/* Alerta de Refuerzo */}
        <div className="tq-card border rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold tq-text-muted uppercase tracking-wider block">
            Alerta Pedagógica
          </span>
          <div className="mt-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-black font-mono tq-text">
              {alertStudents.length}
            </span>
            <span className="text-xs tq-text-muted">alumnos prioritarios</span>
          </div>
          <span className="text-[11px] tq-text-muted mt-1 block">
            Requieren reforzamiento focalizado
          </span>
        </div>
      </div>

      {/* Heatmap Matrix: Student vs Learning Objectives (OAs) */}
      <div className="tq-card border rounded-xl shadow-xs overflow-hidden min-w-0">
        <div className="p-4 border-b tq-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tq-text flex items-center gap-2">
              <BarChart3 className="w-5 h-5 tq-text-accent" />
              <span>Matriz de Desempeño por Estudiante y Objetivo de Aprendizaje</span>
            </h2>
            <p className="text-xs tq-text-muted">
              Haz clic en cualquier estudiante para abrir su informe automático en PDF para el apoderado.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 tq-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="Buscar estudiante..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border tq-input rounded-lg focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="tq-subtle border-b tq-border tq-text-2 font-semibold">
                <th className="py-3 px-4 w-10 text-center">N°</th>
                <th className="py-3 px-4 min-w-[200px]">Estudiante</th>
                <th className="py-3 px-3 text-center">Rendidas</th>
                {distinctOAs.map(oa => (
                  <th key={oa} className="py-3 px-3 text-center font-mono">
                    {oa}
                  </th>
                ))}
                <th className="py-3 px-4 text-center">Promedio</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--tq-border)] tq-text-2">
              {studentRows.map((row, idx) => {
                const avgStyle = row.averageGrade !== null ? getGradeColorClass(row.averageGrade) : null;
                return (
                  <tr key={row.student.id} className="hover:bg-[var(--tq-tint-bg)]/40 transition-colors">
                    <td className="py-3 px-4 text-center tq-text-muted font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold tq-text flex items-center gap-1.5">
                        <span>{row.student.name}</span>
                        {row.needsReinforcement && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" title="Requiere refuerzo" />
                        )}
                      </div>
                      {row.student.rut && (
                        <span className="text-[11px] tq-text-muted font-mono">
                          RUN: {row.student.rut}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {row.attemptsCount}
                    </td>

                    {/* Columns for each OA */}
                    {distinctOAs.map(oa => {
                      const grade = row.oaGrades[oa];
                      if (grade === undefined) {
                        return (
                          <td key={oa} className="py-3 px-3 text-center tq-text-muted opacity-50 font-mono">
                            —
                          </td>
                        );
                      }
                      const style = getGradeColorClass(grade);
                      return (
                        <td key={oa} className="py-3 px-3 text-center">
                          <span
                            className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs tabular-nums ${style.bg} ${style.text} border ${style.border}`}
                          >
                            {formatGrade(grade)}
                          </span>
                        </td>
                      );
                    })}

                    {/* Overall Average */}
                    <td className="py-3 px-4 text-center">
                      {row.averageGrade !== null && avgStyle ? (
                        <span
                          className={`font-mono font-black text-sm px-2 py-0.5 rounded ${avgStyle.bg} ${avgStyle.text}`}
                        >
                          {formatGrade(row.averageGrade)}
                        </span>
                      ) : (
                        <span className="tq-text-muted">—</span>
                      )}
                    </td>

                    {/* Action to view / print parent report */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectStudentForReport(row.student.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold tq-accent-soft border tq-border rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Ver informe en formato PDF para el apoderado"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Informe PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
