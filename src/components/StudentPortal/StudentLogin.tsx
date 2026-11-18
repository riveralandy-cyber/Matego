import React, { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  KeyRound,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  PlayCircle,
  Cloud,
  CheckCircle2,
  Search,
  RefreshCw,
  QrCode,
  X,
  LogOut,
  FileText,
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
    linkedCloudStudentSeats,
    connectStudentWithGoogle,
    disconnectGoogleAccount,
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

  const isCloudSignedIn = Boolean(isAuthReady && firebaseUser && firebaseUser.emailVerified);

  const loadCloudCourses = useCallback(async () => {
    if (!isCloudSignedIn || useLocalFallback) return;
    setIsLoadingCourses(true);
    setErrorMessage('');
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

  // Auto-load course lists when Google account is connected
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

  const handleConnectGoogle = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await connectStudentWithGoogle();
      if (!res.ok) {
        setErrorMessage(res.error || 'No se pudo conectar la cuenta Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await disconnectGoogleAccount();
      setAvailableDirectories([]);
      setSelectedJoinCode('');
      setSelectedAccessCodeFromDir('');
      setNameSearchQuery('');
      setPin('');
      autoLookedUpQrRef.current = null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloudListLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedJoinCode) {
      setErrorMessage('Primero selecciona tu curso de la lista.');
      return;
    }
    if (!selectedAccessCodeFromDir) {
      setErrorMessage('Busca y selecciona tu nombre de la lista del curso.');
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
    <div className="max-w-md mx-auto my-8 p-7 tq-card border-2 rounded-3xl shadow-sm">
      <div className="text-center mb-5">
        <div className="w-14 h-14 tq-brand-badge border rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tq-text">¡Hola estudiante!</h1>
        <p className="text-xs tq-text-muted mt-1 font-medium">
          Escuela Ricardo Silva Arriagada · Elige tu curso, busca tu nombre e ingresa tu clave
        </p>
      </div>

      {/* QR Deep-Link Course Banner */}
      {urlCourseJoinCode && (
        <div className="mb-4 p-3 rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50/90 dark:bg-indigo-950/50 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <QrCode className="w-4 h-4 text-indigo-700 dark:text-indigo-300 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-indigo-950 dark:text-indigo-100 block truncate">
                {activeCloudDirectory
                  ? `Curso cargado desde QR: ${activeCloudDirectory.courseSection}`
                  : 'Ingresando desde enlace QR del curso'}
              </span>
              <span className="text-[11px] text-indigo-800/85 dark:text-indigo-200/80 block">
                {isCloudSignedIn
                  ? 'Elige tu nombre de la lista e ingresa tu clave entregada por el docente.'
                  : 'Conecta tu cuenta Google abajo para cargar la lista de tu curso.'}
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

      {/* Step 1: Google Cloud Connection Bar */}
      {!useLocalFallback && (
        <div className="mb-5 p-3.5 rounded-2xl border tq-tint">
          {!isCloudSignedIn ? (
            <div className="space-y-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold tq-text">
                <Cloud className="w-4 h-4 tq-text-accent" />
                <span>Paso 1: Conecta tu cuenta Google</span>
              </div>
              <p className="text-[11px] tq-text-2 leading-relaxed">
                Necesario para ver la lista de tu curso, recibir tus evaluaciones actualizadas y guardar tus notas en la nube.
              </p>
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 tq-btn-gradient rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Cloud className="w-4 h-4" />
                <span>{isSubmitting ? 'Conectando...' : 'Conectar con Google'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
                    Conectado a la nube
                  </span>
                  <span className="font-bold tq-text truncate block">
                    {firebaseUser?.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 tq-card border rounded-lg text-[11px] font-bold tq-text-accent flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Usar otro correo Google"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Cambiar</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Cerrar sesión de este correo Google"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Returning Student Linked Seats Quick Access */}
      {isCloudSignedIn && !useLocalFallback && linkedCloudStudentSeats.length > 0 && (
        <div className="mb-5 p-3.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 space-y-2">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200 block">
            Cuenta vinculada detectada · Ingreso rápido:
          </span>
          {linkedCloudStudentSeats.map(seat => {
            const c = courses.find(co => co.id === seat.courseId);
            return (
              <button
                key={`${seat.ownerUid}_${seat.id}`}
                type="button"
                onClick={() => {
                  setCurrentStudent(seat);
                  onLoginSuccess();
                }}
                className="w-full p-2.5 tq-card border rounded-xl flex items-center justify-between text-left hover:border-emerald-400 transition-all cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold tq-text block">{seat.name}</span>
                  <span className="text-[11px] tq-text-muted">
                    {c?.section || seat.courseId}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg tq-btn-primary text-[11px] font-bold flex items-center gap-1">
                  <span>Entrar</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-xl font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Unified Course List + Name + Password + Optional Quiz Code Login */}
      {(isCloudSignedIn || useLocalFallback) && (
        useLocalFallback ? (
          activeCourseTeacherLists.length === 0 ? (
            <div className="p-4 tq-subtle border tq-border rounded-2xl text-center text-xs tq-text-muted">
              Aún no hay listas de curso locales guardadas en este navegador.
            </div>
          ) : (
            <form onSubmit={handleLocalListLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  1. Selecciona tu Curso:
                </label>
                <select
                  value={selectedListKey}
                  onChange={e => {
                    setSelectedListKey(e.target.value);
                    setSelectedStudentId('');
                    setNameSearchQuery('');
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
                        {c?.section || item.courseId} · Prof. {t?.name || 'Docente'} ({item.count} al.)
                      </option>
                    );
                  })}
                </select>

                {selectedCourseObj && (
                  <div className="mt-2 p-2.5 tq-tint border rounded-2xl flex items-center justify-between text-xs">
                    <span className="font-bold tq-text">
                      Prof. {selectedTeacherObj?.name || selectedCourseObj.teacherName}
                    </span>
                    <span className="text-[10px] tq-text-muted font-medium">Modo Local</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold tq-text-2">
                  2. Busca y selecciona tu Nombre:
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 tq-text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={nameSearchQuery}
                    onChange={e => {
                      setNameSearchQuery(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Escribir nombre o apellido para filtrar..."
                    className="w-full pl-8 pr-3 py-2 text-xs border rounded-xl tq-input focus:outline-hidden"
                  />
                </div>
                <select
                  value={selectedStudentId}
                  onChange={e => {
                    setSelectedStudentId(e.target.value);
                    setPin('');
                    setErrorMessage('');
                  }}
                  className="w-full text-xs font-bold border rounded-xl p-3 tq-input focus:outline-hidden"
                >
                  <option value="">
                    {filteredLocalStudents.length === 0
                      ? '-- No se encontraron nombres con ese filtro --'
                      : '-- Elige tu nombre de la lista --'}
                  </option>
                  {filteredLocalStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold tq-text-2 mb-1">
                  3. Clave de Acceso (entregada por tu docente):
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={16}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoComplete="off"
                  className="w-full text-center text-xl font-mono font-bold tracking-widest border rounded-xl p-3 tq-input focus:outline-hidden"
                />
                <span className="text-[11px] tq-text-muted mt-1 block">
                  Ingresa tu clave de 4 dígitos. Una vez dentro, podrás cambiarla por una clave personal.
                </span>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold tq-text-2 mb-1">
                  <FileText className="w-3.5 h-3.5 tq-text-accent" />
                  <span>4. Código de Evaluación (Opcional):</span>
                </label>
                <input
                  type="text"
                  value={quizDirectCode}
                  onChange={e => setQuizDirectCode(e.target.value)}
                  placeholder="Ej: QUIZ-701"
                  className="w-full font-mono text-xs border rounded-xl p-2.5 tq-input uppercase focus:outline-hidden"
                />
                <span className="text-[11px] tq-text-muted mt-1 block">
                  Si tu profesor(a) te dio un código directo de prueba, ingrésalo aquí para abrirla al instante.
                </span>
              </div>

              <button
                type="submit"
                disabled={!selectedStudentId || !pin.trim()}
                className="w-full py-3 tq-btn-gradient disabled:opacity-40 font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Entrar a Mis Evaluaciones</span>
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleCloudListLogin} className="space-y-4">
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
                  <span>{isLoadingCourses ? 'Actualizando...' : 'Actualizar cursos'}</span>
                </button>
              </div>

              {isLoadingCourses && availableDirectories.length === 0 ? (
                <div className="p-3 tq-subtle border tq-border rounded-xl text-xs tq-text-muted text-center">
                  Cargando listas de cursos disponibles...
                </div>
              ) : availableDirectories.length === 0 ? (
                <div className="p-3.5 tq-subtle border tq-border rounded-xl text-xs tq-text-muted text-center space-y-1">
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
                  className="w-full text-xs font-bold border rounded-xl p-3 tq-input focus:outline-hidden"
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
                <div className="p-2.5 tq-tint border rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold tq-text">
                    {activeCloudDirectory.courseSection} · Prof. {activeCloudDirectory.teacherName}
                  </span>
                  <span className="text-[10px] tq-text-muted font-mono">
                    {activeCloudDirectory.studentsPreview.length} al.
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold tq-text-2">
                    2. Busca y selecciona tu Nombre:
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 tq-text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={nameSearchQuery}
                      onChange={e => {
                        setNameSearchQuery(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Escribir nombre o apellido para filtrar..."
                      className="w-full pl-8 pr-3 py-2 text-xs border rounded-xl tq-input focus:outline-hidden"
                    />
                  </div>
                  <select
                    value={selectedAccessCodeFromDir}
                    onChange={e => {
                      setSelectedAccessCodeFromDir(e.target.value);
                      setPin('');
                      setErrorMessage('');
                    }}
                    className="w-full text-xs font-bold border rounded-xl p-3 tq-input focus:outline-hidden"
                  >
                    <option value="">
                      {filteredCloudStudents.length === 0
                        ? '-- No se encontraron nombres con ese filtro --'
                        : '-- Elige tu nombre de la lista --'}
                    </option>
                    {filteredCloudStudents.map(st => (
                      <option key={st.studentId} value={st.accessCode}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold tq-text-2 mb-1">
                    3. Clave de Acceso (entregada por tu docente):
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={16}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    autoComplete="off"
                    className="w-full text-center text-xl font-mono font-bold tracking-widest border rounded-xl p-3 tq-input focus:outline-hidden"
                  />
                  <span className="text-[11px] tq-text-muted mt-1 block">
                    Ingresa tu clave de 4 dígitos. Una vez dentro, podrás cambiarla por una clave personal.
                  </span>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold tq-text-2 mb-1">
                    <FileText className="w-3.5 h-3.5 tq-text-accent" />
                    <span>4. Código de Evaluación (Opcional):</span>
                  </label>
                  <input
                    type="text"
                    value={quizDirectCode}
                    onChange={e => setQuizDirectCode(e.target.value)}
                    placeholder="Ej: QUIZ-701"
                    className="w-full font-mono text-xs border rounded-xl p-2.5 tq-input uppercase focus:outline-hidden"
                  />
                  <span className="text-[11px] tq-text-muted mt-1 block">
                    Si tu profesor(a) te dio un código directo de prueba, ingrésalo aquí para abrirla al instante.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedAccessCodeFromDir || !pin.trim()}
                  className="w-full py-3 tq-btn-gradient disabled:opacity-40 font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verificando...' : 'Entrar a Mis Evaluaciones'}</span>
                </button>
              </>
            )}
          </form>
        )
      )}

      {/* Subtle Local Demo Toggle for single-device offline testing */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setUseLocalFallback(prev => !prev);
            setErrorMessage('');
          }}
          className="text-[11px] tq-text-muted hover:tq-text underline cursor-pointer"
        >
          {useLocalFallback
            ? 'Volver al acceso en la nube (Google)'
            : 'Usar en modo demo local (sin Google ni sincronización)'}
        </button>
      </div>

      {/* Theme Palette Configurator right from Student Entry */}
      <div className="mt-5">
        <ThemePaletteSelector
          variant="compact"
          title="Paleta de colores"
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
