import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

export const DEFAULT_INITIAL_TEACHER_PASSWORD = '1234';

export const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 't-1',
    name: 'Landy Rivera',
    email: 'riveralandy@gmail.com',
    password: DEFAULT_INITIAL_TEACHER_PASSWORD,
    hasCustomPassword: false,
    schoolName: 'Escuela Ricardo Silva Arriagada',
    commune: 'SLEP Chinchorro · Arica',
    rbd: '102-4',
  },
  {
    id: 't-2',
    name: 'Pamela Valenzuela',
    email: 'p.valenzuela@slepchinchorro.cl',
    password: DEFAULT_INITIAL_TEACHER_PASSWORD,
    hasCustomPassword: false,
    schoolName: 'Escuela Ricardo Silva Arriagada',
    commune: 'SLEP Chinchorro · Arica',
    rbd: '102-4',
  },
  {
    id: 't-3',
    name: 'Carlos González',
    email: 'c.gonzalez@slepchinchorro.cl',
    password: DEFAULT_INITIAL_TEACHER_PASSWORD,
    hasCustomPassword: false,
    schoolName: 'Escuela Ricardo Silva Arriagada',
    commune: 'SLEP Chinchorro · Arica',
    rbd: '102-4',
  },
  {
    id: 't-4',
    name: 'Carolina Morales',
    email: 'c.morales@slepchinchorro.cl',
    password: DEFAULT_INITIAL_TEACHER_PASSWORD,
    hasCustomPassword: false,
    schoolName: 'Escuela Ricardo Silva Arriagada',
    commune: 'SLEP Chinchorro · Arica',
    rbd: '102-4',
  }
];

interface AuthActionResult {
  ok: boolean;
  error?: string;
}

interface AppContextType {
  role: 'teacher' | 'student' | 'practice';
  setRole: (role: 'teacher' | 'student' | 'practice') => void;
  activeTeacherTab: TeacherTab;
  setActiveTeacherTab: (tab: TeacherTab) => void;

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

  courses: Course[];
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  selectedCourse: Course | undefined;

  // Global collections (used by Student Portal & cross-teacher uniqueness checks)
  students: Student[];
  assignments: QuizAssignment[];
  attempts: QuizAttempt[];

  // Strictly scoped to currentTeacher.id (used by Teacher Dashboard)
  teacherStudents: Student[];
  teacherAssignments: QuizAssignment[];
  teacherAttempts: QuizAttempt[];

  // Curricular OA selected for quiz creation
  activeOAForCreation: string | null;
  setActiveOAForCreation: (oaCode: string | null) => void;

  // Student portal state
  currentStudent: Student | null;
  setCurrentStudent: (student: Student | null) => void;
  activeQuizTaking: QuizAssignment | null;
  setActiveQuizTaking: (quiz: QuizAssignment | null) => void;
  latestCompletedAttempt: QuizAttempt | null;
  setLatestCompletedAttempt: (attempt: QuizAttempt | null) => void;

  // Theme & Palette Configuration
  activeTheme: ThemePaletteId;
  setThemePreference: (themeId: ThemePaletteId) => void;

  // Actions
  addStudentsToCourse: (courseId: string, rawText: string) => number;
  removeStudentFromCourse: (studentId: string) => void;
  clearCourseStudentsForTeacher: (courseId: string) => void;
  addQuizAssignment: (assignment: QuizAssignment) => void;
  deleteQuizAssignment: (id: string) => void;
  recordQuizAttempt: (attempt: QuizAttempt) => void;
  updateQuizAttemptGrade: (attemptId: string, updates: { chileanGrade?: number; percentage?: number }) => void;
  deleteQuizAttempt: (attemptId: string) => void;
  deleteQuizAttempts: (attemptIds: string[]) => void;
  resetDemoData: () => void;
  startQuizAsStudent: (quizId: string, studentId: string) => void;
  updateStudentPin: (studentId: string, newPin: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'thatquiz_chile_';
const SESSION_AUTH_KEY = 'thatquiz_chile_teacher_auth_session';

function normalizeTeacherRecord(t: Teacher): Teacher {
  return {
    ...t,
    password: t.password || DEFAULT_INITIAL_TEACHER_PASSWORD,
    hasCustomPassword: typeof t.hasCustomPassword === 'boolean' ? t.hasCustomPassword : false,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<'teacher' | 'student' | 'practice'>('teacher');
  const [activeTeacherTab, setActiveTeacherTab] = useState<TeacherTab>('matrix');
  const [activeOAForCreation, setActiveOAForCreation] = useState<string | null>(null);

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
    return DEFAULT_TEACHERS[0];
  });

  // Security: teacher starts unauthenticated on fresh browser session until entering password
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  });

  const [isTeacherLoginModalOpen, setIsTeacherLoginModalOpen] = useState(false);

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}courses`);
    if (saved) return JSON.parse(saved);
    return INITIAL_COURSES.map(c => ({
      ...c,
      teacherName: DEFAULT_TEACHERS[0].name,
    }));
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}selected_course`);
    return saved || 'course-7a';
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}students`);
    if (saved) {
      const parsed: Student[] = JSON.parse(saved);
      return parsed.map(s => ({
        ...s,
        teacherId: s.teacherId || DEFAULT_TEACHERS[0].id,
      }));
    }
    return INITIAL_STUDENTS;
  });

  const [assignments, setAssignments] = useState<QuizAssignment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}assignments`);
    if (saved) {
      const parsed: QuizAssignment[] = JSON.parse(saved);
      return parsed.map(a => ({
        ...a,
        teacherId: a.teacherId || DEFAULT_TEACHERS[0].id,
        teacherName: a.teacherName || DEFAULT_TEACHERS[0].name,
      }));
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}attempts`);
    if (saved) {
      const parsed: QuizAttempt[] = JSON.parse(saved);
      const seedMap = new Map(INITIAL_ATTEMPTS.map(item => [item.id, item]));
      return parsed.map(att => {
        const seed = seedMap.get(att.id);
        if (seed && (!att.answers || att.answers.length === 0)) {
          return {
            ...att,
            teacherId: att.teacherId || DEFAULT_TEACHERS[0].id,
            answers: seed.answers,
            score: seed.score,
            percentage: seed.percentage,
            durationSeconds: seed.durationSeconds,
            completedAt: att.completedAt === '2026-08-10' ? seed.completedAt : att.completedAt,
          };
        }
        return {
          ...att,
          teacherId: att.teacherId || DEFAULT_TEACHERS[0].id,
        };
      });
    }
    return INITIAL_ATTEMPTS;
  });

  const [currentStudent, setCurrentStudentState] = useState<Student | null>(null);
  const [activeQuizTaking, setActiveQuizTaking] = useState<QuizAssignment | null>(null);
  const [latestCompletedAttempt, setLatestCompletedAttempt] = useState<QuizAttempt | null>(null);

  // Per-user & guest palette preferences (defaults to 'estandar')
  const [themePrefs, setThemePrefs] = useState<StoredThemePreferences>(() => loadStoredThemePreferences());
  const [pendingEntryTheme, setPendingEntryTheme] = useState<ThemePaletteId | null>(null);

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
      return;
    }
    // Choosing from login screen ("desde su ingreso") or Free Practice
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
  const teacherStudents = useMemo(
    () => (isTeacherAuthenticated ? students.filter(s => s.teacherId === currentTeacher.id) : []),
    [students, currentTeacher.id, isTeacherAuthenticated]
  );

  const teacherAssignments = useMemo(
    () => (isTeacherAuthenticated ? assignments.filter(a => a.teacherId === currentTeacher.id) : []),
    [assignments, currentTeacher.id, isTeacherAuthenticated]
  );

  const teacherAttempts = useMemo(() => {
    if (!isTeacherAuthenticated) return [];
    const myQuizIds = new Set(teacherAssignments.map(a => a.id));
    const myStudentIds = new Set(teacherStudents.map(s => s.id));
    return attempts.filter(att => myQuizIds.has(att.quizId) && myStudentIds.has(att.studentId));
  }, [attempts, teacherAssignments, teacherStudents, isTeacherAuthenticated]);

  // Sync to localStorage / sessionStorage
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
    localStorage.setItem(`${STORAGE_KEY_PREFIX}students`, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}assignments`, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}attempts`, JSON.stringify(attempts));
  }, [attempts]);

  const focusTeacherDefaultCourse = (teacherId: string) => {
    const newTeacherStudents = students.filter(s => s.teacherId === teacherId);
    const hasInCurrent = newTeacherStudents.some(s => s.courseId === selectedCourseId);
    if (!hasInCurrent && newTeacherStudents.length > 0) {
      setSelectedCourseId(newTeacherStudents[0].courseId);
    }
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

    setCurrentTeacher(found);
    setIsTeacherAuthenticated(true);
    setIsTeacherLoginModalOpen(false);
    setActiveQuizTaking(null);
    setRole('teacher');
    focusTeacherDefaultCourse(found.id);
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

    setTeachers(prev => [newTeacher, ...prev]);
    setCurrentTeacher(newTeacher);
    setIsTeacherAuthenticated(true);
    setIsTeacherLoginModalOpen(false);
    setActiveQuizTaking(null);
    setRole('teacher');
    return { ok: true };
  };

  const logoutTeacher = () => {
    setIsTeacherAuthenticated(false);
    setIsTeacherLoginModalOpen(false);
    setActiveQuizTaking(null);
    setPendingEntryTheme(null);
    setRole('teacher');
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

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  const addStudentsToCourse = (courseId: string, rawText: string): number => {
    if (!isTeacherAuthenticated) return 0;
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return 0;

    const course = courses.find(c => c.id === courseId);
    const gradeShort = course ? course.section.replace(/\s+/g, '').replace('°Básico', 'B').substring(0, 4) : 'MAT';

    const existingTeacherCourseStudents = students.filter(
      s => s.courseId === courseId && s.teacherId === currentTeacher.id
    );
    const existingAccessCodes = new Set(students.map(s => s.accessCode.toUpperCase()));
    let counter = existingTeacherCourseStudents.length + 1;

    const newStudents: Student[] = [];

    for (const line of lines) {
      let name = line;
      let rut = '';
      if (line.includes(',') || line.includes(';')) {
        const parts = line.split(/[,;]/);
        if (parts[0].includes('-') || parts[0].length < 13) {
          rut = parts[0].trim();
          name = parts.slice(1).join(' ').trim();
        } else {
          name = parts[0].trim();
          rut = parts.slice(1).join(' ').trim();
        }
      }

      if (!rut) {
        const r1 = Math.floor(Math.random() * (24 - 21 + 1)) + 21;
        const r2 = Math.floor(Math.random() * 900) + 100;
        const r3 = Math.floor(Math.random() * 900) + 100;
        const dv = Math.floor(Math.random() * 10);
        rut = `${r1}.${r2}.${r3}-${dv === 10 ? 'K' : dv}`;
      }

      // Generate globally unique access code across all teachers
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
        id: `st-${Date.now()}-${counter}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        rut,
        courseId,
        teacherId: currentTeacher.id,
        accessCode,
        pin,
      });

      counter++;
    }

    setStudents(prev => [...prev, ...newStudents]);
    return newStudents.length;
  };

  const removeStudentFromCourse = (studentId: string) => {
    if (!isTeacherAuthenticated) return;
    setStudents(prev =>
      prev.filter(s => !(s.id === studentId && s.teacherId === currentTeacher.id))
    );
  };

  const clearCourseStudentsForTeacher = (courseId: string) => {
    if (!isTeacherAuthenticated) return;
    setStudents(prev =>
      prev.filter(s => !(s.courseId === courseId && s.teacherId === currentTeacher.id))
    );
  };

  const addQuizAssignment = (assignment: QuizAssignment) => {
    if (!isTeacherAuthenticated) return;
    const ownedAssignment: QuizAssignment = {
      ...assignment,
      teacherId: assignment.teacherId || currentTeacher.id,
      teacherName: assignment.teacherName || currentTeacher.name,
    };
    setAssignments(prev => [ownedAssignment, ...prev]);
  };

  const deleteQuizAssignment = (id: string) => {
    if (!isTeacherAuthenticated) return;
    setAssignments(prev =>
      prev.filter(a => !(a.id === id && a.teacherId === currentTeacher.id))
    );
  };

  const recordQuizAttempt = (attempt: QuizAttempt) => {
    const targetQuiz = assignments.find(q => q.id === attempt.quizId);
    const ownedAttempt: QuizAttempt = {
      ...attempt,
      teacherId: attempt.teacherId || targetQuiz?.teacherId || currentTeacher.id,
    };
    setAttempts(prev => [ownedAttempt, ...prev]);
    setLatestCompletedAttempt(ownedAttempt);
  };

  const deleteQuizAttempts = (attemptIds: string[]) => {
    if (!isTeacherAuthenticated || attemptIds.length === 0) return;
    const requestedIds = new Set(attemptIds);
    const allowedIds = new Set(
      teacherAttempts.filter(att => requestedIds.has(att.id)).map(att => att.id)
    );
    if (allowedIds.size === 0) return;

    setAttempts(prev => prev.filter(att => !allowedIds.has(att.id)));
    setLatestCompletedAttempt(prev => (prev && allowedIds.has(prev.id) ? null : prev));
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

    setAttempts(prev =>
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

  const resetDemoData = () => {
    if (!isTeacherAuthenticated) return;
    localStorage.clear();
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    setTeachers(DEFAULT_TEACHERS);
    setCurrentTeacher(DEFAULT_TEACHERS[0]);
    setIsTeacherAuthenticated(false);
    setCourses(INITIAL_COURSES.map(c => ({ ...c, teacherName: DEFAULT_TEACHERS[0].name })));
    setStudents(INITIAL_STUDENTS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setAttempts(INITIAL_ATTEMPTS);
    setSelectedCourseId('course-7a');
    setActiveTeacherTab('matrix');
    setCurrentStudent(null);
    setActiveQuizTaking(null);
    setLatestCompletedAttempt(null);
  };

  const startQuizAsStudent = (quizId: string, studentId: string) => {
    if (!isTeacherAuthenticated) return;
    const quiz = assignments.find(a => a.id === quizId && a.teacherId === currentTeacher.id);
    const student = students.find(s => s.id === studentId && s.teacherId === currentTeacher.id);
    if (quiz && student) {
      setCurrentStudent(student);
      setActiveQuizTaking(quiz);
      setRole('student');
    }
  };

  const updateStudentPin = (studentId: string, newPin: string): boolean => {
    const cleanPin = newPin.trim();
    if (!cleanPin || cleanPin.length < 4) return false;

    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          return { ...s, pin: cleanPin, hasCustomPin: true };
        }
        return s;
      })
    );

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
        teachers,
        currentTeacher,
        isTeacherAuthenticated,
        isTeacherLoginModalOpen,
        setIsTeacherLoginModalOpen,
        loginTeacher,
        registerTeacher,
        logoutTeacher,
        updateTeacherPassword,
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
        removeStudentFromCourse,
        clearCourseStudentsForTeacher,
        addQuizAssignment,
        deleteQuizAssignment,
        recordQuizAttempt,
        updateQuizAttemptGrade,
        deleteQuizAttempt,
        deleteQuizAttempts,
        resetDemoData,
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
