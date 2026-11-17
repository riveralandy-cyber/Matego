import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KeyRound, UserCheck, ArrowRight, ShieldAlert, PlayCircle } from 'lucide-react';
import { ThemePaletteSelector } from '../ThemePaletteSelector';

interface StudentLoginProps {
  onLoginSuccess: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onLoginSuccess }) => {
  const {
    courses,
    students,
    assignments,
    teachers,
    setCurrentStudent,
    setActiveQuizTaking,
    setRole,
  } = useApp();

  // Build unique (courseId, teacherId) lists that actually have students
  const activeCourseTeacherLists = React.useMemo(() => {
    const map = new Map<string, { key: string; courseId: string; teacherId: string; count: number }>();
    students.forEach(s => {
      const key = `${s.courseId}::${s.teacherId}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { key, courseId: s.courseId, teacherId: s.teacherId, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [students]);

  const [loginMode, setLoginMode] = useState<'list' | 'code'>('list');
  const [selectedListKey, setSelectedListKey] = useState<string>(
    activeCourseTeacherLists[0]?.key || `${courses[0]?.id || ''}::t-1`
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [quizDirectCode, setQuizDirectCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  React.useEffect(() => {
    if (
      activeCourseTeacherLists.length > 0 &&
      !activeCourseTeacherLists.some(l => l.key === selectedListKey)
    ) {
      setSelectedListKey(activeCourseTeacherLists[0].key);
      setSelectedStudentId('');
      setPin('');
    }
  }, [activeCourseTeacherLists, selectedListKey]);

  const [selectedCourseId, selectedTeacherId] = selectedListKey.split('::');
  const courseStudents = students.filter(
    s => s.courseId === selectedCourseId && s.teacherId === selectedTeacherId
  );
  const selectedCourseObj = courses.find(c => c.id === selectedCourseId);
  const selectedTeacherObj = teachers.find(t => t.id === selectedTeacherId);

  const handleListLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedStudentId) {
      setErrorMessage('Por favor selecciona tu nombre en la lista.');
      return;
    }

    if (!pin.trim()) {
      setErrorMessage('Debes ingresar tu PIN personal de acceso.');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      setErrorMessage('Estudiante no encontrado.');
      return;
    }

    if (student.pin !== pin.trim()) {
      setErrorMessage('PIN incorrecto. Verifica tu clave o pídela a tu profesor(a).');
      return;
    }

    setCurrentStudent(student);
    onLoginSuccess();
  };

  const handleCodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = accessCode.trim().toUpperCase();
    if (!cleanCode || !pin.trim()) {
      setErrorMessage('Ingresa tu código de estudiante y tu PIN personal.');
      return;
    }

    const student = students.find(s => s.accessCode.toUpperCase() === cleanCode);

    if (!student || student.pin !== pin.trim()) {
      setErrorMessage('Código o PIN incorrecto. Verifica tus credenciales con tu profesor(a).');
      return;
    }

    // Check if entered a direct quiz code belonging to this student's teacher & course
    if (quizDirectCode.trim()) {
      const qCode = quizDirectCode.trim().toUpperCase();
      const targetQuiz = assignments.find(
        a =>
          a.code.toUpperCase() === qCode &&
          a.courseId === student.courseId &&
          a.teacherId === student.teacherId
      );
      if (targetQuiz) {
        setActiveQuizTaking(targetQuiz);
      }
    }

    setCurrentStudent(student);
    onLoginSuccess();
  };

  return (
    <div className="max-w-md mx-auto my-8 p-7 tq-card border-2 rounded-3xl shadow-sm">
      <div className="text-center mb-6">
        <div className="w-14 h-14 tq-brand-badge border rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tq-text">
          ¡Hola estudiante!
        </h1>
        <p className="text-xs tq-text-muted mt-1 font-medium">
          Escuela Ricardo Silva Arriagada · Ingresa con tu PIN personal
        </p>
      </div>

      {/* Tabs: Lista de curso vs Código de acceso */}
      <div className="flex tq-muted p-1 rounded-2xl mb-6 border">
        <button
          type="button"
          onClick={() => {
            setLoginMode('list');
            setErrorMessage('');
            setPin('');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            loginMode === 'list'
              ? 'tq-card tq-text-accent shadow-xs'
              : 'tq-text-muted hover:tq-text'
          }`}
        >
          Lista del Curso
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMode('code');
            setErrorMessage('');
            setPin('');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            loginMode === 'code'
              ? 'tq-card tq-text-accent shadow-xs'
              : 'tq-text-muted hover:tq-text'
          }`}
        >
          Código + PIN
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loginMode === 'list' ? (
        <form onSubmit={handleListLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1">
              Selecciona tu Curso y Profesor(a):
            </label>
            <select
              value={selectedListKey}
              onChange={e => {
                setSelectedListKey(e.target.value);
                setSelectedStudentId('');
                setPin('');
                setErrorMessage('');
              }}
              className="w-full text-xs font-bold border rounded-xl p-3 tq-input focus:outline-hidden"
            >
              {activeCourseTeacherLists.map(item => {
                const c = courses.find(co => co.id === item.courseId);
                const t = teachers.find(te => te.id === item.teacherId);
                return (
                  <option key={item.key} value={item.key}>
                    {c?.section || item.courseId} · Prof. {t?.name || 'Docente'} ({item.count} alumnos)
                  </option>
                );
              })}
            </select>

            {selectedCourseObj && (
              <div className="mt-2 p-2.5 tq-tint border rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full tq-accent-soft flex items-center justify-center font-bold text-[10px]">
                    {(selectedTeacherObj?.name || selectedCourseObj.teacherName).charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] tq-text-accent font-bold block uppercase tracking-wider">Profesor(a) a cargo:</span>
                    <span className="font-bold tq-text">Prof. {selectedTeacherObj?.name || selectedCourseObj.teacherName}</span>
                  </div>
                </div>
                <span className="text-[10px] tq-text-muted font-medium hidden sm:inline">SLEP Chinchorro</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1">
              Selecciona tu Nombre:
            </label>
            <select
              value={selectedStudentId}
              onChange={e => {
                setSelectedStudentId(e.target.value);
                setPin('');
                setErrorMessage('');
              }}
              className="w-full text-xs font-bold border rounded-xl p-3 tq-input focus:outline-hidden"
            >
              <option value="">-- Elige tu nombre de la lista --</option>
              {courseStudents.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1">
              PIN de Acceso (4 dígitos):
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoComplete="off"
              className="w-full text-center text-xl font-mono font-bold tracking-widest border rounded-xl p-3 tq-input focus:outline-hidden"
            />
            <span className="text-[11px] tq-text-muted mt-1.5 block">
              Ingresa el PIN entregado por tu profesor(a). Una vez dentro, podrás cambiarlo por un PIN personal.
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 tq-btn-gradient font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Entrar a Mis Evaluaciones</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleCodeLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1">
              Código de Estudiante (entregado por tu profesor):
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
              placeholder="Ej: MAT-7A-01"
              autoComplete="off"
              className="w-full font-mono text-xs font-bold border rounded-xl p-3 tq-input uppercase focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1">
              PIN de Acceso (4 dígitos):
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoComplete="off"
              className="w-full text-center text-xl font-mono font-bold tracking-widest border rounded-xl p-3 tq-input focus:outline-hidden"
            />
            <span className="text-[11px] tq-text-muted mt-1.5 block">
              Ingresa el PIN entregado por tu profesor(a). Una vez dentro, podrás cambiarlo por un PIN personal.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold tq-text-2 mb-1">
              Código de Prueba (Opcional):
            </label>
            <input
              type="text"
              value={quizDirectCode}
              onChange={e => setQuizDirectCode(e.target.value)}
              placeholder="Ej: QUIZ-701"
              className="w-full font-mono text-xs border rounded-xl p-2.5 tq-input uppercase focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 tq-btn-gradient font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Ingresar con Credenciales</span>
          </button>
        </form>
      )}

      {/* Theme Palette Configurator right from Student Entry */}
      <div className="mt-5">
        <ThemePaletteSelector
          variant="compact"
          title="Personaliza los colores de tu plataforma"
          subtitle="Puedes mantener la paleta estándar o elegir otra desde tu ingreso."
        />
      </div>

      {/* Open Free Practice CTA (No login needed) */}
      <div className="mt-5 pt-4 border-t tq-border space-y-3">
        <button
          type="button"
          onClick={() => setRole('practice')}
          className="w-full py-2.5 px-4 tq-tint border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <PlayCircle className="w-4 h-4 tq-text-accent" />
          <span className="tq-text">¿Solo quieres ejercitar sin iniciar sesión? Ir a Práctica Libre</span>
        </button>

        {/* Teacher switch link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className="text-xs font-bold tq-text-accent hover:opacity-80 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>¿Eres docente? Ir al Acceso de Profesores</span>
          </button>
        </div>
      </div>
    </div>
  );
};
