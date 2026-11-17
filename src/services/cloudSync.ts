import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  OperationType,
  handleFirestoreError,
  makeAssignmentDocId,
  makeAttemptDocId,
  makeCourseFeedId,
  makeCourseJoinCode,
  makeCourseMemberId,
  makeStudentDocId,
  sanitizeFirestoreId,
  sha256Hex,
  stripUndefinedDeep,
} from '../firebase';
import {
  PerformanceLevel,
  QuizAssignment,
  QuizAttempt,
  Student,
  ThemePaletteId,
} from '../types';

export interface CloudTeacherProfile {
  uid: string;
  teacherId: string;
  name: string;
  email: string;
  schoolName: string;
  commune: string;
  rbd: string;
  activeTheme: ThemePaletteId;
  seededInitialData: boolean;
}

export interface CourseJoinPreviewStudent {
  studentId: string;
  name: string;
  accessCode: string;
}

export interface CourseJoinCodeDirectory {
  joinCode: string;
  ownerUid: string;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseSection: string;
  studentsPreview: CourseJoinPreviewStudent[];
}

export interface StudentDirectoryEntry {
  accessCode: string;
  studentDocId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  teacherId: string;
  teacherName: string;
  ownerUid: string;
  pinHash: string;
  hasCustomPin: boolean;
  linkedStudentUid: string;
}

const VALID_THEMES: ThemePaletteId[] = ['estandar', 'pastel', 'claro', 'nocturno', 'vibrante'];

function clampStr(val: string | undefined, maxLen: number, fallback = ''): string {
  const s = (val ?? fallback).toString().trim();
  return s.slice(0, maxLen);
}

function normalizeTheme(theme: ThemePaletteId | undefined): ThemePaletteId {
  return theme && VALID_THEMES.includes(theme) ? theme : 'estandar';
}

type BatchOp = (batch: ReturnType<typeof writeBatch>) => void;

async function commitBatchOpsInChunks(ops: BatchOp[], opType: OperationType, path: string): Promise<void> {
  const CHUNK_SIZE = 380;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(fn => fn(batch));
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, opType, path);
    }
  }
}

export async function ensureTeacherProfileCloud(params: {
  uid: string;
  name: string;
  email: string;
  activeTheme: ThemePaletteId;
}): Promise<CloudTeacherProfile> {
  const ref = doc(db, 'teachers', params.uid);
  const path = `teachers/${params.uid}`;

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as CloudTeacherProfile;
      return {
        uid: data.uid,
        teacherId: data.teacherId,
        name: data.name || params.name,
        email: data.email || params.email,
        schoolName: data.schoolName || 'Escuela Ricardo Silva Arriagada',
        commune: data.commune || 'SLEP Chinchorro · Arica',
        rbd: data.rbd || '102-4',
        activeTheme: normalizeTheme(data.activeTheme),
        seededInitialData: Boolean(data.seededInitialData),
      };
    }

    const newProfile: CloudTeacherProfile = {
      uid: params.uid,
      teacherId: params.uid,
      name: clampStr(params.name, 120, 'Docente'),
      email: clampStr(params.email, 160, ''),
      schoolName: 'Escuela Ricardo Silva Arriagada',
      commune: 'SLEP Chinchorro · Arica',
      rbd: '102-4',
      activeTheme: normalizeTheme(params.activeTheme),
      seededInitialData: false,
    };

    await setDoc(ref, {
      ...newProfile,
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateTeacherThemeCloud(uid: string, activeTheme: ThemePaletteId): Promise<void> {
  const ref = doc(db, 'teachers', uid);
  try {
    await updateDoc(ref, {
      activeTheme: normalizeTheme(activeTheme),
      serverUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `teachers/${uid}`);
  }
}

async function resolveUniqueAccessCode(desiredCode: string, ownerUid: string): Promise<string> {
  const base = sanitizeFirestoreId(desiredCode.toUpperCase(), 24);
  const suffix = ownerUid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'T1';
  const candidates = [
    base,
    sanitizeFirestoreId(`${base}-${suffix}`, 32),
    sanitizeFirestoreId(`${base}-${suffix}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`, 32),
  ];

  for (const candidate of candidates) {
    try {
      const snap = await getDoc(doc(db, 'studentDirectory', candidate));
      if (!snap.exists()) return candidate;
      const existingData = snap.data() as { ownerUid?: string };
      if (existingData.ownerUid === ownerUid) return candidate;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `studentDirectory/${candidate}`);
    }
  }
  return sanitizeFirestoreId(`ST-${suffix}-${Date.now().toString(36).toUpperCase()}`, 32);
}

export async function seedTeacherWorkspaceCloud(ownerUid: string): Promise<void> {
  // Start every teacher cleanly with zero simulated students, exams, or grades
  try {
    await updateDoc(doc(db, 'teachers', ownerUid), {
      seededInitialData: true,
      serverUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `teachers/${ownerUid}`);
  }
}

export async function clearAllTeacherCloudData(ownerUid: string): Promise<void> {
  const ops: BatchOp[] = [];
  const collectionsToClear = [
    'attempts',
    'assignments',
    'courseFeeds',
    'courseMembers',
    'courseJoinCodes',
    'studentDirectory',
    'teacherRosterStudents',
  ] as const;

  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(
        query(collection(db, colName), where('ownerUid', '==', ownerUid))
      );
      snap.docs.forEach(d => {
        ops.push(batch => batch.delete(d.ref));
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colName);
    }
  }

  if (ops.length > 0) {
    await commitBatchOpsInChunks(ops, OperationType.DELETE, 'teacherCloudWorkspace');
  }
}

export async function addStudentsCloud(
  ownerUid: string,
  teacherName: string,
  courseId: string,
  courseSection: string,
  newStudents: Student[],
  allCourseStudentsAfter: Student[]
): Promise<void> {
  const cleanTeacherName = clampStr(teacherName, 120, 'Docente');
  const joinCode = makeCourseJoinCode(ownerUid, courseId);
  const joinRef = doc(db, 'courseJoinCodes', joinCode);
  let joinExists = false;
  try {
    joinExists = (await getDoc(joinRef)).exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `courseJoinCodes/${joinCode}`);
  }

  const resolvedStudents: (Student & { uniqueCode: string; pinHash: string; docId: string })[] = [];
  for (const st of newStudents) {
    const uniqueCode = await resolveUniqueAccessCode(st.accessCode, ownerUid);
    const pinHash = await sha256Hex(st.pin);
    resolvedStudents.push({
      ...st,
      accessCode: uniqueCode,
      uniqueCode,
      pinHash,
      docId: makeStudentDocId(ownerUid, st.id),
    });
  }

  const codeMap = new Map(resolvedStudents.map(r => [r.id, r.uniqueCode]));
  const preview = allCourseStudentsAfter.slice(0, 80).map(s => ({
    studentId: s.id,
    name: clampStr(s.name, 120),
    accessCode: codeMap.get(s.id) || sanitizeFirestoreId(s.accessCode.toUpperCase(), 32),
  }));

  const ops: BatchOp[] = [];

  for (const st of resolvedStudents) {
    const rosterRef = doc(db, 'teacherRosterStudents', st.docId);
    ops.push(batch =>
      batch.set(rosterRef, {
        id: st.id,
        ownerUid,
        teacherId: ownerUid,
        name: clampStr(st.name, 120),
        rut: clampStr(st.rut, 24),
        courseId: st.courseId,
        accessCode: st.uniqueCode,
        pin: clampStr(st.pin, 16),
        hasCustomPin: false,
        linkedStudentUid: '',
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      })
    );

    const dirRef = doc(db, 'studentDirectory', st.uniqueCode);
    ops.push(batch =>
      batch.set(dirRef, {
        accessCode: st.uniqueCode,
        studentDocId: st.docId,
        studentId: st.id,
        studentName: clampStr(st.name, 120),
        courseId: st.courseId,
        teacherId: ownerUid,
        teacherName: cleanTeacherName,
        ownerUid,
        pinHash: st.pinHash,
        hasCustomPin: false,
        linkedStudentUid: '',
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      })
    );
  }

  if (joinExists) {
    ops.push(batch =>
      batch.update(joinRef, {
        teacherName: cleanTeacherName,
        courseSection: clampStr(courseSection, 64),
        studentsPreview: preview,
        serverUpdatedAt: serverTimestamp(),
      })
    );
  } else {
    ops.push(batch =>
      batch.set(joinRef, {
        joinCode,
        ownerUid,
        teacherId: ownerUid,
        teacherName: cleanTeacherName,
        courseId,
        courseSection: clampStr(courseSection, 64),
        studentsPreview: preview,
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      })
    );
  }

  await commitBatchOpsInChunks(ops, OperationType.WRITE, 'teacherRosterStudents');
}

export async function removeStudentsCloud(
  ownerUid: string,
  teacherName: string,
  courseId: string,
  courseSection: string,
  studentsToRemove: Student[],
  remainingCourseStudents: Student[]
): Promise<void> {
  if (studentsToRemove.length === 0) return;

  const joinCode = makeCourseJoinCode(ownerUid, courseId);
  const joinRef = doc(db, 'courseJoinCodes', joinCode);
  let joinExists = false;
  try {
    joinExists = (await getDoc(joinRef)).exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `courseJoinCodes/${joinCode}`);
  }

  const ops: BatchOp[] = [];
  for (const st of studentsToRemove) {
    const docId = makeStudentDocId(ownerUid, st.id);
    ops.push(batch => batch.delete(doc(db, 'teacherRosterStudents', docId)));
    if (st.accessCode) {
      ops.push(batch => batch.delete(doc(db, 'studentDirectory', sanitizeFirestoreId(st.accessCode.toUpperCase(), 32))));
    }
  }

  if (joinExists) {
    ops.push(batch =>
      batch.update(joinRef, {
        teacherName: clampStr(teacherName, 120, 'Docente'),
        courseSection: clampStr(courseSection, 64),
        studentsPreview: remainingCourseStudents.slice(0, 80).map(s => ({
          studentId: s.id,
          name: clampStr(s.name, 120),
          accessCode: sanitizeFirestoreId(s.accessCode.toUpperCase(), 32),
        })),
        serverUpdatedAt: serverTimestamp(),
      })
    );
  }

  await commitBatchOpsInChunks(ops, OperationType.DELETE, 'teacherRosterStudents');
}

export async function unlinkStudentGoogleCloud(ownerUid: string, student: Student): Promise<void> {
  const docId = makeStudentDocId(ownerUid, student.id);
  const accessCode = sanitizeFirestoreId(student.accessCode.toUpperCase(), 32);
  const ops: BatchOp[] = [
    batch =>
      batch.update(doc(db, 'teacherRosterStudents', docId), {
        linkedStudentUid: '',
        serverUpdatedAt: serverTimestamp(),
      }),
    batch =>
      batch.update(doc(db, 'studentDirectory', accessCode), {
        linkedStudentUid: '',
        serverUpdatedAt: serverTimestamp(),
      }),
  ];
  await commitBatchOpsInChunks(ops, OperationType.UPDATE, `teacherRosterStudents/${docId}`);
}

export async function addQuizAssignmentCloud(
  ownerUid: string,
  assignment: QuizAssignment,
  courseAssignmentsAfter: QuizAssignment[]
): Promise<void> {
  const assignmentDocId = makeAssignmentDocId(ownerUid, assignment.id);
  const quizRef = doc(db, 'assignments', assignmentDocId);

  const feedId = makeCourseFeedId(ownerUid, assignment.courseId);
  const feedRef = doc(db, 'courseFeeds', feedId);

  let feedExists = false;
  try {
    feedExists = (await getDoc(feedRef)).exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `courseFeeds/${feedId}`);
  }

  const assignmentIds = Array.from(
    new Set(courseAssignmentsAfter.map(a => makeAssignmentDocId(ownerUid, a.id)))
  ).slice(0, 100);

  const ops: BatchOp[] = [
    batch =>
      batch.set(quizRef, {
        id: assignment.id,
        ownerUid,
        code: clampStr(assignment.code, 40),
        title: clampStr(assignment.title, 200),
        courseId: assignment.courseId,
        teacherId: ownerUid,
        teacherName: clampStr(assignment.teacherName || 'Docente', 120),
        gradeLevel: assignment.gradeLevel,
        axis: assignment.axis,
        oaCode: clampStr(assignment.oaCode, 40),
        difficulty: assignment.difficulty,
        totalQuestions: Math.min(50, Math.max(1, assignment.totalQuestions)),
        deadline: clampStr(assignment.deadline, 32),
        timeLimitMinutes: Math.min(240, Math.max(0, assignment.timeLimitMinutes || 0)),
        questions: stripUndefinedDeep(assignment.questions.slice(0, 50)),
        createdAt: clampStr(assignment.createdAt, 40, new Date().toISOString().split('T')[0]),
        isSimce: Boolean(assignment.isSimce),
        simceAxisFilter: clampStr(assignment.simceAxisFilter || '', 32),
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      }),
  ];

  if (feedExists) {
    ops.push(batch =>
      batch.update(feedRef, {
        assignmentIds,
        serverUpdatedAt: serverTimestamp(),
      })
    );
  } else {
    ops.push(batch =>
      batch.set(feedRef, {
        feedId,
        ownerUid,
        courseId: assignment.courseId,
        assignmentIds,
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      })
    );
  }

  await commitBatchOpsInChunks(ops, OperationType.WRITE, `assignments/${assignmentDocId}`);
}

export async function deleteQuizAssignmentCloud(
  ownerUid: string,
  assignment: QuizAssignment,
  remainingCourseAssignments: QuizAssignment[]
): Promise<void> {
  const assignmentDocId = makeAssignmentDocId(ownerUid, assignment.id);
  const feedId = makeCourseFeedId(ownerUid, assignment.courseId);
  const feedRef = doc(db, 'courseFeeds', feedId);

  let feedExists = false;
  try {
    feedExists = (await getDoc(feedRef)).exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `courseFeeds/${feedId}`);
  }

  const assignmentIds = remainingCourseAssignments
    .map(a => makeAssignmentDocId(ownerUid, a.id))
    .slice(0, 100);

  const ops: BatchOp[] = [batch => batch.delete(doc(db, 'assignments', assignmentDocId))];
  if (feedExists) {
    ops.push(batch =>
      batch.update(feedRef, {
        assignmentIds,
        serverUpdatedAt: serverTimestamp(),
      })
    );
  }

  await commitBatchOpsInChunks(ops, OperationType.DELETE, `assignments/${assignmentDocId}`);
}

export async function recordQuizAttemptCloud(params: {
  attempt: QuizAttempt;
  ownerUid: string;
  studentUid: string;
}): Promise<void> {
  const { attempt, ownerUid, studentUid } = params;
  const attemptDocId = makeAttemptDocId(ownerUid, attempt.id);
  const assignmentDocId = attempt.assignmentDocId || makeAssignmentDocId(ownerUid, attempt.quizId);
  const ref = doc(db, 'attempts', attemptDocId);

  try {
    await setDoc(ref, {
      id: attempt.id,
      ownerUid,
      studentUid,
      quizId: attempt.quizId,
      assignmentDocId,
      quizTitle: clampStr(attempt.quizTitle, 200),
      oaCode: clampStr(attempt.oaCode, 40),
      axis: attempt.axis,
      studentId: attempt.studentId,
      studentName: clampStr(attempt.studentName, 120),
      courseId: attempt.courseId,
      teacherId: ownerUid,
      answers: stripUndefinedDeep(attempt.answers.slice(0, 50)),
      score: Math.max(0, Math.min(attempt.totalQuestions, attempt.score)),
      totalQuestions: Math.max(1, Math.min(50, attempt.totalQuestions)),
      percentage: Math.max(0, Math.min(100, Math.round(attempt.percentage))),
      chileanGrade: Math.max(1.0, Math.min(7.0, Number(attempt.chileanGrade.toFixed(1)))),
      performanceLevel: attempt.performanceLevel,
      completedAt: clampStr(attempt.completedAt, 40),
      durationSeconds: Math.max(0, Math.min(86400, Math.round(attempt.durationSeconds || 0))),
      isSimce: Boolean(attempt.isSimce),
      simceScore: Math.max(0, Math.min(450, Math.round(attempt.simceScore || 0))),
      simceLevel: clampStr(attempt.simceLevel || '', 24),
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `attempts/${attemptDocId}`);
  }
}

export async function updateQuizAttemptGradeCloud(
  ownerUid: string,
  attemptId: string,
  chileanGrade: number,
  percentage: number,
  performanceLevel: PerformanceLevel
): Promise<void> {
  const attemptDocId = makeAttemptDocId(ownerUid, attemptId);
  try {
    await updateDoc(doc(db, 'attempts', attemptDocId), {
      chileanGrade: Math.max(1.0, Math.min(7.0, Number(chileanGrade.toFixed(1)))),
      percentage: Math.max(0, Math.min(100, Math.round(percentage))),
      performanceLevel,
      serverUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `attempts/${attemptDocId}`);
  }
}

export async function deleteQuizAttemptsCloud(ownerUid: string, attemptIds: string[]): Promise<void> {
  if (attemptIds.length === 0) return;
  const ops: BatchOp[] = attemptIds.map(id => {
    const attemptDocId = makeAttemptDocId(ownerUid, id);
    return batch => batch.delete(doc(db, 'attempts', attemptDocId));
  });
  await commitBatchOpsInChunks(ops, OperationType.DELETE, 'attempts');
}

export async function backfillStudentUidOnAttemptsCloud(
  ownerUid: string,
  attemptIds: string[],
  studentUid: string
): Promise<void> {
  if (attemptIds.length === 0 || !studentUid) return;
  const ops: BatchOp[] = attemptIds.map(id => {
    const attemptDocId = makeAttemptDocId(ownerUid, id);
    return batch =>
      batch.update(doc(db, 'attempts', attemptDocId), {
        studentUid,
        serverUpdatedAt: serverTimestamp(),
      });
  });
  await commitBatchOpsInChunks(ops, OperationType.UPDATE, 'attempts');
}

export async function updateStudentPinCloud(student: Student, newPin: string): Promise<void> {
  const ownerUid = student.ownerUid;
  if (!ownerUid) return;
  const studentDocId = makeStudentDocId(ownerUid, student.id);
  const accessCode = sanitizeFirestoreId(student.accessCode.toUpperCase(), 32);
  const pinHash = await sha256Hex(newPin);

  const ops: BatchOp[] = [
    batch =>
      batch.update(doc(db, 'teacherRosterStudents', studentDocId), {
        pin: clampStr(newPin, 16),
        hasCustomPin: true,
        serverUpdatedAt: serverTimestamp(),
      }),
    batch =>
      batch.update(doc(db, 'studentDirectory', accessCode), {
        pinHash,
        hasCustomPin: true,
        serverUpdatedAt: serverTimestamp(),
      }),
  ];

  await commitBatchOpsInChunks(ops, OperationType.UPDATE, `teacherRosterStudents/${studentDocId}`);
}

export async function lookupCourseJoinCodeCloud(
  joinCode: string
): Promise<{ ok: boolean; directory?: CourseJoinCodeDirectory; error?: string }> {
  const cleanJoinCode = sanitizeFirestoreId(joinCode.trim().toUpperCase(), 48);
  if (!cleanJoinCode || cleanJoinCode.length < 4) {
    return { ok: false, error: 'Ingresa un Código de Curso válido entregado por tu profesor(a).' };
  }

  try {
    const snap = await getDoc(doc(db, 'courseJoinCodes', cleanJoinCode));
    if (!snap.exists()) {
      return {
        ok: false,
        error: `No se encontró el curso con código "${cleanJoinCode}". Verifica con tu profesor(a).`,
      };
    }
    return { ok: true, directory: snap.data() as CourseJoinCodeDirectory };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `courseJoinCodes/${cleanJoinCode}`);
  }
}

export async function claimStudentWithAccessCodeCloud(params: {
  accessCode: string;
  pin: string;
  firebaseUid: string;
}): Promise<{ ok: boolean; student?: Student; error?: string }> {
  const cleanCode = sanitizeFirestoreId(params.accessCode.trim().toUpperCase(), 32);
  const cleanPin = params.pin.trim();

  if (!cleanCode || !cleanPin) {
    return { ok: false, error: 'Ingresa tu código de estudiante y tu PIN personal.' };
  }

  const dirRef = doc(db, 'studentDirectory', cleanCode);
  let dirSnap;
  try {
    dirSnap = await getDoc(dirRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `studentDirectory/${cleanCode}`);
  }

  if (!dirSnap.exists()) {
    return { ok: false, error: 'Código de estudiante no encontrado. Verifica con tu profesor(a).' };
  }

  const entry = dirSnap.data() as StudentDirectoryEntry;
  const inputHash = await sha256Hex(cleanPin);
  if (inputHash !== entry.pinHash) {
    return { ok: false, error: 'PIN incorrecto. Verifica tu clave o pídela a tu profesor(a).' };
  }

  if (entry.linkedStudentUid && entry.linkedStudentUid !== params.firebaseUid) {
    return {
      ok: false,
      error:
        'Este código de estudiante ya está vinculado a otra cuenta Google. Pídele a tu profesor(a) desvincularla en Lista de Curso si cambiaste de correo o dispositivo.',
    };
  }

  const memberDocId = makeCourseMemberId(entry.ownerUid, entry.courseId, params.firebaseUid);
  const memberRef = doc(db, 'courseMembers', memberDocId);
  let memberExists = false;
  try {
    memberExists = (await getDoc(memberRef)).exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `courseMembers/${memberDocId}`);
  }

  const ops: BatchOp[] = [];
  if (entry.linkedStudentUid !== params.firebaseUid) {
    ops.push(batch =>
      batch.update(dirRef, {
        linkedStudentUid: params.firebaseUid,
        serverUpdatedAt: serverTimestamp(),
      })
    );
    ops.push(batch =>
      batch.update(doc(db, 'teacherRosterStudents', entry.studentDocId), {
        linkedStudentUid: params.firebaseUid,
        serverUpdatedAt: serverTimestamp(),
      })
    );
  }

  if (!memberExists) {
    ops.push(batch =>
      batch.set(memberRef, {
        memberId: memberDocId,
        ownerUid: entry.ownerUid,
        courseId: entry.courseId,
        studentUid: params.firebaseUid,
        studentDocId: entry.studentDocId,
        accessCode: entry.accessCode,
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      })
    );
  }

  if (ops.length > 0) {
    await commitBatchOpsInChunks(ops, OperationType.WRITE, `studentDirectory/${cleanCode}`);
  }

  // Fetch full student record now that user is linked owner
  try {
    const studentSnap = await getDoc(doc(db, 'teacherRosterStudents', entry.studentDocId));
    if (studentSnap.exists()) {
      return { ok: true, student: studentSnap.data() as Student };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `teacherRosterStudents/${entry.studentDocId}`);
  }

  return {
    ok: true,
    student: {
      id: entry.studentId,
      name: entry.studentName,
      rut: '',
      courseId: entry.courseId,
      teacherId: entry.ownerUid,
      ownerUid: entry.ownerUid,
      linkedStudentUid: params.firebaseUid,
      accessCode: entry.accessCode,
      pin: cleanPin,
      hasCustomPin: entry.hasCustomPin,
    },
  };
}

export function subscribeTeacherWorkspaceCloud(
  ownerUid: string,
  callbacks: {
    onStudents: (students: Student[]) => void;
    onAssignments: (assignments: QuizAssignment[]) => void;
    onAttempts: (attempts: QuizAttempt[]) => void;
    onProfile?: (profile: CloudTeacherProfile) => void;
    onError: (err: Error) => void;
  }
): Unsubscribe {
  const unsubProfile = onSnapshot(
    doc(db, 'teachers', ownerUid),
    snap => {
      if (snap.exists() && callbacks.onProfile) {
        callbacks.onProfile(snap.data() as CloudTeacherProfile);
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, `teachers/${ownerUid}`);
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubStudents = onSnapshot(
    query(collection(db, 'teacherRosterStudents'), where('ownerUid', '==', ownerUid)),
    snap => {
      const list = snap.docs.map(d => d.data() as Student);
      list.sort((a, b) => a.accessCode.localeCompare(b.accessCode));
      callbacks.onStudents(list);
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'teacherRosterStudents');
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubAssignments = onSnapshot(
    query(collection(db, 'assignments'), where('ownerUid', '==', ownerUid)),
    snap => {
      const list = snap.docs.map(d => d.data() as QuizAssignment);
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callbacks.onAssignments(list);
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'assignments');
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubAttempts = onSnapshot(
    query(collection(db, 'attempts'), where('ownerUid', '==', ownerUid)),
    snap => {
      const list = snap.docs.map(d => d.data() as QuizAttempt);
      list.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
      callbacks.onAttempts(list);
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'attempts');
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    unsubProfile();
    unsubStudents();
    unsubAssignments();
    unsubAttempts();
  };
}

export function subscribeLinkedStudentSeatsCloud(
  studentUid: string,
  callbacks: {
    onSeats: (seats: Student[]) => void;
    onError: (err: Error) => void;
  }
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'teacherRosterStudents'), where('linkedStudentUid', '==', studentUid)),
    snap => {
      const seats = snap.docs.map(d => d.data() as Student);
      callbacks.onSeats(seats);
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'teacherRosterStudents');
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeStudentCourseAndAttemptsCloud(
  params: {
    studentUid: string;
    ownerUid: string;
    courseId: string;
  },
  callbacks: {
    onAssignments: (assignments: QuizAssignment[]) => void;
    onAttempts: (attempts: QuizAttempt[]) => void;
    onError: (err: Error) => void;
  }
): Unsubscribe {
  const { studentUid, ownerUid, courseId } = params;
  const feedId = makeCourseFeedId(ownerUid, courseId);

  const assignmentMap = new Map<string, QuizAssignment>();
  const assignmentUnsubs = new Map<string, Unsubscribe>();

  const emitAssignments = () => {
    const arr = Array.from(assignmentMap.values());
    arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callbacks.onAssignments(arr);
  };

  const unsubFeed = onSnapshot(
    doc(db, 'courseFeeds', feedId),
    snap => {
      const activeIds = new Set<string>(
        snap.exists() ? ((snap.data()?.assignmentIds as string[]) || []) : []
      );

      // Clean up removed assignments immediately
      for (const [docId, unsub] of assignmentUnsubs.entries()) {
        if (!activeIds.has(docId)) {
          unsub();
          assignmentUnsubs.delete(docId);
          assignmentMap.delete(docId);
        }
      }
      if (activeIds.size === 0) {
        emitAssignments();
      }

      // Subscribe to each active assignment doc
      for (const docId of activeIds) {
        if (!assignmentUnsubs.has(docId)) {
          const u = onSnapshot(
            doc(db, 'assignments', docId),
            aSnap => {
              if (aSnap.exists()) {
                assignmentMap.set(docId, aSnap.data() as QuizAssignment);
              } else {
                assignmentMap.delete(docId);
              }
              emitAssignments();
            },
            err => {
              try {
                handleFirestoreError(err, OperationType.GET, `assignments/${docId}`);
              } catch (wrapped) {
                callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
              }
            }
          );
          assignmentUnsubs.set(docId, u);
        }
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, `courseFeeds/${feedId}`);
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubAttempts = onSnapshot(
    query(collection(db, 'attempts'), where('studentUid', '==', studentUid)),
    snap => {
      const list = snap.docs.map(d => d.data() as QuizAttempt);
      list.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
      callbacks.onAttempts(list);
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'attempts');
      } catch (wrapped) {
        callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    unsubFeed();
    unsubAttempts();
    assignmentUnsubs.forEach(u => u());
    assignmentUnsubs.clear();
  };
}
