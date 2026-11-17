import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, Download, ArrowLeft, School, Award, CheckCircle, BookOpen, AlertCircle, Edit3 } from 'lucide-react';
import { formatGrade, getGradeColorClass, formatAxisName, getMineducPerformanceLevel } from '../../utils/chileanGrades';
import { Student } from '../../types';

interface ParentReportViewProps {
  initialStudentId?: string;
  onBack: () => void;
}

export const ParentReportView: React.FC<ParentReportViewProps> = ({ initialStudentId, onBack }) => {
  const { selectedCourseId, selectedCourse, teacherStudents, teacherAttempts, currentTeacher } = useApp();

  const courseStudents = teacherStudents.filter(s => s.courseId === selectedCourseId);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || courseStudents[0]?.id || ''
  );

  const [customTeacherNotes, setCustomTeacherNotes] = useState<string>(
    'El estudiante demuestra compromiso constante en sus evaluaciones formativas. Se recomienda reforzar en casa el cálculo mental de tablas y la resolución paso a paso de problemas con enunciados durante 15 minutos al día.'
  );

  const student = courseStudents.find(s => s.id === selectedStudentId) || courseStudents[0];
  const studentAttempts = teacherAttempts.filter(a => a.studentId === student?.id);

  // Compute student metrics
  const avgGrade =
    studentAttempts.length > 0
      ? studentAttempts.reduce((acc, curr) => acc + curr.chileanGrade, 0) / studentAttempts.length
      : 0;

  const avgPercentage =
    studentAttempts.length > 0
      ? Math.round(studentAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / studentAttempts.length)
      : 0;

  const overallLevel = getMineducPerformanceLevel(avgGrade);
  const levelStyle = getGradeColorClass(avgGrade, true);

  const handlePrint = () => {
    window.print();
  };

  if (!student) {
    return (
      <div className="p-8 text-center tq-card border rounded-xl">
        <p className="tq-text-muted text-sm">No hay estudiante seleccionado para generar el informe.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 px-4 py-2 tq-muted tq-text-2 text-xs font-semibold rounded-lg cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden when printing) */}
      <div className="tq-card border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 tq-text-muted hover:tq-text hover:bg-[var(--tq-muted-bg)] rounded-md transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold tq-text">
              Generador de Informes Pedagógicos para Apoderados
            </h1>
            <p className="text-xs tq-text-muted">
              Documento formal alineado con los estándares MINEDUC listo para imprimir o exportar en PDF.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold tq-text-muted mb-0.5">
              Estudiante:
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="text-xs font-semibold tq-input border rounded-lg px-3 py-1.5 focus:outline-hidden"
            >
              {courseStudents.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.accessCode})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 tq-btn-primary text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-end md:self-auto cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar en PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 / Letter format) */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl shadow-lg p-8 md:p-12 text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0 font-serif">
        {/* Official Header */}
        <div className="border-b-2 border-slate-800 pb-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest text-slate-500 block font-sans font-semibold">
                República de Chile · Ministerio de Educación
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase font-sans">
                {selectedCourse?.schoolName}
              </h2>
              <div className="text-xs text-slate-600 font-sans flex flex-wrap gap-x-3 gap-y-0.5">
                <span>RBD: {selectedCourse?.rbd}</span>
                <span>·</span>
                <span>Comuna: {selectedCourse?.commune}</span>
                <span>·</span>
                <span>Año Escolar: {selectedCourse?.academicYear}</span>
              </div>
            </div>

            <div className="w-16 h-16 shrink-0 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
              <img
                src="/src/assets/images/chile_school_crest_1790701788269.jpg"
                alt="Escudo Institucional"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-center font-sans">
            <h3 className="text-base font-bold uppercase tracking-wider text-slate-900">
              Informe de Rendimiento y Progreso Escolar en Matemática
            </h3>
            <span className="text-xs text-slate-500">
              Plataforma de Ejercitación Virtual ThatQuiz Escolar · Currículum Nacional MINEDUC
            </span>
          </div>
        </div>

        {/* Student Data Box */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans mb-6">
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Estudiante:</span>
            <span className="font-bold text-slate-900 text-sm">{student.name}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold block">RUN:</span>
            <span className="font-mono font-medium text-slate-800">{student.rut}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Curso:</span>
            <span className="font-bold text-slate-800">{selectedCourse?.section}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Docente:</span>
            <span className="font-medium text-slate-800">Prof. {currentTeacher?.name || selectedCourse?.teacherName}</span>
          </div>
        </div>

        {/* Overall Performance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 font-sans">
          <div className="p-4 bg-white border-2 border-slate-200 rounded-lg text-center">
            <span className="text-[11px] uppercase font-bold text-slate-500 block">
              Calificación Promedio (1.0 - 7.0)
            </span>
            <div className={`text-4xl font-black font-mono tabular-nums mt-1 ${levelStyle.text}`}>
              {formatGrade(avgGrade)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Escala con 60% de exigencia
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-slate-200 rounded-lg text-center">
            <span className="text-[11px] uppercase font-bold text-slate-500 block">
              Porcentaje Global de Logro
            </span>
            <div className="text-4xl font-black font-mono tabular-nums mt-1 text-slate-900">
              {avgPercentage}%
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {studentAttempts.length} evaluaciones rendidas
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-slate-200 rounded-lg text-center flex flex-col justify-center">
            <span className="text-[11px] uppercase font-bold text-slate-500 block">
              Nivel de Desempeño MINEDUC
            </span>
            <div className={`mt-2 py-1 px-3 rounded-full text-xs font-black inline-block mx-auto ${levelStyle.bg} ${levelStyle.text} border ${levelStyle.border}`}>
              NIVEL {overallLevel.toUpperCase()}
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 block">
              {overallLevel === 'Adecuado' ? 'Cumple satisfactoriamente' : overallLevel === 'Elemental' ? 'En proceso de adquisición' : 'Requiere apoyo pedagógico prioritario'}
            </span>
          </div>
        </div>

        {/* Evaluation Breakdown Table */}
        <div className="mb-6 font-sans">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Detalle de Evaluaciones y Objetivos de Aprendizaje (OA)
          </h4>

          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Evaluación / Contenido</th>
                  <th className="py-2.5 px-3 text-center">OA</th>
                  <th className="py-2.5 px-3 text-center">Puntaje</th>
                  <th className="py-2.5 px-3 text-center">Calificación</th>
                  <th className="py-2.5 px-3 text-center">Nivel Logro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {studentAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      El estudiante aún no registra evaluaciones en el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  studentAttempts.map((att, idx) => {
                    const stStyle = getGradeColorClass(att.chileanGrade, true);
                    return (
                      <tr key={att.id || idx}>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {att.completedAt.split(' ')[0]}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {att.quizTitle}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                          {att.oaCode}
                        </td>
                        <td className="py-2 px-3 text-center font-mono tabular-nums">
                          {att.score}/{att.totalQuestions} ({att.percentage}%)
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-sm">
                          <span className={stStyle.text}>
                            {formatGrade(att.chileanGrade)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${stStyle.bg} ${stStyle.text}`}>
                            {att.performanceLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pedagogical Observations & Home Advice */}
        <div className="mb-10 font-sans p-4 border border-slate-200 rounded-lg bg-slate-50/60">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
              <span>Observaciones y Sugerencias Pedagógicas para el Hogar</span>
            </h4>
            <span className="text-[10px] text-slate-400 print:hidden flex items-center gap-1">
              <Edit3 className="w-3 h-3" />
              (Texto editable por el docente)
            </span>
          </div>

          <textarea
            rows={3}
            value={customTeacherNotes}
            onChange={e => setCustomTeacherNotes(e.target.value)}
            className="w-full text-xs text-slate-700 bg-transparent border-0 focus:ring-0 p-0 resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Formal Signature Area */}
        <div className="pt-12 grid grid-cols-2 gap-12 text-center font-sans break-inside-avoid">
          <div>
            <div className="border-t border-slate-500 pt-2 w-48 mx-auto">
              <span className="text-xs font-bold text-slate-800 block">
                Prof. {currentTeacher?.name || selectedCourse?.teacherName}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Docente de Educación Matemática
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {selectedCourse?.schoolName}
              </span>
            </div>
          </div>

          <div>
            <div className="border-t border-slate-500 pt-2 w-48 mx-auto">
              <span className="text-xs font-bold text-slate-800 block">
                Firma del Apoderado
              </span>
              <span className="text-[11px] text-slate-500 block">
                Toma de Conocimiento
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                RUN: _____________________
              </span>
            </div>
          </div>
        </div>

        {/* Footer date */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-sans">
          Documento emitido el {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })} · Sistema ThatQuiz Escolar MINEDUC
        </div>
      </div>
    </div>
  );
};
