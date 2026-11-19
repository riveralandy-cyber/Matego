import React from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, GraduationCap, RotateCcw, Sparkles, LogOut, Lock, PlayCircle, Cloud } from 'lucide-react';

export const Navigation: React.FC = () => {
  const {
    role,
    setRole,
    isTeacherAuthenticated,
    isCloudTeacher,
    cloudSyncStatus,
    logoutTeacher,
    activeTeacherTab,
    setActiveTeacherTab,
    setActiveQuizTaking,
    resetDemoData,
    currentTeacher,
    setIsTeacherLoginModalOpen,
  } = useApp();

  const showTeacherControls = role === 'teacher' && isTeacherAuthenticated;

  const teacherTabLabels: Record<typeof activeTeacherTab, string> = {
    matrix: 'Planilla de Notas',
    courses: 'Lista de Curso (1° a 8°)',
    curriculum: 'Objetivos MINEDUC',
    quizzes: 'Exámenes Enviados',
    create_quiz: 'Crear Evaluación',
    simce: 'Ensayos SIMCE 4°·6°·8°',
    stats: 'Progreso MINEDUC',
    reports: 'Informes Apoderados (PDF)',
  };

  return (
    <header className="w-full tq-header backdrop-blur-xs border-b sticky top-0 z-40 print:hidden shadow-xs">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-2 min-w-0 shrink">
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
            className="flex items-center gap-2 group min-w-0"
          >
            <div className="w-8 h-8 rounded-lg tq-brand-badge flex items-center justify-center shadow-xs border border-white/60 dark:border-slate-700 shrink-0">
              <span translate="no" className="notranslate font-mono font-black text-sm">MC</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold tracking-tight tq-text group-hover:tq-text-accent transition-colors truncate max-w-[155px] sm:max-w-none">
                Escuela Ricardo Silva Arriagada
              </span>
              <span className="hidden sm:block text-[10px] tq-text-muted font-medium truncate">
                SLEP Chinchorro · <span translate="no" className="notranslate">MateClic</span> Matemática
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Concise Context Label (no overflowing multi-button strips) */}
        {showTeacherControls ? (
          <div className="hidden xl:flex items-center gap-2 text-xs font-semibold px-3 py-1 tq-tint rounded-full border shadow-2xs shrink-0">
            <span className="tq-text-accent">{teacherTabLabels[activeTeacherTab]}</span>
          </div>
        ) : role === 'teacher' ? (
          <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 tq-tint rounded-full border shadow-2xs shrink-0">
            <Lock className="w-3.5 h-3.5 tq-text-accent" />
            <span className="tq-text">Acceso Docente</span>
          </div>
        ) : role === 'practice' ? (
          <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 tq-tint rounded-full border shadow-2xs shrink-0">
            <PlayCircle className="w-3.5 h-3.5 tq-text-accent" />
            <span className="tq-text">Práctica Libre · Sin registro</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 tq-tint rounded-full border shadow-2xs shrink-0">
            <Sparkles className="w-3.5 h-3.5 tq-text-accent" />
            <span className="tq-text">Portal Escolar</span>
          </div>
        )}

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {showTeacherControls && (
            <>
              {isCloudTeacher && (
                <span
                  className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap"
                  title="Base de datos en tiempo real conectada con Firebase Firestore"
                >
                  <Cloud className="w-3 h-3" />
                  <span>{cloudSyncStatus === 'connecting' ? 'Sincronizando...' : 'Nube'}</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsTeacherLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 tq-accent-soft rounded-lg text-xs font-bold transition-all border border-[var(--tq-border-strong)] shadow-2xs cursor-pointer"
                title="Cambiar clave docente, apariencia o cambiar de usuario"
              >
                <div className="w-5 h-5 rounded-full tq-btn-primary flex items-center justify-center text-[10px] font-black">
                  {currentTeacher?.name?.charAt(0) || 'P'}
                </div>
                <span className="hidden md:inline font-bold whitespace-nowrap max-w-[120px] truncate">
                  Prof. {currentTeacher?.name || 'Docente'}
                </span>
              </button>

              <button
                type="button"
                onClick={logoutTeacher}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-200 rounded-lg text-xs font-bold transition-all border border-rose-200 dark:border-rose-800 shadow-2xs cursor-pointer"
                title="Cerrar sesión de profesor"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline whitespace-nowrap">Salir</span>
              </button>

              {!isCloudTeacher && (
                <button
                  type="button"
                  onClick={resetDemoData}
                  title="Restablecer datos demo locales"
                  className="p-1.5 tq-text-muted hover:tq-text hover:bg-[var(--tq-muted-bg)] rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          {role !== 'practice' && (
            <button
              type="button"
              onClick={() => {
                setActiveQuizTaking(null);
                setRole('practice');
              }}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-2xs border tq-subtle hover:border-[var(--tq-border-strong)] tq-text-accent whitespace-nowrap shrink-0 cursor-pointer"
              title="Ejercitar libremente cualquier tema sin iniciar sesión"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Práctica Libre</span>
              <span className="sm:hidden">Práctica</span>
            </button>
          )}

          {role !== 'student' && (
            <button
              type="button"
              onClick={() => {
                setActiveQuizTaking(null);
                setRole('student');
              }}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs border tq-btn-gradient border-transparent whitespace-nowrap shrink-0 cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ingreso Alumno</span>
              <span className="sm:hidden">Alumno</span>
            </button>
          )}

          {role !== 'teacher' && (
            <button
              type="button"
              onClick={() => {
                setActiveQuizTaking(null);
                setRole('teacher');
              }}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs border tq-btn-gradient-alt border-transparent whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panel Profesor</span>
              <span className="sm:hidden">Profesor</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
