import React, { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  ShieldAlert,
  PlayCircle,
  Search,
  RefreshCw,
  QrCode,
  X,
  FileText,
  Eye,
  EyeOff,
  Cloud,
  ArrowRight,
  School,
} from 'lucide-react';
import { ThemePaletteSelector } from '../ThemePaletteSelector';
import { CourseJoinCodeDirectory } from '../../services/cloudSync';

interface StudentLoginProps {
  onLoginSuccess: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onLoginSuccess }) => {
  const {
    courses,
    students,
    assignments,
    teachers,
    firebaseUser,
    isAuthReady,
    studentCloudError,
    ensureStudentSession,
    lookupCourseJoinCode,
    loginStudentCloudByAccessCode,
    setCurrentStudent,
    setActiveQuizTaking,
    setRole,
    urlCourseJoinCode,
    clearUrlCourseJoinCode,
  } = useApp();

  // Build unique (courseId, teacherId) lists strictly for local browser demo fallback
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
    return Array.from(map.values()).sort((a, b) => a.courseId.localeCompare(b.courseId));
  }, [students]);

  const [useLocalFallback, setUseLocalFallback] = useState(false);

  // Private Course-Code Cloud Directory state (never lists all schools/courses)
  const [courseCodeInput, setCourseCodeInput] = useState<string>(urlCourseJoinCode || '');
  const [activeCloudDirectory, setActiveCloudDirectory] = useState<CourseJoinCodeDirectory | null>(null);
  const [selectedAccessCodeFromDir, setSelectedAccessCodeFromDir] = useState<string>('');
  const [isLookingUpCourse, setIsLookingUpCourse] = useState(false);
  const autoLookedUpQrRef = React.useRef<string | null>(null);

  // Local fallback selector state
  const [selectedListKey, setSelectedListKey] = useState<string>(
    activeCourseTeacherLists[0]?.key || ''
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Shared credentials state
  const [nameSearchQuery, setNameSearchQuery] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [quizDirectCode, setQuizDirectCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const isCloudSignedIn = Boolean(isAuthReady && firebaseUser);

  const handleLookupCourseCode = useCallback(
    async (rawCode: string) => {
      const cleanCode = rawCode.trim().toUpperCase();
      if (!cleanCode || cleanCode.length < 4) {
        setErrorMessage('Ingresa el Código del Curso entregado por tu profesor(a) (ej: MC-7A-...).');
        return;
      }
      setErrorMessage('');
      setIsLookingUpCourse(true);
      try {
        if (!firebaseUser) {
          const sessionRes = await ensureStudentSession();
          if (!sessionRes.ok) {
            setErrorMessage(sessionRes.error || 'No se pudo conectar con la nube de MateClic.');
            return;
          }
        }
        const res = await lookupCourseJoinCode(cleanCode);
        if (!res.ok || !res.directory) {
          setActiveCloudDirectory(null);
          setErrorMessage(
            res.error || `No se encontró el curso con código "${cleanCode}". Revisa con tu docente.`
          );
          return;
        }
        setActiveCloudDirectory(res.directory);
        setCourseCodeInput(res.directory.joinCode);
        setSelectedAccessCodeFromDir('');
        setNameSearchQuery('');
        setPin('');
      } catch (err) {
        setActiveCloudDirectory(null);
        setErrorMessage(
          err instanceof Error ? err.message : 'No se pudo buscar el código del curso en la nube.'
        );
      } finally {
        setIsLookingUpCourse(false);
      }
    },
    [firebaseUser, ensureStudentSession, lookupCourseJoinCode]
  );

  // Auto-load course ONLY if arrived via teacher's QR link (?curso=...)
  React.useEffect(() => {
    if (useLocalFallback) {
      if (urlCourseJoinCode) {
        const matched = activeCourseTeacherLists.find(
          l => l.courseId.toUpperCase() === urlCourseJoinCode.toUpperCase()
        );
        if (matched) {
          setSelectedListKey(matched.key);
        }
      }
      return;
    }

    if (isCloudSignedIn && urlCourseJoinCode && autoLookedUpQrRef.current !== urlCourseJoinCode) {
      autoLookedUpQrRef.current = urlCourseJoinCode;
      setCourseCodeInput(urlCourseJoinCode);
      void handleLookupCourseCode(urlCourseJoinCode);
    }
  }, [isCloudSignedIn, useLocalFallback, urlCourseJoinCode, activeCourseTeacherLists, handleLookupCourseCode]);

  const handleChangeCourseCode = () => {
    setActiveCloudDirectory(null);
    setSelectedAccessCodeFromDir('');
    setNameSearchQuery('');
    setPin('');
    setErrorMessage('');
    if (urlCourseJoinCode) {
      clearUrlCourseJoinCode();
    }
    setCourseCodeInput('');
  };

  const cleanNameFilter = nameSearchQuery.trim().toLowerCase();

  const filteredCloudStudents = (activeCloudDirectory?.studentsPreview || []).filter(
    st => !cleanNameFilter || st.name.toLowerCase().includes(cleanNameFilter)
  );
  const filteredLocalStudents = courseStudents.filter(
    st => !cleanNameFilter || st.name.toLowerCase().includes(cleanNameFilter)
  );

  const handleCloudCourseSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLookupCourseCode(courseCodeInput);
  };

  const handleCloudListLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!activeCloudDirectory) {
      setErrorMessage('Primero ingresa y busca el Código del Curso de tu profesor(a).');
      return;
    }
    if (!selectedAccessCodeFromDir) {
      setErrorMessage('Busca y haz clic en tu nombre en el listado desplegable del curso.');
      return;
    }
    if (!pin.trim()) {
      setErrorMessage('Ingresa la clave / PIN entregada por tu docente.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await loginStudentCloudByAccessCode(
        selectedAccessCodeFromDir,
        pin,
        quizDirectCode,
        activeCloudDirectory.schoolName
      );
      if (!res.ok) {
        setErrorMessage(res.error || 'Clave incorrecta.');
        return;
      }
      onLoginSuccess();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      let friendly = raw;
      if (raw.startsWith('{') && raw.includes('"error"')) {
        try {
          const parsed = JSON.parse(raw) as { error?: string };
          if (parsed.error) friendly = parsed.error;
        } catch {
          // keep raw
        }
      }
      setErrorMessage(
        `No se pudo completar el ingreso en la nube (${friendly}). Intenta nuevamente o verifica con tu docente.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalListLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedStudentId) {
      setErrorMessage('Por favor selecciona tu nombre en la lista.');
      return;
    }
    if (!pin.trim()) {
      setErrorMessage('Debes ingresar tu clave / PIN de acceso.');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student || student.pin !== pin.trim()) {
      setErrorMessage('Clave incorrecta. Verifica con tu profesor(a).');
      return;
    }

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
    <div className="max-w-lg mx-auto my-1 sm:my-2 p-4 sm:p-5 tq-card border-2 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 mb-3 pb-2.5 border-b tq-border">
        <div className="w-11 h-11 rounded-xl bg-white p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
          <img
            src="/assets/aistudio/Logo_Mateclic___19_Nov_2026__11.16_am_fde2aa63.png"
            alt="Logo MateClic"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tq-text leading-tight">¡Hola estudiante!</h1>
          <p className="text-[11px] tq-text-muted font-medium truncate">
            Ingresa el Código de tu Curso (o QR), busca tu nombre e ingresa tu PIN
          </p>
        </div>
      </div>

      {/* QR Deep-Link Course Banner */}
      {urlCourseJoinCode && (
        <div className="mb-3 p-2.5 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50/90 dark:bg-indigo-950/50 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <QrCode className="w-4 h-4 text-indigo-700 dark:text-indigo-300 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-indigo-950 dark:text-indigo-100 block truncate">
                {activeCloudDirectory
                  ? `Curso QR: ${activeCloudDirectory.courseSection}`
                  : 'Cargando curso desde enlace QR...'}
              </span>
              <span className="text-[11px] text-indigo-800/85 dark:text-indigo-200/80 block truncate">
                Elige tu nombre e ingresa la clave entregada por tu docente.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleChangeCourseCode}
            className="p-1 rounded-lg hover:bg-indigo-200/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 cursor-pointer shrink-0"
            title="Usar otro código de curso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Automatic Cloud Connection Status (shown only while initializing or on connection error) */}
      {!useLocalFallback && !isCloudSignedIn && (
        <div className="mb-3 p-2.5 rounded-xl border tq-tint text-xs">
          {studentCloudError ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{studentCloudError}</span>
              </div>
              <button
                type="button"
                onClick={() => void ensureStudentSession()}
                className="px-3 py-1.5 tq-btn-primary rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reintentar conexión</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 tq-text-2 font-medium py-0.5">
              <Cloud className="w-4 h-4 tq-text-accent animate-pulse" />
              <span>Conectando con la nube de MateClic...</span>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-xl font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Course Code + Name + PIN Login */}
      {(isCloudSignedIn || useLocalFallback) && (
        useLocalFallback ? (
          activeCourseTeacherLists.length === 0 ? (
            <div key="st-no-local" className="p-3.5 tq-subtle border tq-border rounded-xl text-center text-xs tq-text-muted">
              Aún no hay listas de curso locales guardadas en este navegador.
            </div>
          ) : (
            <form key="st-local-form" onSubmit={handleLocalListLogin} className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-bold tq-text-2">
                    1. Selecciona tu Curso Local:
                  </label>
                  {selectedCourseObj && (
                    <span className="text-[10px] tq-text-muted font-semibold truncate">
                      Prof. {selectedTeacherObj?.name || selectedCourseObj.teacherName} (Local)
                    </span>
                  )}
                </div>
                <select
                  value={selectedListKey}
                  onChange={e => {
                    setSelectedListKey(e.target.value);
                    setSelectedStudentId('');
                    setNameSearchQuery('');
                    setPin('');
                    setErrorMessage('');
                  }}
                  className="w-full text-xs font-bold border rounded-xl px-3 py-2 tq-input focus:outline-hidden"
                >
                  {activeCourseTeacherLists.map(item => {
                    const c = courses.find(co => co.id === item.courseId);
                    const t = teachers.find(te => te.id === item.teacherId);
                    return (
                      <option key={item.key} value={item.key}>
                        {c?.section || item.courseId} · Prof. {t?.name || 'Docente'} ({item.count} al.)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tq-text-2">
                  2. Busca y selecciona tu Nombre:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 tq-text-muted absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={nameSearchQuery}
                      onChange={e => {
                        const q = e.target.value;
                        setNameSearchQuery(q);
                        setErrorMessage('');
                        const needle = q.trim().toLowerCase();
                        if (needle.length >= 2) {
                          const matches = courseStudents.filter(st =>
                            st.name.toLowerCase().includes(needle)
                          );
                          if (matches.length === 1) {
                            setSelectedStudentId(matches[0].id);
                          }
                        }
                      }}
                      placeholder="Filtrar nombre..."
                      className="w-full pl-8 pr-2.5 py-2 text-xs border rounded-xl tq-input focus:outline-hidden"
                    />
                  </div>
                  <select
                    value={selectedStudentId}
                    onChange={e => {
                      setSelectedStudentId(e.target.value);
                      setPin('');
                      setErrorMessage('');
                    }}
                    className="w-full text-xs font-bold border rounded-xl px-2.5 py-2 tq-input focus:outline-hidden"
                  >
                    <option value="">
                      {filteredLocalStudents.length === 0
                        ? '-- Sin coincidencias --'
                        : '-- Elige tu nombre --'}
                    </option>
                    {filteredLocalStudents.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
                {cleanNameFilter.length >= 1 && (
                  <span className="text-[11px] tq-text-muted block">
                    {filteredLocalStudents.length === 1
                      ? `1 coincidencia: ${filteredLocalStudents[0].name}`
                      : `${filteredLocalStudents.length} coincidencias`}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold tq-text-2 mb-1">
                    3. Clave / PIN:
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={16}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      autoComplete="off"
                      className="w-full text-center text-base font-mono font-bold tracking-widest border rounded-xl py-2 pl-3 pr-9 tq-input focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(prev => !prev)}
                      className="absolute right-2.5 top-2.5 tq-text-muted hover:tq-text p-0.5 cursor-pointer"
                      title={showPin ? 'Ocultar clave' : 'Ver clave ingresada'}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-bold tq-text-2 mb-1">
                    <FileText className="w-3.5 h-3.5 tq-text-accent shrink-0" />
                    <span className="truncate">4. Cód. Prueba (Opcional):</span>
                  </label>
                  <input
                    type="text"
                    value={quizDirectCode}
                    onChange={e => setQuizDirectCode(e.target.value)}
                    placeholder="Ej: QUIZ-701"
                    className="w-full font-mono text-xs border rounded-xl px-3 py-2.5 tq-input uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 tq-btn-gradient font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Entrar a Mis Evaluaciones</span>
              </button>
            </form>
          )
        ) : !activeCloudDirectory ? (
          <form key="st-cloud-code-form" onSubmit={handleCloudCourseSearchSubmit} className="space-y-3">
            <div className="p-3.5 tq-tint border border-[var(--tq-border-strong)] rounded-2xl space-y-2.5">
              <div>
                <label className="block text-xs font-bold tq-text mb-1">
                  1. Ingresa el Código del Curso:
                </label>
                <p className="text-[11px] tq-text-muted leading-snug">
                  Cada curso de Chile tiene su propio código privado. Pídeselo a tu profesor(a) o escanea el QR de tu sala.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={courseCodeInput}
                  onChange={e => {
                    setCourseCodeInput(e.target.value.toUpperCase());
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Ej: MC-7A-12AB34"
                  autoComplete="off"
                  className="flex-1 font-mono font-bold text-sm uppercase tracking-wider border-2 rounded-xl px-3 py-2.5 tq-input focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isLookingUpCourse || !courseCodeInput.trim()}
                  className="px-4 py-2.5 tq-btn-gradient disabled:opacity-50 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {isLookingUpCourse ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>{isLookingUpCourse ? 'Buscando...' : 'Buscar Curso'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form key="st-cloud-form" onSubmit={handleCloudListLogin} className="space-y-2.5">
            {/* Active Course Confirmation Card */}
            <div className="p-2.5 tq-tint border border-[var(--tq-border-strong)] rounded-xl flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg tq-brand-badge border flex items-center justify-center shrink-0">
                  <School className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black tq-text truncate">
                    {activeCloudDirectory.courseSection} · Prof. {activeCloudDirectory.teacherName}
                  </div>
                  <div className="text-[11px] tq-text-muted truncate flex items-center gap-1.5">
                    {activeCloudDirectory.schoolName &&
                      activeCloudDirectory.schoolName !== 'Mi Establecimiento' && (
                        <>
                          <span className="truncate">{activeCloudDirectory.schoolName}</span>
                          <span>·</span>
                        </>
                      )}
                    <span className="font-mono font-bold tq-text-accent">
                      {activeCloudDirectory.joinCode}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleChangeCourseCode}
                className="px-2.5 py-1 tq-card border tq-border rounded-lg text-[11px] font-bold tq-text-accent hover:opacity-85 shrink-0 cursor-pointer"
              >
                Cambiar curso
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold tq-text-2">
                  2. Busca y selecciona tu Nombre:
                </label>
                <span className="text-[10px] tq-text-muted font-mono">
                  {activeCloudDirectory.studentsPreview.length} alumnos
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 tq-text-muted absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={nameSearchQuery}
                    onChange={e => {
                      const q = e.target.value;
                      setNameSearchQuery(q);
                      setErrorMessage('');
                      const needle = q.trim().toLowerCase();
                      if (needle.length >= 2) {
                        const matches = (activeCloudDirectory.studentsPreview || []).filter(st =>
                          st.name.toLowerCase().includes(needle)
                        );
                        if (matches.length === 1) {
                          setSelectedAccessCodeFromDir(matches[0].accessCode);
                        }
                      }
                    }}
                    placeholder="Filtrar nombre..."
                    className="w-full pl-8 pr-2.5 py-2 text-xs border rounded-xl tq-input focus:outline-hidden"
                  />
                </div>
                <select
                  value={selectedAccessCodeFromDir}
                  onChange={e => {
                    setSelectedAccessCodeFromDir(e.target.value);
                    setPin('');
                    setErrorMessage('');
                  }}
                  className="w-full text-xs font-bold border rounded-xl px-2.5 py-2 tq-input focus:outline-hidden"
                >
                  <option value="">
                    {filteredCloudStudents.length === 0
                      ? '-- Sin coincidencias --'
                      : '-- Elige tu nombre --'}
                  </option>
                  {filteredCloudStudents.map(st => (
                    <option key={st.studentId} value={st.accessCode}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
              {cleanNameFilter.length >= 1 && (
                <span className="text-[11px] tq-text-muted block">
                  {filteredCloudStudents.length === 1
                    ? `1 coincidencia: ${filteredCloudStudents[0].name}`
                    : `${filteredCloudStudents.length} coincidencias`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  3. Clave / PIN:
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={16}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    autoComplete="off"
                    className="w-full text-center text-base font-mono font-bold tracking-widest border rounded-xl py-2 pl-3 pr-9 tq-input focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(prev => !prev)}
                    className="absolute right-2.5 top-2.5 tq-text-muted hover:tq-text p-0.5 cursor-pointer"
                    title={showPin ? 'Ocultar clave' : 'Ver clave ingresada'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-bold tq-text-2 mb-1">
                  <FileText className="w-3.5 h-3.5 tq-text-accent shrink-0" />
                  <span className="truncate">4. Cód. Prueba (Opcional):</span>
                </label>
                <input
                  type="text"
                  value={quizDirectCode}
                  onChange={e => setQuizDirectCode(e.target.value)}
                  placeholder="Ej: QUIZ-701"
                  className="w-full font-mono text-xs border rounded-xl px-3 py-2.5 tq-input uppercase focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 tq-btn-gradient disabled:opacity-50 font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Verificando...' : 'Entrar a Mis Evaluaciones'}</span>
            </button>
          </form>
        )
      )}

      {/* Subtle Local Demo Toggle + Theme Palette + Bottom Links */}
      <div className="mt-3 pt-2.5 border-t tq-border space-y-2.5">
        <ThemePaletteSelector
          variant="inline-bar"
          title="Paleta"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <button
            type="button"
            onClick={() => setRole('practice')}
            className="px-3 py-1.5 tq-tint border rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5 tq-text-accent" />
            <span className="tq-text">Práctica Libre (sin sesión)</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('teacher')}
            className="text-[11px] font-bold tq-text-accent hover:opacity-80 transition-opacity inline-flex items-center gap-1 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Acceso Docentes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUseLocalFallback(prev => !prev);
              setErrorMessage('');
            }}
            className="text-[11px] tq-text-muted hover:tq-text underline cursor-pointer"
          >
            {useLocalFallback ? 'Volver a Nube' : 'Modo demo local'}
          </button>
        </div>
      </div>
    </div>
  );
};
