import React from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, GraduationCap, RotateCcw, Sparkles, LogOut, Lock, PlayCircle } from 'lucide-react';

export const Navigation: React.FC = () => {
  const {
    role,
    setRole,
    isTeacherAuthenticated,
    logoutTeacher,
    activeTeacherTab,
    setActiveTeacherTab,
    setActiveQuizTaking,
    resetDemoData,
    currentTeacher,
    setIsTeacherLoginModalOpen,
  } = useApp();

  const showTeacherControls = role === 'teacher' && isTeacherAuthenticated;

  return (
    <header className="w-full tq-header backdrop-blur-xs border-b sticky top-0 z-40 print:hidden shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={e => {
              e.preventDefault();
              setRole('teacher');
              if (isTeacherAuthenticated) {
                setActiveTeacherTab('matrix');
              }
              setActiveQuizTaking(null);
            }}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl tq-brand-badge flex items-center justify-center shadow-xs border border-white/60 dark:border-slate-700">
              <span className="font-mono font-black text-base">TQ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight tq-text group-hover:tq-text-accent transition-colors whitespace-nowrap">
                Escuela Ricardo Silva Arriagada
              </span>
              <span className="text-[11px] tq-text-muted font-medium whitespace-nowrap">
                SLEP Chinchorro · ThatQuiz Matemática
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Navigation Links (Authenticated Teacher only) */}
        {showTeacherControls ? (
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold tq-text-2">
            {(
              [
                { id: 'matrix', label: 'Ver notas' },
                { id: 'courses', label: 'Lista de curso (1° a 8°)' },
                { id: 'curriculum', label: 'Objetivos MINEDUC' },
                { id: 'quizzes', label: 'Exámenes' },
                { id: 'create_quiz', label: 'Crear prueba' },
                { id: 'stats', label: 'Progreso MINEDUC' },
                { id: 'reports', label: 'Informe Apoderados (PDF)' },
              ] as const
            ).map(tabItem => {
              const isActive = activeTeacherTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setActiveTeacherTab(tabItem.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'tq-accent-soft font-bold shadow-2xs'
                      : 'tq-text-2 hover:bg-[var(--tq-muted-bg)] hover:tq-text'
                  }`}
                >
                  {tabItem.label}
                </button>
              );
            })}
          </nav>
        ) : role === 'teacher' ? (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 tq-tint rounded-full border shadow-2xs">
            <Lock className="w-3.5 h-3.5 tq-text-accent" />
            <span className="tq-text">Acceso Docente Protegido con Clave</span>
          </div>
        ) : role === 'practice' ? (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 tq-tint rounded-full border shadow-2xs">
            <PlayCircle className="w-3.5 h-3.5 tq-text-accent" />
            <span className="tq-text">Práctica Libre · Sin inicio de sesión ni registro</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 tq-tint rounded-full border shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 tq-text-accent" />
            <span className="tq-text">Portal Escolar · Pruebas Virtuales Amigables</span>
          </div>
        )}

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {showTeacherControls && (
            <>
              <button
                type="button"
                onClick={() => setIsTeacherLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 tq-accent-soft rounded-xl text-xs font-bold transition-all border border-[var(--tq-border-strong)] shadow-2xs cursor-pointer"
                title="Cambiar clave docente, apariencia o cambiar de usuario"
              >
                <div className="w-5 h-5 rounded-full tq-btn-primary flex items-center justify-center text-[10px] font-black">
                  {currentTeacher?.name?.charAt(0) || 'P'}
                </div>
                <span className="hidden md:inline font-bold whitespace-nowrap">Prof. {currentTeacher?.name || 'Docente'}</span>
              </button>

              <button
                type="button"
                onClick={logoutTeacher}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-200 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-800 shadow-2xs cursor-pointer"
                title="Cerrar sesión de profesor"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline whitespace-nowrap">Cerrar sesión</span>
              </button>

              <button
                type="button"
                onClick={resetDemoData}
                title="Restablecer datos demo"
                className="p-2 tq-text-muted hover:tq-text hover:bg-[var(--tq-muted-bg)] rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          {role !== 'practice' && (
            <button
              type="button"
              onClick={() => {
                setActiveQuizTaking(null);
                setRole('practice');
              }}
              className="px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs border tq-subtle hover:border-[var(--tq-border-strong)] tq-text-accent whitespace-nowrap shrink-0 cursor-pointer"
              title="Ejercitar libremente cualquier tema sin iniciar sesión"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Práctica Libre</span>
            </button>
          )}

          {role !== 'student' && (
            <button
              type="button"
              onClick={() => {
                setActiveQuizTaking(null);
                setRole('student');
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs border tq-btn-gradient border-transparent whitespace-nowrap shrink-0 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Ingreso Alumno</span>
            </button>
          )}

          {role !== 'teacher' && (
            <button
              type="button"
              onClick={() => {
                setActiveQuizTaking(null);
                setRole('teacher');
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs border tq-btn-gradient-alt border-transparent whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Panel Profesor</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
