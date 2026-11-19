import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  User,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Course, Student, QuizAssignment, QuizAttempt, Teacher, TeacherTab, ThemePaletteId } from '../types';
import { INITIAL_COURSES, INITIAL_STUDENTS, INITIAL_ASSIGNMENTS, INITIAL_ATTEMPTS } from '../data/initialData';
import { calculateChileanGrade, getMineducPerformanceLevel } from '../utils/chileanGrades';
import {
  DEFAULT_THEME_ID,
  StoredThemePreferences,
  loadStoredThemePreferences,
  saveStoredThemePreferences,
  applyThemeToDocument,
} from '../utils/themes';
import { auth, googleProvider, makeAssignmentDocId, makeCourseJoinCode } from '../firebase';
import {
  CloudTeacherProfile,
  addQuizAssignmentCloud,
  addStudentsCloud,
  backfillStudentUidOnAttemptsCloud,
  claimStudentWithAccessCodeCloud,
  clearAllTeacherCloudData,
  CourseJoinCodeDirectory,
  deleteQuizAssignmentCloud,
  deleteQuizAttemptsCloud,
  deleteTeacherProfileAndDataCloud,
  ensureTeacherProfileCloud,
  listAllCloudTeachers,
  listAvailableCourseDirectoriesCloud,
  lookupCourseJoinCodeCloud,
  recordQuizAttemptCloud,
  removeStudentsCloud,
  seedTeacherWorkspaceCloud,
  subscribeStudentCourseAndAttemptsCloud,
  subscribeTeacherWorkspaceCloud,
  unlinkStudentGoogleCloud,
  updateQuizAttemptGradeCloud,
  updateStudentNameCloud,
  updateStudentPinCloud,
  updateTeacherThemeCloud,
} from '../services/cloudSync';

export const DEFAULT_INITIAL_TEACHER_PASSWORD = '1234';

export const DEFAULT_TEACHERS: Teacher[] = [];

export const EMPTY_TEACHER: Teacher = {
  id: '',
  name: '',
  email: '',
  schoolName: 'Escuela Ricardo Silva Arriagada',
  commune: 'SLEP Chinchorro · Arica',
  rbd: '102-4',
};

export interface AuthActionResult {
  ok: boolean;
  error?: string;
}

export type CloudSyncStatus = 'local' | 'connecting' | 'synced' | 'error';

interface AppContextType {
  role: 'teacher' | 'student' | 'practice';
  setRole: (role: 'teacher' | 'student' | 'practice') => void;
  activeTeacherTab: TeacherTab;
  setActiveTeacherTab: (tab: TeacherTab) => void;

  // Firebase Auth & Cloud Sync state
  firebaseUser: User | null;
  isAuthReady: boolean;
  isCloudTeacher: boolean;
  isAdminTeacher: boolean;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncMessage: string | null;
  studentCloudError: string | null;
  ensureStudentSession: () => Promise<AuthActionResult>;
  logoutStudent: () => void;
  loginTeacherWithGoogle: () => Promise<AuthActionResult>;
  disconnectGoogleAccount: () => Promise<void>;
  listAvailableCourseDirectories: () => Promise<CourseJoinCodeDirectory[]>;
  lookupCourseJoinCode: (joinCode: string) => Promise<{ ok: boolean; directory?: CourseJoinCodeDirectory; error?: string }>;
  loginStudentCloudByAccessCode: (accessCode: string, pin: string, quizDirectCode?: string) => Promise<AuthActionResult>;
  unlinkStudentGoogleAccount: (studentId: string) => void;
  getCourseJoinCode: (courseId: string) => string | null;
  urlCourseJoinCode: string | null;
  clearUrlCourseJoinCode: () => void;

  // Teacher session & authentication
  teachers: Teacher[];
  currentTeacher: Teacher;
  isTeacherAuthenticated: boolean;
  isTeacherLoginModalOpen: boolean;
  setIsTeacherLoginModalOpen: (open: boolean) => void;
  loginTeacher: (teacherIdOrIdentifier: string, password: string) => AuthActionResult;
  registerTeacher: (name: string, password: string, email?: string) => AuthActionResult;
  logoutTeacher: () => void;
  updateTeacherPassword: (currentPassword: string, newPassword: string) => AuthActionResult;
  deleteOwnTeacherAccount: () => Promise<AuthActionResult>;
  listCloudTeachersForAdmin: () => Promise<CloudTeacherProfile[]>;
  deleteTeacherAccountAsAdmin: (targetTeacherId: string, isCloud: boolean) => Promise<AuthActionResult>;

  courses: Course[];
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  selectedCourse: Course | undefined;

  // Global collections (used by Student Portal & cross-teacher uniqueness checks)
  students: Student[];
  assignments: QuizAssignment[];
  attempts: QuizAttempt[];

  // Strictly scoped to currentTeacher (used by Teacher Dashboard)
  teacherStudents: Student[];
  teacherAssignments: QuizAssignment[];
  teacherAttempts: QuizAttempt[];

  // Curricular OA selected for quiz creation
  activeOAForCreation: string | null;
  setActiveOAForCreation: (oaCode: string | null) => void;

  // Student portal state
  currentStudent: Student | null;
  setCurrentStudent: React.Dispatch<React.SetStateAction<Student | null>>;
  activeQuizTaking: QuizAssignment | null;
  setActiveQuizTaking: (quiz: QuizAssignment | null) => void;
  latestCompletedAttempt: QuizAttempt | null;
  setLatestCompletedAttempt: (attempt: QuizAttempt | null) => void;

  // Theme & Palette Configuration
  activeTheme: ThemePaletteId;
  setThemePreference: (themeId: ThemePaletteId) => void;

  // Actions
  addStudentsToCourse: (courseId: string, rawText: string) => number;
  updateStudentName: (studentId: string, newName: string) => AuthActionResult;
  removeStudentFromCourse: (studentId: string) => void;
  clearCourseStudentsForTeacher: (courseId: string) => void;
  addQuizAssignment: (assignment: QuizAssignment) => void;
  deleteQuizAssignment: (id: string) => void;
  recordQuizAttempt: (attempt: QuizAttempt) => void;
  updateQuizAttemptGrade: (attemptId: string, updates: { chileanGrade?: number; percentage?: number }) => void;
  deleteQuizAttempt: (attemptId: string) => void;
  deleteQuizAttempts: (attemptIds: string[]) => void;
  resetDemoData: () => void;
  clearTeacherWorkspaceAll: () => Promise<void>;
  startQuizAsStudent: (quizId: string, studentId: string) => void;
  updateStudentPin: (studentId: string, newPin: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'thatquiz_chile_v2_';
const SESSION_AUTH_KEY = 'thatquiz_chile_teacher_auth_session_v2';
const CLOUD_TEACHER_UID_KEY = 'thatquiz_chile_cloud_teacher_uid';

function parseQrParamsFromUrl(): { initialRole: 'teacher' | 'student' | 'practice'; courseJoinCode: string | null } {
  if (typeof window === 'undefined') {
    return { initialRole: 'teacher', courseJoinCode: null };
  }
  const params = new URLSearchParams(window.location.search);
  const rawCurso = (params.get('curso') || params.get('join') || '').trim();
  const rawRol = (params.get('rol') || '').trim().toLowerCase();
  if (rawCurso) {
    return { initialRole: 'student', courseJoinCode: rawCurso.toUpperCase() };
  }
  if (rawRol === 'estudiante' || rawRol === 'student') {
    return { initialRole: 'student', courseJoinCode: null };
  }
  if (rawRol === 'practica' || rawRol === 'practice') {
    return { initialRole: 'practice', courseJoinCode: null };
  }
  return { initialRole: 'teacher', courseJoinCode: null };
}

function normalizeTeacherRecord(t: Teacher): Teacher {
  return {
    ...t,
    password: t.password || DEFAULT_INITIAL_TEACHER_PASSWORD,
    hasCustomPassword: typeof t.hasCustomPassword === 'boolean' ? t.hasCustomPassword : false,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialUrlState = useMemo(() => parseQrParamsFromUrl(), []);
  const [role, setRole] = useState<'teacher' | 'student' | 'practice'>(initialUrlState.initialRole);
  const [urlCourseJoinCode, setUrlCourseJoinCode] = useState<string | null>(initialUrlState.courseJoinCode);
  const [activeTeacherTab, setActiveTeacherTab] = useState<TeacherTab>('matrix');
  const [activeOAForCreation, setActiveOAForCreation] = useState<string | null>(null);

  // Firebase Auth & Cloud Sync state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [cloudTeacherUid, setCloudTeacherUid] = useState<string | null>(() =>
    localStorage.getItem(CLOUD_TEACHER_UID_KEY)
  );
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('local');
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);
  const [fatalCloudError, setFatalCloudError] = useState<Error | null>(null);

  // Cloud teacher workspace collections
  const [cloudTeacherStudents, setCloudTeacherStudents] = useState<Student[]>([]);
  const [cloudTeacherAssignments, setCloudTeacherAssignments] = useState<QuizAssignment[]>([]);
  const [cloudTeacherAttempts, setCloudTeacherAttempts] = useState<QuizAttempt[]>([]);

  // Cloud student collections
  const [cloudStudentAssignments, setCloudStudentAssignments] = useState<QuizAssignment[]>([]);
  const [cloudStudentAttempts, setCloudStudentAttempts] = useState<QuizAttempt[]>([]);
  const [pendingDirectQuizCode, setPendingDirectQuizCode] = useState<string | null>(null);
  const [studentCloudError, setStudentCloudError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}teachers`);
    if (saved) {
      const parsed: Teacher[] = JSON.parse(saved);
      return parsed.map(normalizeTeacherRecord);
    }
    return DEFAULT_TEACHERS;
  });

  const [currentTeacher, setCurrentTeacher] = useState<Teacher>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_teacher`);
    if (saved) {
      return normalizeTeacherRecord(JSON.parse(saved));
    }
    return EMPTY_TEACHER;
  });

  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  });

  const [isTeacherLoginModalOpen, setIsTeacherLoginModalOpen] = useState(false);

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}courses`);
    if (saved) return JSON.parse(saved);
    return INITIAL_COURSES;
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}selected_course`);
    return saved || 'course-7a';
  });

  const [localStudents, setLocalStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}students`);
    if (saved) {
      return JSON.parse(saved) as Student[];
    }
    return INITIAL_STUDENTS;
  });

  const [localAssignments, setLocalAssignments] = useState<QuizAssignment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}assignments`);
    if (saved) {
      return JSON.parse(saved) as QuizAssignment[];
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [localAttempts, setLocalAttempts] = useState<QuizAttempt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}attempts`);
    if (saved) {
      return JSON.parse(saved) as QuizAttempt[];
    }
    return INITIAL_ATTEMPTS;
  });

  const [currentStudent, setCurrentStudentState] = useState<Student | null>(null);
  const [activeQuizTaking, setActiveQuizTaking] = useState<QuizAssignment | null>(null);
  const [latestCompletedAttempt, setLatestCompletedAttempt] = useState<QuizAttempt | null>(null);

  // Per-user & guest palette preferences (defaults to 'estandar')
  const [themePrefs, setThemePrefs] = useState<StoredThemePreferences>(() => loadStoredThemePreferences());
  const [pendingEntryTheme, setPendingEntryTheme] = useState<ThemePaletteId | null>(null);

  const reportCloudError = (err: unknown) => {
    const wrapped = err instanceof Error ? err : new Error(String(err));
    setCloudSyncStatus('error');
    setCloudSyncMessage(wrapped.message);
    setFatalCloudError(wrapped);
  };

  if (fatalCloudError) {
    throw fatalCloudError;
  }

  const isCloudTeacher = Boolean(
    isAuthReady &&
      firebaseUser &&
      firebaseUser.emailVerified &&
      isTeacherAuthenticated &&
      cloudTeacherUid === firebaseUser.uid
  );

  const isAdminTeacher = Boolean(
    isCloudTeacher &&
      firebaseUser?.emailVerified &&
      firebaseUser.email?.toLowerCase() === 'riveralandy@gmail.com'
  );

  const isCloudStudent = Boolean(
    role === 'student' &&
      isAuthReady &&
      firebaseUser &&
      currentStudent?.ownerUid
  );

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      setIsAuthReady(true);

      const savedTeacherUid = localStorage.getItem(CLOUD_TEACHER_UID_KEY);
      if (user && user.emailVerified && savedTeacherUid === user.uid) {
        setCloudTeacherUid(user.uid);
        setCurrentTeacher({
          id: user.uid,
          uid: user.uid,
          name: user.displayName || 'Docente',
          email: user.email || '',
          schoolName: 'Escuela Ricardo Silva Arriagada',
          commune: 'SLEP Chinchorro · Arica',
          rbd: '102-4',
        });
        setIsTeacherAuthenticated(true);
      } else if (!user) {
        setCloudTeacherStudents([]);
        setCloudTeacherAssignments([]);
        setCloudTeacherAttempts([]);
        setCloudStudentAssignments([]);
        setCloudStudentAttempts([]);
        setCloudSyncStatus('local');
        setCloudSyncMessage(null);
      }
    });
    return () => unsub();
  }, []);

  const ensureStudentSession = useCallback(async (): Promise<AuthActionResult> => {
    if (auth.currentUser) {
      setStudentCloudError(null);
      return { ok: true };
    }
    try {
      const cred = await signInAnonymously(auth);
      setFirebaseUser(cred.user);
      setStudentCloudError(null);
      return { ok: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const friendly = msg.includes('operation-not-allowed')
        ? 'Falta habilitar el acceso Anónimo en Authentication → Sign-in method de Firebase.'
        : `No se pudo iniciar la conexión en la nube para estudiantes: ${msg}`;
      setStudentCloudError(friendly);
      return { ok: false, error: friendly };
    }
  }, []);

  // Automatically ensure an invisible cloud session whenever entering Student view (zero email required)
  useEffect(() => {
    if (role === 'student' && isAuthReady && !firebaseUser) {
      void ensureStudentSession();
    }
  }, [role, isAuthReady, firebaseUser, ensureStudentSession]);

  // Teacher Cloud Realtime Subscription
  const seededCheckRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isCloudTeacher || !firebaseUser) return;

    const uid = firebaseUser.uid;
    setCloudSyncStatus('connecting');
    setCloudSyncMessage('Sincronizando datos en la nube...');

    let cancelled = false;

    const initAndSubscribe = async () => {
      try {
        const profile = await ensureTeacherProfileCloud({
          uid,
          name: firebaseUser.displayName || currentTeacher.name || 'Docente',
          email: firebaseUser.email || '',
          activeTheme: themePrefs.teachers[uid] || DEFAULT_THEME_ID,
        });

        if (cancelled) return;

        setCurrentTeacher(prev => ({
          ...prev,
          id: uid,
          uid,
          name: profile.name,
          email: profile.email,
          schoolName: profile.schoolName,
          commune: profile.commune,
          rbd: profile.rbd,
        }));

        if (profile.activeTheme && !themePrefs.teachers[uid]) {
          setThemePrefs(tp => ({
            ...tp,
            teachers: { ...tp.teachers, [uid]: profile.activeTheme },
          }));
        }

        if (!profile.seededInitialData && !seededCheckRef.current.has(uid)) {
          seededCheckRef.current.add(uid);
          setCloudSyncMessage('Preparando espacio de trabajo limpio en la nube...');
          await seedTeacherWorkspaceCloud(uid);
        }
      } catch (err) {
        if (!cancelled) reportCloudError(err);
      }
    };

    void initAndSubscribe();

    const unsub = subscribeTeacherWorkspaceCloud(uid, {
      onStudents: list => {
        setCloudTeacherStudents(list);
        setCloudSyncStatus('synced');
        setCloudSyncMessage(`Nube activa · ${firebaseUser.email || ''}`);
      },
      onAssignments: list => {
        setCloudTeacherAssignments(list);
        setCloudSyncStatus('synced');
      },
      onAttempts: list => {
        setCloudTeacherAttempts(list);
        setCloudSyncStatus('synced');
      },
      onProfile: profile => {
        setCurrentTeacher(prev => ({
          ...prev,
          id: uid,
          uid,
          name: profile.name,
          email: profile.email,
        }));
      },
      onError: err => reportCloudError(err),
    });

    return () => {
      cancelled = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCloudTeacher, firebaseUser?.uid]);

  // Auto-backfill studentUid on seeded/historical attempts whenever a student claims their seat
  useEffect(() => {
    if (!isCloudTeacher || !firebaseUser) return;
    const uid = firebaseUser.uid;

    const linkedMap = new Map<string, string>();
    cloudTeacherStudents.forEach(st => {
      if (st.linkedStudentUid) {
        linkedMap.set(st.id, st.linkedStudentUid);
      }
    });
    if (linkedMap.size === 0) return;

    const byStudentUid = new Map<string, string[]>();
    cloudTeacherAttempts.forEach(att => {
      const targetStudentUid = linkedMap.get(att.studentId);
      if (targetStudentUid && !att.studentUid) {
        const arr = byStudentUid.get(targetStudentUid) || [];
        arr.push(att.id);
        byStudentUid.set(targetStudentUid, arr);
      }
    });

    byStudentUid.forEach((attemptIds, studentUid) => {
      void backfillStudentUidOnAttemptsCloud(uid, attemptIds, studentUid).catch(err => {
        console.error('Backfill attempts studentUid failed:', err);
      });
    });
  }, [isCloudTeacher, firebaseUser, cloudTeacherStudents, cloudTeacherAttempts]);

  // Student seats are always authenticated explicitly via Course + Name + PIN (no PIN-less quick bypass)

  // Student Cloud Live Feed & Attempts Listener
  useEffect(() => {
    if (!isCloudStudent || !firebaseUser || !currentStudent?.ownerUid) {
      return;
    }

    setCloudSyncStatus('connecting');
    setCloudSyncMessage('Conectando evaluaciones en tiempo real...');

    const unsub = subscribeStudentCourseAndAttemptsCloud(
      {
        studentUid: firebaseUser.uid,
        ownerUid: currentStudent.ownerUid,
        courseId: currentStudent.courseId,
      },
      {
        onAssignments: list => {
          setCloudStudentAssignments(list);
          setCloudSyncStatus('synced');
          setCloudSyncMessage(`Nube activa · ${currentStudent.name}`);
        },
        onAttempts: list => {
          setCloudStudentAttempts(list);
          setCloudSyncStatus('synced');
        },
        onError: err => reportCloudError(err),
      }
    );

    return () => unsub();
  }, [isCloudStudent, firebaseUser, currentStudent?.ownerUid, currentStudent?.courseId, currentStudent?.name]);

  // Handle direct quiz code navigation after cloud assignments arrive
  useEffect(() => {
    if (!pendingDirectQuizCode || !currentStudent) return;
    const match = cloudStudentAssignments.find(
      a => a.code.toUpperCase() === pendingDirectQuizCode.toUpperCase()
    );
    if (match) {
      const existingAttempt = cloudStudentAttempts.find(
        att => att.quizId === match.id && att.studentId === currentStudent.id
      );
      if (existingAttempt) {
        setLatestCompletedAttempt(existingAttempt);
      } else {
        setActiveQuizTaking(match);
      }
      setPendingDirectQuizCode(null);
    }
  }, [pendingDirectQuizCode, cloudStudentAssignments, cloudStudentAttempts, currentStudent]);

  // Unified collections depending on active mode (Cloud Teacher, Cloud Student, or Local Demo)
  const sortByNameES = <T extends { name: string }>(arr: T[]): T[] =>
    [...arr].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  const students = useMemo(() => {
    if (isCloudStudent && currentStudent) return [currentStudent];
    if (isCloudTeacher) return sortByNameES(cloudTeacherStudents);
    return sortByNameES(localStudents);
  }, [isCloudTeacher, cloudTeacherStudents, isCloudStudent, currentStudent, localStudents]);

  const assignments = useMemo(() => {
    if (isCloudStudent) return cloudStudentAssignments;
    if (isCloudTeacher) return cloudTeacherAssignments;
    return localAssignments;
  }, [isCloudTeacher, cloudTeacherAssignments, isCloudStudent, cloudStudentAssignments, localAssignments]);

  const attempts = useMemo(() => {
    if (isCloudStudent) return cloudStudentAttempts;
    if (isCloudTeacher) return cloudTeacherAttempts;
    return localAttempts;
  }, [isCloudTeacher, cloudTeacherAttempts, isCloudStudent, cloudStudentAttempts, localAttempts]);

  const activeTheme: ThemePaletteId = useMemo(() => {
    if (role === 'student') {
      if (currentStudent) {
        return themePrefs.students[currentStudent.id] || DEFAULT_THEME_ID;
      }
      return pendingEntryTheme || themePrefs.guest || DEFAULT_THEME_ID;
    }
    if (role === 'teacher') {
      if (isTeacherAuthenticated) {
        return themePrefs.teachers[currentTeacher.id] || DEFAULT_THEME_ID;
      }
      return pendingEntryTheme || themePrefs.guest || DEFAULT_THEME_ID;
    }
    return themePrefs.guest || DEFAULT_THEME_ID;
  }, [role, currentStudent, isTeacherAuthenticated, currentTeacher.id, themePrefs, pendingEntryTheme]);

  useEffect(() => {
    applyThemeToDocument(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    saveStoredThemePreferences(themePrefs);
  }, [themePrefs]);

  const setThemePreference = (themeId: ThemePaletteId) => {
    if (role === 'student' && currentStudent) {
      setThemePrefs(prev => ({
        ...prev,
        students: { ...prev.students, [currentStudent.id]: themeId },
      }));
      setPendingEntryTheme(null);
      return;
    }
    if (role === 'teacher' && isTeacherAuthenticated) {
      setThemePrefs(prev => ({
        ...prev,
        teachers: { ...prev.teachers, [currentTeacher.id]: themeId },
      }));
      setPendingEntryTheme(null);
      if (isCloudTeacher && firebaseUser) {
        void updateTeacherThemeCloud(firebaseUser.uid, themeId).catch(reportCloudError);
      }
      return;
    }
    if (role === 'student' || role === 'teacher') {
      setPendingEntryTheme(themeId);
    }
    setThemePrefs(prev => ({
      ...prev,
      guest: themeId,
    }));
  };

  const setCurrentStudent: React.Dispatch<React.SetStateAction<Student | null>> = value => {
    setCurrentStudentState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (next && pendingEntryTheme) {
        setThemePrefs(tp => ({
          ...tp,
          students: { ...tp.students, [next.id]: pendingEntryTheme },
        }));
        setPendingEntryTheme(null);
      } else if (!next) {
        setPendingEntryTheme(null);
      }
      return next;
    });
  };

  // Scoped views strictly for the authenticated teacher
  const teacherStudents = useMemo(() => {
    if (!isTeacherAuthenticated) return [];
    if (isCloudTeacher) return sortByNameES(cloudTeacherStudents);
    return sortByNameES(localStudents.filter(s => s.teacherId === currentTeacher.id));
  }, [isTeacherAuthenticated, isCloudTeacher, cloudTeacherStudents, localStudents, currentTeacher.id]);

  const teacherAssignments = useMemo(() => {
    if (!isTeacherAuthenticated) return [];
    if (isCloudTeacher) return cloudTeacherAssignments;
    return localAssignments.filter(a => a.teacherId === currentTeacher.id);
  }, [isTeacherAuthenticated, isCloudTeacher, cloudTeacherAssignments, localAssignments, currentTeacher.id]);

  const teacherAttempts = useMemo(() => {
    if (!isTeacherAuthenticated) return [];
    if (isCloudTeacher) return cloudTeacherAttempts;
    const myQuizIds = new Set(teacherAssignments.map(a => a.id));
    const myStudentIds = new Set(teacherStudents.map(s => s.id));
    return localAttempts.filter(att => myQuizIds.has(att.quizId) && myStudentIds.has(att.studentId));
  }, [isTeacherAuthenticated, isCloudTeacher, cloudTeacherAttempts, localAttempts, teacherAssignments, teacherStudents]);

  // Sync local storage (for demo/offline convenience)
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}current_teacher`, JSON.stringify(currentTeacher));
  }, [currentTeacher]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}teachers`, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    if (isTeacherAuthenticated) {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
    } else {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
    }
  }, [isTeacherAuthenticated]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}courses`, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}selected_course`, selectedCourseId);
  }, [selectedCourseId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}students`, JSON.stringify(localStudents));
  }, [localStudents]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}assignments`, JSON.stringify(localAssignments));
  }, [localAssignments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}attempts`, JSON.stringify(localAttempts));
  }, [localAttempts]);

  const focusTeacherDefaultCourse = (teacherId: string, sourceStudents: Student[]) => {
    const newTeacherStudents = sourceStudents.filter(s => s.teacherId === teacherId);
    const hasInCurrent = newTeacherStudents.some(s => s.courseId === selectedCourseId);
    if (!hasInCurrent && newTeacherStudents.length > 0) {
      setSelectedCourseId(newTeacherStudents[0].courseId);
    }
  };

  // Cloud Auth Helpers
  const loginTeacherWithGoogle = async (): Promise<AuthActionResult> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      if (!user.emailVerified) {
        return {
          ok: false,
          error: 'Tu cuenta Google debe tener el correo verificado para acceder a la base de datos en la nube.',
        };
      }

      const teacherObj: Teacher = {
        id: user.uid,
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Docente',
        email: user.email || '',
        schoolName: 'Escuela Ricardo Silva Arriagada',
        commune: 'SLEP Chinchorro · Arica',
        rbd: '102-4',
      };

      if (pendingEntryTheme) {
        setThemePrefs(prev => ({
          ...prev,
          teachers: { ...prev.teachers, [user.uid]: pendingEntryTheme },
        }));
        setPendingEntryTheme(null);
      }

      localStorage.setItem(CLOUD_TEACHER_UID_KEY, user.uid);
      setCloudTeacherUid(user.uid);
      setCurrentTeacher(teacherObj);
      setIsTeacherAuthenticated(true);
      setIsTeacherLoginModalOpen(false);
      setActiveQuizTaking(null);
      setRole('teacher');
      return { ok: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
        return { ok: false, error: 'Ventana de Google cerrada antes de completar el ingreso.' };
      }
      if (msg.includes('popup-blocked')) {
        return {
          ok: false,
          error: 'Tu navegador bloqueó la ventana emergente de Google. Permite ventanas emergentes e intenta nuevamente.',
        };
      }
      return { ok: false, error: `Error al conectar con Google: ${msg}` };
    }
  };

  const logoutStudent = () => {
    setCurrentStudentState(null);
    setActiveQuizTaking(null);
    setLatestCompletedAttempt(null);
    setPendingDirectQuizCode(null);
    setCloudStudentAssignments([]);
    setCloudStudentAttempts([]);
  };

  const disconnectGoogleAccount = async (): Promise<void> => {
    localStorage.removeItem(CLOUD_TEACHER_UID_KEY);
    setCloudTeacherUid(null);
    setIsTeacherAuthenticated(false);
    setCurrentStudentState(null);
    setActiveQuizTaking(null);
    setLatestCompletedAttempt(null);
    setCloudSyncStatus('local');
    setCloudSyncMessage(null);
    await signOut(auth);
  };

  const listAvailableCourseDirectories = useCallback(async (): Promise<CourseJoinCodeDirectory[]> => {
    return listAvailableCourseDirectoriesCloud();
  }, []);

  const lookupCourseJoinCode = useCallback(async (joinCode: string) => {
    return lookupCourseJoinCodeCloud(joinCode);
  }, []);

  const loginStudentCloudByAccessCode = async (
    accessCode: string,
    pin: string,
    quizDirectCode?: string
  ): Promise<AuthActionResult> => {
    if (!auth.currentUser) {
      const sessionRes = await ensureStudentSession();
      if (!sessionRes.ok) {
        return { ok: false, error: sessionRes.error || 'No se pudo conectar con la nube.' };
      }
    }
    const activeUid = auth.currentUser?.uid;
    if (!activeUid) {
      return { ok: false, error: 'No se pudo iniciar la sesión de estudiante en la nube.' };
    }
    const res = await claimStudentWithAccessCodeCloud({
      accessCode,
      pin,
      firebaseUid: activeUid,
    });
    if (!res.ok || !res.student) {
      return { ok: false, error: res.error || 'Credenciales inválidas.' };
    }
    if (quizDirectCode?.trim()) {
      setPendingDirectQuizCode(quizDirectCode.trim().toUpperCase());
    }
    setCurrentStudent(res.student);
    return { ok: true };
  };

  const getCourseJoinCode = (courseId: string): string | null => {
    if (!isCloudTeacher || !firebaseUser) return null;
    return makeCourseJoinCode(firebaseUser.uid, courseId);
  };

  const loginTeacher = (teacherIdOrIdentifier: string, password: string): AuthActionResult => {
    const needle = teacherIdOrIdentifier.trim().toLowerCase();
    const pass = password.trim();
    if (!needle) {
      return { ok: false, error: 'Selecciona o ingresa tu cuenta docente.' };
    }
    if (!pass) {
      return { ok: false, error: 'Debes ingresar tu clave de acceso.' };
    }

    const found = teachers.find(
      t =>
        t.id === teacherIdOrIdentifier ||
        t.name.toLowerCase() === needle ||
        (t.email && t.email.toLowerCase() === needle)
    );

    if (!found) {
      return { ok: false, error: 'No se encontró la cuenta docente ingresada.' };
    }

    const expectedPassword = found.password || DEFAULT_INITIAL_TEACHER_PASSWORD;
    if (expectedPassword !== pass) {
      return { ok: false, error: 'Clave incorrecta. Verifica tu clave de docente e intenta nuevamente.' };
    }

    if (pendingEntryTheme) {
      setThemePrefs(prev => ({
        ...prev,
        teachers: { ...prev.teachers, [found.id]: pendingEntryTheme },
      }));
      setPendingEntryTheme(null);
    }

    localStorage.removeItem(CLOUD_TEACHER_UID_KEY);
    setCloudTeacherUid(null);
    setCurrentTeacher(found);
    setIsTeacherAuthenticated(true);
    setIsTeacherLoginModalOpen(false);
    setActiveQuizTaking(null);
    setRole('teacher');
    focusTeacherDefaultCourse(found.id, localStudents);
    return { ok: true };
  };

  const registerTeacher = (name: string, password: string, email?: string): AuthActionResult => {
    const cleanName = name.trim();
    const cleanPass = password.trim();
    const cleanEmail = email?.trim() || '';

    if (cleanName.length < 3) {
      return { ok: false, error: 'Ingresa tu nombre y apellido completo (mínimo 3 caracteres).' };
    }
    if (cleanPass.length < 4) {
      return { ok: false, error: 'Tu clave personal debe tener al menos 4 caracteres.' };
    }

    const duplicate = teachers.find(
      t =>
        t.name.toLowerCase() === cleanName.toLowerCase() ||
        (cleanEmail && t.email && t.email.toLowerCase() === cleanEmail.toLowerCase())
    );
    if (duplicate) {
      return {
        ok: false,
        error: `Ya existe una cuenta registrada para "${duplicate.name}". Inicia sesión en la pestaña "Ingresar".`,
      };
    }

    const newTeacher: Teacher = {
      id: `t-${Date.now()}`,
      name: cleanName,
      email: cleanEmail || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@slepchinchorro.cl`,
      password: cleanPass,
      hasCustomPassword: true,
      schoolName: 'Escuela Ricardo Silva Arriagada',
      commune: 'SLEP Chinchorro · Arica',
      rbd: '102-4',
    };

    if (pendingEntryTheme) {
      setThemePrefs(prev => ({
        ...prev,
        teachers: { ...prev.teachers, [newTeacher.id]: pendingEntryTheme },
      }));
      setPendingEntryTheme(null);
    }

    localStorage.removeItem(CLOUD_TEACHER_UID_KEY);
    setCloudTeacherUid(null);
    setTeachers(prev => [newTeacher, ...prev]);
    setCurrentTeacher(newTeacher);
    setIsTeacherAuthenticated(true);
    setIsTeacherLoginModalOpen(false);
    setActiveQuizTaking(null);
    setRole('teacher');
    return { ok: true };
  };

  const logoutTeacher = () => {
    localStorage.removeItem(CLOUD_TEACHER_UID_KEY);
    setCloudTeacherUid(null);
    setIsTeacherAuthenticated(false);
    setIsTeacherLoginModalOpen(false);
    setActiveQuizTaking(null);
    setPendingEntryTheme(null);
    setRole('teacher');
    if (firebaseUser) {
      void signOut(auth);
    }
  };

  const updateTeacherPassword = (currentPassword: string, newPassword: string): AuthActionResult => {
    const expected = currentTeacher.password || DEFAULT_INITIAL_TEACHER_PASSWORD;
    if (currentPassword.trim() !== expected) {
      return { ok: false, error: 'La clave actual no coincide.' };
    }
    const cleanNew = newPassword.trim();
    if (cleanNew.length < 4) {
      return { ok: false, error: 'La nueva clave debe tener al menos 4 caracteres.' };
    }

    const updatedTeacher: Teacher = {
      ...currentTeacher,
      password: cleanNew,
      hasCustomPassword: true,
    };

    setTeachers(prev => prev.map(t => (t.id === updatedTeacher.id ? updatedTeacher : t)));
    setCurrentTeacher(updatedTeacher);
    return { ok: true };
  };

  const purgeLocalTeacherRecords = (teacherId: string) => {
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
    setLocalStudents(prev => prev.filter(s => s.teacherId !== teacherId));
    setLocalAssignments(prev => prev.filter(a => a.teacherId !== teacherId));
    setLocalAttempts(prev => prev.filter(att => att.teacherId !== teacherId));
    setThemePrefs(prev => {
      if (!(teacherId in prev.teachers)) return prev;
      const nextTeachers = { ...prev.teachers };
      delete nextTeachers[teacherId];
      return { ...prev, teachers: nextTeachers };
    });
  };

  const deleteOwnTeacherAccount = async (): Promise<AuthActionResult> => {
    if (!isTeacherAuthenticated) {
      return { ok: false, error: 'Debes iniciar sesión como docente para eliminar tu cuenta.' };
    }

    if (isCloudTeacher && firebaseUser) {
      const targetUser = firebaseUser;
      const uid = targetUser.uid;
      try {
        await deleteTeacherProfileAndDataCloud(uid);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: `No se pudieron eliminar tus datos en la nube: ${msg}` };
      }

      let authDeleted = false;
      try {
        await deleteUser(targetUser);
        authDeleted = true;
      } catch (authErr) {
        const code = (authErr as { code?: string })?.code || '';
        const msg = authErr instanceof Error ? authErr.message : String(authErr);
        if (code.includes('requires-recent-login') || msg.includes('requires-recent-login')) {
          try {
            const reauthCred = await reauthenticateWithPopup(targetUser, googleProvider);
            await deleteUser(reauthCred.user);
            authDeleted = true;
          } catch {
            authDeleted = false;
          }
        }
      }

      if (!authDeleted) {
        await signOut(auth).catch(() => undefined);
      }

      localStorage.removeItem(CLOUD_TEACHER_UID_KEY);
      seededCheckRef.current.delete(uid);
      purgeLocalTeacherRecords(uid);
      setCloudTeacherUid(null);
      setCloudTeacherStudents([]);
      setCloudTeacherAssignments([]);
      setCloudTeacherAttempts([]);
      setCurrentTeacher(EMPTY_TEACHER);
      setIsTeacherAuthenticated(false);
      setIsTeacherLoginModalOpen(false);
      setActiveQuizTaking(null);
      setLatestCompletedAttempt(null);
      setCurrentStudentState(null);
      setPendingEntryTheme(null);
      setCloudSyncStatus('local');
      setCloudSyncMessage(null);
      setRole('teacher');

      if (!authDeleted) {
        return {
          ok: true,
          error:
            'Tu perfil, listas de curso, evaluaciones y notas fueron eliminados de MateClic. Cerramos tu sesión para finalizar.',
        };
      }
      return { ok: true };
    }

    const localId = currentTeacher.id;
    if (localId) {
      purgeLocalTeacherRecords(localId);
    }
    setCurrentTeacher(EMPTY_TEACHER);
    setIsTeacherAuthenticated(false);
    setIsTeacherLoginModalOpen(false);
    setActiveQuizTaking(null);
    setLatestCompletedAttempt(null);
    setCurrentStudentState(null);
    setPendingEntryTheme(null);
    setRole('teacher');
    return { ok: true };
  };

  const listCloudTeachersForAdmin = async (): Promise<CloudTeacherProfile[]> => {
    if (!isAdminTeacher) return [];
    return listAllCloudTeachers();
  };

  const deleteTeacherAccountAsAdmin = async (
    targetTeacherId: string,
    isCloud: boolean
  ): Promise<AuthActionResult> => {
    if (!isAdminTeacher) {
      return {
        ok: false,
        error: 'Solo la administradora autorizada (riveralandy@gmail.com) puede eliminar cuentas de otros docentes.',
      };
    }

    if (isCloud) {
      if (firebaseUser && targetTeacherId === firebaseUser.uid) {
        return deleteOwnTeacherAccount();
      }
      try {
        await deleteTeacherProfileAndDataCloud(targetTeacherId);
        seededCheckRef.current.delete(targetTeacherId);
        purgeLocalTeacherRecords(targetTeacherId);
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: `No se pudo eliminar la cuenta docente en la nube: ${msg}` };
      }
    }

    if (!isCloudTeacher && targetTeacherId === currentTeacher.id) {
      return deleteOwnTeacherAccount();
    }
    purgeLocalTeacherRecords(targetTeacherId);
    return { ok: true };
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  const addStudentsToCourse = (courseId: string, rawText: string): number => {
    if (!isTeacherAuthenticated) return 0;
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return 0;

    const course = courses.find(c => c.id === courseId);
    const gradeShort = course ? course.section.replace(/\s+/g, '').replace('°Básico', 'B').substring(0, 4) : 'MAT';

    const existingTeacherCourseStudents = teacherStudents.filter(s => s.courseId === courseId);
    const existingAccessCodes = new Set(teacherStudents.map(s => s.accessCode.toUpperCase()));
    let counter = existingTeacherCourseStudents.length + 1;

    const newStudents: Student[] = [];

    const rutPattern = /^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$/i;
    const parsedNames: string[] = [];

    for (const line of lines) {
      let name = line;
      if (line.includes('\t') || line.includes(',') || line.includes(';')) {
        const parts = line
          .split(/[\t,;]+/)
          .map(p => p.trim())
          .filter(p => p.length > 0 && !rutPattern.test(p));
        if (parts.length > 0) {
          name = parts.join(' ');
        }
      }
      name = name.replace(/\s+/g, ' ').trim();
      if (name) {
        parsedNames.push(name);
      }
    }

    parsedNames.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    for (const name of parsedNames) {
      let seqStr = counter < 10 ? `0${counter}` : `${counter}`;
      let accessCode = `MAT-${gradeShort}-${seqStr}`;
      while (existingAccessCodes.has(accessCode.toUpperCase())) {
        counter++;
        seqStr = counter < 10 ? `0${counter}` : `${counter}`;
        accessCode = `MAT-${gradeShort}-${seqStr}`;
      }
      existingAccessCodes.add(accessCode.toUpperCase());

      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      newStudents.push({
        id: `st-${Date.now()}-${counter}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        rut: '',
        courseId,
        teacherId: currentTeacher.id,
        ownerUid: isCloudTeacher && firebaseUser ? firebaseUser.uid : undefined,
        linkedStudentUid: '',
        accessCode,
        pin,
      });

      counter++;
    }

    if (isCloudTeacher && firebaseUser) {
      const courseStudentsAfter = sortByNameES([...existingTeacherCourseStudents, ...newStudents]);
      void addStudentsCloud(
        firebaseUser.uid,
        currentTeacher.name,
        courseId,
        course?.section || courseId,
        newStudents,
        courseStudentsAfter
      ).catch(reportCloudError);
    } else {
      setLocalStudents(prev => [...prev, ...newStudents]);
    }

    return newStudents.length;
  };

  const removeStudentFromCourse = (studentId: string) => {
    if (!isTeacherAuthenticated) return;
    if (isCloudTeacher && firebaseUser) {
      const target = cloudTeacherStudents.find(s => s.id === studentId);
      if (!target) return;
      const courseObj = courses.find(c => c.id === target.courseId);
      const remaining = cloudTeacherStudents.filter(
        s => s.courseId === target.courseId && s.id !== studentId
      );
      void removeStudentsCloud(
        firebaseUser.uid,
        currentTeacher.name,
        target.courseId,
        courseObj?.section || target.courseId,
        [target],
        remaining
      ).catch(reportCloudError);
      return;
    }

    setLocalStudents(prev =>
      prev.filter(s => !(s.id === studentId && s.teacherId === currentTeacher.id))
    );
  };

  const updateStudentName = (studentId: string, newName: string): AuthActionResult => {
    if (!isTeacherAuthenticated) {
      return { ok: false, error: 'Debes iniciar sesión como docente.' };
    }
    const cleanName = newName.replace(/\s+/g, ' ').trim().slice(0, 120);
    if (cleanName.length < 2) {
      return { ok: false, error: 'El nombre del estudiante debe tener al menos 2 caracteres.' };
    }

    if (isCloudTeacher && firebaseUser) {
      const target = cloudTeacherStudents.find(s => s.id === studentId);
      if (!target) {
        return { ok: false, error: 'No se encontró al estudiante en tu lista.' };
      }
      const courseObj = courses.find(c => c.id === target.courseId);
      const courseStudentsAfter = cloudTeacherStudents
        .filter(s => s.courseId === target.courseId)
        .map(s => (s.id === studentId ? { ...s, name: cleanName } : s));

      void updateStudentNameCloud({
        ownerUid: firebaseUser.uid,
        teacherName: currentTeacher.name,
        courseId: target.courseId,
        courseSection: courseObj?.section || target.courseId,
        student: target,
        newName: cleanName,
        allCourseStudentsAfter: courseStudentsAfter,
      }).catch(reportCloudError);
      return { ok: true };
    }

    const localTarget = localStudents.find(
      s => s.id === studentId && s.teacherId === currentTeacher.id
    );
    if (!localTarget) {
      return { ok: false, error: 'No se encontró al estudiante en tu lista.' };
    }

    setLocalStudents(prev =>
      prev.map(s =>
        s.id === studentId && s.teacherId === currentTeacher.id ? { ...s, name: cleanName } : s
      )
    );
    setLocalAttempts(prev =>
      prev.map(att =>
        att.studentId === studentId && att.teacherId === currentTeacher.id
          ? { ...att, studentName: cleanName }
          : att
      )
    );
    if (currentStudent && currentStudent.id === studentId) {
      setCurrentStudent(prev => (prev ? { ...prev, name: cleanName } : null));
    }
    return { ok: true };
  };

  const clearCourseStudentsForTeacher = (courseId: string) => {
    if (!isTeacherAuthenticated) return;
    if (isCloudTeacher && firebaseUser) {
      const removed = cloudTeacherStudents.filter(s => s.courseId === courseId);
      if (removed.length === 0) return;
      const courseObj = courses.find(c => c.id === courseId);
      void removeStudentsCloud(
        firebaseUser.uid,
        currentTeacher.name,
        courseId,
        courseObj?.section || courseId,
        removed,
        []
      ).catch(reportCloudError);
      return;
    }

    setLocalStudents(prev =>
      prev.filter(s => !(s.courseId === courseId && s.teacherId === currentTeacher.id))
    );
  };

  const unlinkStudentGoogleAccount = (studentId: string) => {
    if (!isCloudTeacher || !firebaseUser) return;
    const target = cloudTeacherStudents.find(s => s.id === studentId);
    if (!target) return;
    void unlinkStudentGoogleCloud(firebaseUser.uid, target).catch(reportCloudError);
  };

  const addQuizAssignment = (assignment: QuizAssignment) => {
    if (!isTeacherAuthenticated) return;
    const ownedAssignment: QuizAssignment = {
      ...assignment,
      teacherId: currentTeacher.id,
      ownerUid: isCloudTeacher && firebaseUser ? firebaseUser.uid : undefined,
      teacherName: assignment.teacherName || currentTeacher.name,
    };

    if (isCloudTeacher && firebaseUser) {
      const courseAfter = [
        ownedAssignment,
        ...cloudTeacherAssignments.filter(a => a.courseId === ownedAssignment.courseId),
      ];
      void addQuizAssignmentCloud(firebaseUser.uid, ownedAssignment, courseAfter).catch(reportCloudError);
    } else {
      setLocalAssignments(prev => [ownedAssignment, ...prev]);
    }
  };

  const deleteQuizAssignment = (id: string) => {
    if (!isTeacherAuthenticated) return;
    if (isCloudTeacher && firebaseUser) {
      const target = cloudTeacherAssignments.find(a => a.id === id);
      if (!target) return;
      const remaining = cloudTeacherAssignments.filter(
        a => a.courseId === target.courseId && a.id !== id
      );
      void deleteQuizAssignmentCloud(firebaseUser.uid, target, remaining).catch(reportCloudError);
      return;
    }

    setLocalAssignments(prev =>
      prev.filter(a => !(a.id === id && a.teacherId === currentTeacher.id))
    );
  };

  const recordQuizAttempt = (attempt: QuizAttempt) => {
    // Preserve the first official attempt: never overwrite or duplicate if the student already completed this quiz
    const existingOfficial = attempts.find(
      a => a.quizId === attempt.quizId && a.studentId === attempt.studentId
    );
    if (existingOfficial) {
      setLatestCompletedAttempt(existingOfficial);
      return;
    }

    const targetQuiz = assignments.find(q => q.id === attempt.quizId);
    const ownerUid = targetQuiz?.ownerUid || currentStudent?.ownerUid || (isCloudTeacher && firebaseUser ? firebaseUser.uid : undefined);

    const ownedAttempt: QuizAttempt = {
      ...attempt,
      teacherId: attempt.teacherId || targetQuiz?.teacherId || currentTeacher.id,
      ownerUid,
      assignmentDocId: ownerUid ? makeAssignmentDocId(ownerUid, attempt.quizId) : undefined,
      studentUid: firebaseUser && role === 'student' ? firebaseUser.uid : '',
    };

    setLatestCompletedAttempt(ownedAttempt);

    if (ownerUid && firebaseUser && (role === 'student' || firebaseUser.emailVerified)) {
      void recordQuizAttemptCloud({
        attempt: ownedAttempt,
        ownerUid,
        studentUid: role === 'student' ? firebaseUser.uid : '',
      }).catch(reportCloudError);
    } else {
      setLocalAttempts(prev => [ownedAttempt, ...prev]);
    }
  };

  const deleteQuizAttempts = (attemptIds: string[]) => {
    if (!isTeacherAuthenticated || attemptIds.length === 0) return;
    const requestedIds = new Set(attemptIds);
    const allowedIds = teacherAttempts.filter(att => requestedIds.has(att.id)).map(att => att.id);
    if (allowedIds.length === 0) return;
    const allowedSet = new Set(allowedIds);

    if (isCloudTeacher && firebaseUser) {
      void deleteQuizAttemptsCloud(firebaseUser.uid, allowedIds).catch(reportCloudError);
    } else {
      setLocalAttempts(prev => prev.filter(att => !allowedSet.has(att.id)));
    }
    setLatestCompletedAttempt(prev => (prev && allowedSet.has(prev.id) ? null : prev));
  };

  const deleteQuizAttempt = (attemptId: string) => {
    deleteQuizAttempts([attemptId]);
  };

  const updateQuizAttemptGrade = (
    attemptId: string,
    updates: { chileanGrade?: number; percentage?: number }
  ) => {
    if (!isTeacherAuthenticated) return;
    const target = teacherAttempts.find(att => att.id === attemptId);
    if (!target) return;

    let nextGrade = target.chileanGrade;
    let nextPercentage = target.percentage;

    if (typeof updates.percentage === 'number' && !Number.isNaN(updates.percentage)) {
      nextPercentage = Math.max(0, Math.min(100, Math.round(updates.percentage)));
      nextGrade = calculateChileanGrade(nextPercentage, 100, 60);
    }
    if (typeof updates.chileanGrade === 'number' && !Number.isNaN(updates.chileanGrade)) {
      nextGrade = Math.max(1.0, Math.min(7.0, Math.round(updates.chileanGrade * 10) / 10));
    }

    const nextLevel = getMineducPerformanceLevel(nextGrade);

    if (isCloudTeacher && firebaseUser) {
      void updateQuizAttemptGradeCloud(
        firebaseUser.uid,
        attemptId,
        nextGrade,
        nextPercentage,
        nextLevel
      ).catch(reportCloudError);
    } else {
      setLocalAttempts(prev =>
        prev.map(att =>
          att.id === attemptId
            ? {
                ...att,
                chileanGrade: nextGrade,
                percentage: nextPercentage,
                performanceLevel: nextLevel,
              }
            : att
        )
      );
    }

    setLatestCompletedAttempt(prev =>
      prev && prev.id === attemptId
        ? {
            ...prev,
            chileanGrade: nextGrade,
            percentage: nextPercentage,
            performanceLevel: nextLevel,
          }
        : prev
    );
  };

  const clearUrlCourseJoinCode = () => {
    setUrlCourseJoinCode(null);
    if (typeof window !== 'undefined' && window.location.search) {
      const url = new URL(window.location.href);
      url.searchParams.delete('curso');
      url.searchParams.delete('join');
      url.searchParams.delete('rol');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  const resetDemoData = () => {
    if (!isTeacherAuthenticated) return;
    if (isCloudTeacher) {
      setSelectedCourseId('course-7a');
      setActiveTeacherTab('matrix');
      return;
    }
    localStorage.clear();
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    setTeachers(DEFAULT_TEACHERS);
    setCurrentTeacher(EMPTY_TEACHER);
    setIsTeacherAuthenticated(false);
    setCourses(INITIAL_COURSES);
    setLocalStudents(INITIAL_STUDENTS);
    setLocalAssignments(INITIAL_ASSIGNMENTS);
    setLocalAttempts(INITIAL_ATTEMPTS);
    setSelectedCourseId('course-7a');
    setActiveTeacherTab('matrix');
    setCurrentStudent(null);
    setActiveQuizTaking(null);
    setLatestCompletedAttempt(null);
  };

  const clearTeacherWorkspaceAll = async (): Promise<void> => {
    if (!isTeacherAuthenticated) return;
    if (isCloudTeacher && firebaseUser) {
      setCloudSyncStatus('connecting');
      setCloudSyncMessage('Vaciando listas y evaluaciones de tu nube...');
      await clearAllTeacherCloudData(firebaseUser.uid);
      setCloudSyncStatus('synced');
      setCloudSyncMessage(`Nube activa · ${firebaseUser.email || ''}`);
      setSelectedCourseId('course-7a');
      setActiveTeacherTab('courses');
      return;
    }
    setLocalStudents([]);
    setLocalAssignments([]);
    setLocalAttempts([]);
    setSelectedCourseId('course-7a');
    setActiveTeacherTab('courses');
    setCurrentStudent(null);
    setActiveQuizTaking(null);
    setLatestCompletedAttempt(null);
  };

  const startQuizAsStudent = (quizId: string, studentId: string) => {
    if (!isTeacherAuthenticated) return;
    const quiz = teacherAssignments.find(a => a.id === quizId);
    const student = teacherStudents.find(s => s.id === studentId);
    if (quiz && student) {
      setCurrentStudent(student);
      setActiveQuizTaking(quiz);
      setRole('student');
    }
  };

  const updateStudentPin = (studentId: string, newPin: string): boolean => {
    const cleanPin = newPin.trim();
    if (!cleanPin || cleanPin.length < 4) return false;

    const target =
      (currentStudent && currentStudent.id === studentId ? currentStudent : null) ||
      students.find(s => s.id === studentId) ||
      null;

    if (target?.ownerUid && firebaseUser && (role === 'student' || firebaseUser.emailVerified)) {
      void updateStudentPinCloud(target, cleanPin).catch(reportCloudError);
    } else {
      setLocalStudents(prev =>
        prev.map(s => (s.id === studentId ? { ...s, pin: cleanPin, hasCustomPin: true } : s))
      );
    }

    if (currentStudent && currentStudent.id === studentId) {
      setCurrentStudent(prev => (prev ? { ...prev, pin: cleanPin, hasCustomPin: true } : null));
    }

    return true;
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeTeacherTab,
        setActiveTeacherTab,
        firebaseUser,
        isAuthReady,
        isCloudTeacher,
        isAdminTeacher,
        cloudSyncStatus,
        cloudSyncMessage,
        studentCloudError,
        ensureStudentSession,
        logoutStudent,
        loginTeacherWithGoogle,
        disconnectGoogleAccount,
        listAvailableCourseDirectories,
        lookupCourseJoinCode,
        loginStudentCloudByAccessCode,
        unlinkStudentGoogleAccount,
        getCourseJoinCode,
        urlCourseJoinCode,
        clearUrlCourseJoinCode,
        teachers,
        currentTeacher,
        isTeacherAuthenticated,
        isTeacherLoginModalOpen,
        setIsTeacherLoginModalOpen,
        loginTeacher,
        registerTeacher,
        logoutTeacher,
        updateTeacherPassword,
        deleteOwnTeacherAccount,
        listCloudTeachersForAdmin,
        deleteTeacherAccountAsAdmin,
        courses,
        selectedCourseId,
        setSelectedCourseId,
        selectedCourse,
        students,
        assignments,
        attempts,
        teacherStudents,
        teacherAssignments,
        teacherAttempts,
        activeOAForCreation,
        setActiveOAForCreation,
        currentStudent,
        setCurrentStudent,
        activeQuizTaking,
        setActiveQuizTaking,
        latestCompletedAttempt,
        setLatestCompletedAttempt,
        activeTheme,
        setThemePreference,
        addStudentsToCourse,
        updateStudentName,
        removeStudentFromCourse,
        clearCourseStudentsForTeacher,
        addQuizAssignment,
        deleteQuizAssignment,
        recordQuizAttempt,
        updateQuizAttemptGrade,
        deleteQuizAttempt,
        deleteQuizAttempts,
        resetDemoData,
        clearTeacherWorkspaceAll,
        startQuizAsStudent,
        updateStudentPin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
