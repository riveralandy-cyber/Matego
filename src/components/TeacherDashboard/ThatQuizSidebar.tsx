import React from 'react';
import { useApp } from '../../context/AppContext';
import { Table, List, BookOpen, PlusCircle, BarChart2, FileText, LogOut, KeyRound, Award } from 'lucide-react';
import { ThemePaletteSelector } from '../ThemePaletteSelector';

export const ThatQuizSidebar: React.FC = () => {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    selectedCourse,
    activeTeacherTab,
    setActiveTeacherTab,
    currentTeacher,
    setIsTeacherLoginModalOpen,
    logoutTeacher,
    teacherStudents,
    teacherAssignments,
  } = useApp();

  const coursesWithMyListsCount = new Set(teacherStudents.map(s => s.courseId)).size;

  const navItems = [
    { id: 'matrix' as const, label: 'Ver notas', icon: Table, chip: 'bg-sky-200/80 dark:bg-sky-900/70 text-sky-800 dark:text-sky-200' },
    { id: 'courses' as const, label: 'Lista del curso', icon: List, chip: 'bg-indigo-200/80 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200' },
    { id: 'curriculum' as const, label: 'Objetivos MINEDUC', icon: BookOpen, chip: 'bg-teal-200/80 dark:bg-teal-900/70 text-teal-800 dark:text-teal-200' },
    { id: 'quizzes' as const, label: 'Ver exámenes', icon: BookOpen, chip: 'bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200' },
    { id: 'create_quiz' as const, label: 'Crear examen', icon: PlusCircle, chip: 'bg-amber-200/80 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200' },
    { id: 'simce' as const, label: 'SIMCE 4°·6°·8°', icon: Award, chip: 'bg-cyan-200/80 dark:bg-cyan-900/70 text-cyan-800 dark:text-cyan-200' },
    { id: 'stats' as const, label: 'Observar / Progreso', icon: BarChart2, chip: 'bg-purple-200/80 dark:bg-purple-900/70 text-purple-800 dark:text-purple-200' },
    { id: 'reports' as const, label: 'Informes Apoderados', icon: FileText, chip: 'bg-rose-200/80 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200' },
  ];

  return (
    <>
      {/* Compact Mobile/Tablet Bar (< md) so content is immediately visible on screen */}
      <div className="md:hidden w-full tq-sidebar border-b p-2.5 space-y-2 print:hidden">
        <div className="flex items-center gap-2">
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="flex-1 min-w-0 tq-input border text-xs font-bold px-2.5 py-1.5 rounded-lg focus:outline-hidden"
          >
            {courses.map(c => {
              const count = teacherStudents.filter(s => s.courseId === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.section}{count > 0 ? ` (${count} al.)` : ''}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={() => setIsTeacherLoginModalOpen(true)}
            className="px-2.5 py-1.5 text-[11px] font-bold tq-accent-soft border border-[var(--tq-border-strong)] rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <KeyRound className="w-3 h-3" />
            <span>Cuenta</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTeacherTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTeacherTab(item.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  active
                    ? 'tq-btn-primary border-[var(--tq-accent)] shadow-2xs'
                    : 'tq-subtle tq-text-2 tq-border'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Left Sidebar (md+) compactly sized to fit inside single screen */}
      <aside className="hidden md:flex w-56 lg:w-60 shrink-0 tq-sidebar border-r p-3 font-sans text-xs flex-col justify-between gap-2.5 md:h-full md:overflow-y-auto print:hidden shadow-xs">
        <div className="space-y-3">
          {/* MateClic Logo & Teacher Branding */}
          <div className="p-2.5 tq-tint rounded-xl border shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span
                translate="no"
                className="notranslate text-sm font-black tracking-widest lowercase tq-text-accent font-mono"
              >
                mateclic
              </span>
              <button
                type="button"
                onClick={() => setIsTeacherLoginModalOpen(true)}
                className="text-[10px] tq-text-accent font-bold shrink-0 tq-card hover:opacity-90 px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer"
                title="Cambiar clave docente, apariencia o cambiar de usuario"
              >
                <KeyRound className="w-2.5 h-2.5" />
                <span>Cuenta</span>
              </button>
            </div>
            <div className="text-xs font-bold tq-text truncate">
              {currentTeacher?.name || selectedCourse?.teacherName || 'Docente'}
            </div>
            <div className="flex items-center justify-between text-[10px] tq-text-muted font-semibold">
              <span>{coursesWithMyListsCount} lista(s) · {teacherAssignments.length} exám.</span>
              <button
                type="button"
                onClick={logoutTeacher}
                className="text-rose-700 dark:text-rose-300 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <LogOut className="w-2.5 h-2.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>

          {/* Section: Clases */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold tq-text-2 tracking-wider">
                Curso Activo
              </label>
              <span className="text-[10px] px-1.5 py-0.5 tq-accent-soft font-bold rounded-full">
                {courses.length} niveles
              </span>
            </div>

            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full tq-input border text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-2xs focus:outline-hidden transition-all"
            >
              {courses.map(c => {
                const count = teacherStudents.filter(s => s.courseId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.section.replace('° Básico ', '°')} ({c.section}){count > 0 ? ` · ${count} al.` : ''}
                  </option>
                );
              })}
            </select>

            {/* Navigation links */}
            <div className="space-y-0.5 pt-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = activeTeacherTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTeacherTab(item.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                      active
                        ? 'tq-accent-soft font-bold shadow-2xs'
                        : 'hover:bg-[var(--tq-muted-bg)] tq-text-2'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${item.chip}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="font-medium truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Theme Palette Switcher in Sidebar */}
        <div className="pt-2 border-t tq-border">
          <ThemePaletteSelector variant="compact" title="Paleta de colores" />
        </div>
      </aside>
    </>
  );
};
