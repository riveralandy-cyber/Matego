import React, { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  KeyRound,
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
    listAvailableCourseDirectories,
    lookupCourseJoinCode,
    loginStudentCloudByAccessCode,
    setCurrentStudent,
    setActiveQuizTaking,
    setRole,
    urlCourseJoinCode,
    clearUrlCourseJoinCode,
  } = useApp();

  // Build unique (courseId, teacherId) lists for local demo fallback
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

  // Cloud available courses directory state
  const [availableDirectories, setAvailableDirectories] = useState<CourseJoinCodeDirectory[]>([]);
  const [selectedJoinCode, setSelectedJoinCode] = useState<string>('');
  const [selectedAccessCodeFromDir, setSelectedAccessCodeFromDir] = useState<string>('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
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

  const loadCloudCourses = useCallback(async () => {
    if (!isCloudSignedIn || useLocalFallback) return;
    setIsLoadingCourses(true);
    try {
      const list = await listAvailableCourseDirectories();
      let mergedList = list;

      if (urlCourseJoinCode && autoLookedUpQrRef.current !== urlCourseJoinCode) {
        autoLookedUpQrRef.current = urlCourseJoinCode;
        const qrRes = await lookupCourseJoinCode(urlCourseJoinCode);
        if (qrRes.ok && qrRes.directory) {
          const qrDir = qrRes.directory;
          if (!mergedList.some(d => d.joinCode === qrDir.joinCode)) {
            mergedList = [qrDir, ...mergedList];
          }
          setSelectedJoinCode(qrDir.joinCode);
          setSelectedAccessCodeFromDir('');
        } else if (qrRes.error) {
          setErrorMessage(qrRes.error);
        }
      }

      setAvailableDirectories(mergedList);

      if (!urlCourseJoinCode) {
        setSelectedJoinCode(prev => {
          if (prev && mergedList.some(d => d.joinCode === prev)) return prev;
          return mergedList.length === 1 ? mergedList[0].joinCode : '';
        });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudieron cargar las listas de cursos disponibles.'
      );
    } finally {
      setIsLoadingCourses(false);
    }
  }, [isCloudSignedIn, useLocalFallback, listAvailableCourseDirectories, lookupCourseJoinCode, urlCourseJoinCode]);

  // Auto-load course lists when cloud session is ready
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

    if (isCloudSignedIn) {
      void loadCloudCourses();
    }
  }, [isCloudSignedIn, useLocalFallback, urlCourseJoinCode, activeCourseTeacherLists, loadCloudCourses]);

  const activeCloudDirectory = availableDirectories.find(d => d.joinCode === selectedJoinCode) || null;
  const cleanNameFilter = nameSearchQuery.trim().toLowerCase();

  const filteredCloudStudents = (activeCloudDirectory?.studentsPreview || []).filter(
    st => !cleanNameFilter || st.name.toLowerCase().includes(cleanNameFilter)
  );
  const filteredLocalStudents = courseStudents.filter(
    st => !cleanNameFilter || st.name.toLowerCase().includes(cleanNameFilter)
  );

  const handleCloudListLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedJoinCode) {
      setErrorMessage('Primero selecciona tu curso de la lista.');
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
        quizDirectCode
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
        <div className="w-10 h-10 tq-brand-badge border rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
          <KeyRound className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tq-text leading-tight">¡Hola estudiante!</h1>
          <p className="text-[11px] tq-text-muted font-medium truncate">
            Elige tu curso, busca tu nombre e ingresa tu clave (sin correo)
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
                  : 'Ingresando desde enlace QR del curso'}
              </span>
              <span className="text-[11px] text-indigo-800/85 dark:text-indigo-200/80 block truncate">
                Elige tu nombre e ingresa la clave entregada por tu docente.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={clearUrlCourseJoinCode}
            className="p-1 rounded-lg hover:bg-indigo-200/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 cursor-pointer shrink-0"
            title="Limpiar enlace QR"
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

      {/* Unified Course List + Name + Password + Optional Quiz Code Login */}
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
                    1. Selecciona tu Curso:
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
        ) : (
          <form key="st-cloud-form" onSubmit={handleCloudListLogin} className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-xs font-bold tq-text-2">
                  1. Selecciona tu Curso:
                </label>
                <button
                  type="button"
                  onClick={() => void loadCloudCourses()}
                  disabled={isLoadingCourses}
                  className="text-[11px] font-bold tq-text-accent hover:opacity-80 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingCourses ? 'animate-spin' : ''}`} />
                  <span>{isLoadingCourses ? 'Actualizando...' : 'Actualizar'}</span>
                </button>
              </div>

              {isLoadingCourses && availableDirectories.length === 0 ? (
                <div className="p-2.5 tq-subtle border tq-border rounded-xl text-xs tq-text-muted text-center">
                  Cargando listas de cursos disponibles...
                </div>
              ) : availableDirectories.length === 0 ? (
                <div className="p-3 tq-subtle border tq-border rounded-xl text-xs tq-text-muted text-center space-y-0.5">
                  <p className="font-bold tq-text">No hay listas de curso disponibles aún</p>
                  <p className="text-[11px]">
                    Pídele a tu profesor(a) que cargue la lista de tu curso desde su Panel Profesor.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedJoinCode}
                  onChange={e => {
                    setSelectedJoinCode(e.target.value);
                    setSelectedAccessCodeFromDir('');
                    setNameSearchQuery('');
                    setPin('');
                    setErrorMessage('');
                  }}
                  className="w-full text-xs font-bold border rounded-xl px-3 py-2 tq-input focus:outline-hidden"
                >
                  <option value="">-- Elige tu curso de la lista --</option>
                  {availableDirectories.map(dir => (
                    <option key={dir.joinCode} value={dir.joinCode}>
                      {dir.courseSection} · Prof. {dir.teacherName} ({dir.studentsPreview.length} al.)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {activeCloudDirectory && (
              <>
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
              </>
            )}
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
