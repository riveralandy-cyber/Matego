import { Course, Student, QuizAssignment, QuizAttempt, QuestionAnswer } from '../types';
import { generateQuestionsForOA } from '../utils/questionGenerator';
import { calculateChileanGrade } from '../utils/chileanGrades';

export const INITIAL_COURSES: Course[] = [
  // 1° Básico
  {
    id: 'course-1a',
    grade: '1_basico',
    section: '1° Básico A',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  {
    id: 'course-1b',
    grade: '1_basico',
    section: '1° Básico B',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  // 2° Básico
  {
    id: 'course-2a',
    grade: '2_basico',
    section: '2° Básico A',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  {
    id: 'course-2b',
    grade: '2_basico',
    section: '2° Básico B',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  // 3° Básico
  {
    id: 'course-3a',
    grade: '3_basico',
    section: '3° Básico A',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  {
    id: 'course-3b',
    grade: '3_basico',
    section: '3° Básico B',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  // 4° Básico
  {
    id: 'course-4a',
    grade: '4_basico',
    section: '4° Básico A',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  {
    id: 'course-4b',
    grade: '4_basico',
    section: '4° Básico B',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  // 5° Básico
  {
    id: 'course-5a',
    grade: '5_basico',
    section: '5° Básico A',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  {
    id: 'course-5b',
    grade: '5_basico',
    section: '5° Básico B',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  // 6° Básico
  {
    id: 'course-6a',
    grade: '6_basico',
    section: '6° Básico A',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  {
    id: 'course-6b',
    grade: '6_basico',
    section: '6° Básico B',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  // 7° Básico (Main classroom from screenshot)
  {
    id: 'course-7a',
    grade: '7_basico',
    section: '7° Básico A',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  {
    id: 'course-7b',
    grade: '7_basico',
    section: '7° Básico B',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  // 8° Básico
  {
    id: 'course-8a',
    grade: '8_basico',
    section: '8° Básico A',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
  {
    id: 'course-8b',
    grade: '8_basico',
    section: '8° Básico B',
    schoolName: 'Escuela Ricardo Silva Arriagada',
    rbd: '102-4',
    commune: 'SLEP Chinchorro · Arica',
    teacherName: 'Prof. Landy Rivera',
    academicYear: 2026,
  },
];

// Exact students from user's screenshot for 7°A Escuela Ricardo Silva Arriagada
const STUDENTS_7A_RAW: { apellido: string; nombre: string }[] = [
  { apellido: 'VÁSQUEZ', nombre: 'AINHOA' },
  { apellido: 'CASTILLO', nombre: 'ALAN' },
  { apellido: 'ALDEA', nombre: 'ALONSO' },
  { apellido: 'HENRY', nombre: 'AMELIA' },
  { apellido: 'ETIENNE', nombre: 'AMSTY' },
  { apellido: 'FLORES', nombre: 'ANGEL' },
  { apellido: 'SEGOVIA', nombre: 'ARTURO' },
  { apellido: 'VILLAGRAN', nombre: 'BELEN' },
  { apellido: 'URQUIETA', nombre: 'ELOÍSA' },
  { apellido: 'SÁNCHEZ', nombre: 'EMELY' },
  { apellido: 'VEAS', nombre: 'EMILIO' },
  { apellido: 'SAGARDÍA', nombre: 'FACUNDO' },
  { apellido: 'MUÑOZ', nombre: 'GASPAR' },
  { apellido: 'BALTAZAR', nombre: 'IAN' },
  { apellido: 'ROMANQUE', nombre: 'IVANNA' },
  { apellido: 'KARL', nombre: 'JAYRO' },
  { apellido: 'ROMERO', nombre: 'JOAQUÍN' },
  { apellido: 'COLAN', nombre: 'KATIE' },
  { apellido: 'MONSALVE', nombre: 'LESLIE' },
  { apellido: 'ESCOBAR', nombre: 'MARTINA' },
  { apellido: 'ORTIZ', nombre: 'MATTEO' },
  { apellido: 'SANDOVAL', nombre: 'OSCAR' },
  { apellido: 'BARBACHAN', nombre: 'RAFAEL' },
  { apellido: 'MEDINA', nombre: 'RAFAEL' },
  { apellido: 'FLORES', nombre: 'RENATO' },
  { apellido: 'QUISPE', nombre: 'SAID' },
  { apellido: 'CORTÉS', nombre: 'SOFÍA IGNACIA' },
  { apellido: 'CORTÉS', nombre: 'SOFÍA MAGDALE' },
  { apellido: 'CANO', nombre: 'TEO' },
  { apellido: 'HERRERA', nombre: 'VICTORIA' },
];

export const INITIAL_STUDENTS: Student[] = [
  ...STUDENTS_7A_RAW.map((item, idx) => {
    const num = idx + 1;
    const numStr = num < 10 ? `0${num}` : `${num}`;
    return {
      id: `st-7a-${num}`,
      name: `${item.nombre} ${item.apellido}`,
      rut: `22.${Math.floor(200 + idx * 17)}.${Math.floor(100 + idx * 23)}-${(idx % 9) + 1}`,
      courseId: 'course-7a',
      teacherId: 't-1',
      accessCode: `MAT-7A-${numStr}`,
      pin: `${2000 + idx * 37}`,
    };
  }),

  // Sample students for other courses (5°A, 4°A, 8°A) loaded by t-1
  { id: 'st-501', name: 'Martina Ignacia Silva González', rut: '23.412.890-4', courseId: 'course-5a', teacherId: 't-1', accessCode: 'MAT-5A-01', pin: '4821' },
  { id: 'st-502', name: 'Benjamín Alonso Muñoz Rojas', rut: '23.589.123-K', courseId: 'course-5a', teacherId: 't-1', accessCode: 'MAT-5A-02', pin: '7392' },
  { id: 'st-503', name: 'Catalina Andrea Soto Morales', rut: '23.671.455-8', courseId: 'course-5a', teacherId: 't-1', accessCode: 'MAT-5A-03', pin: '1904' },
  { id: 'st-504', name: 'Vicente Tomás Díaz Contreras', rut: '23.490.871-2', courseId: 'course-5a', teacherId: 't-1', accessCode: 'MAT-5A-04', pin: '8215' },
  { id: 'st-401', name: 'Emilia Ignacia Carrasco Peña', rut: '24.120.345-6', courseId: 'course-4a', teacherId: 't-1', accessCode: 'MAT-4A-01', pin: '3189' },
  { id: 'st-402', name: 'Agustín Andrés Espinoza Pinto', rut: '24.234.901-2', courseId: 'course-4a', teacherId: 't-1', accessCode: 'MAT-4A-02', pin: '9420' },
  { id: 'st-801', name: 'Matías Nicolás Arancibia Vera', rut: '21.902.341-2', courseId: 'course-8a', teacherId: 't-1', accessCode: 'MAT-8A-01', pin: '6543' },
  { id: 'st-802', name: 'Valentina Javiera Tapia Ríos', rut: '21.845.109-8', courseId: 'course-8a', teacherId: 't-1', accessCode: 'MAT-8A-02', pin: '7812' },
];

// ThatQuiz exams from user's screenshot
export const INITIAL_ASSIGNMENTS: QuizAssignment[] = [
  {
    id: 'quiz-7a-1',
    code: 'QUIZ-701',
    title: 'Ecuaciones',
    courseId: 'course-7a',
    teacherId: 't-1',
    teacherName: 'Landy Rivera',
    gradeLevel: '7_basico',
    axis: 'patrones_algebra',
    oaCode: 'OA 08',
    difficulty: 'medio',
    totalQuestions: 10,
    deadline: '2026-08-15',
    timeLimitMinutes: 20,
    questions: generateQuestionsForOA({
      grade: '7_basico',
      oaCode: 'OA 08',
      difficulty: 'medio',
      count: 10,
    }),
    createdAt: '2026-07-27',
  },
  {
    id: 'quiz-7a-2',
    code: 'QUIZ-702',
    title: 'Inecuaciones',
    courseId: 'course-7a',
    teacherId: 't-1',
    teacherName: 'Landy Rivera',
    gradeLevel: '7_basico',
    axis: 'patrones_algebra',
    oaCode: 'OA 08',
    difficulty: 'medio',
    totalQuestions: 10,
    deadline: '2026-08-20',
    timeLimitMinutes: 20,
    questions: generateQuestionsForOA({
      grade: '7_basico',
      oaCode: 'OA 08',
      difficulty: 'medio',
      count: 10,
    }),
    createdAt: '2026-08-01',
  },
  {
    id: 'quiz-7a-3',
    code: 'QUIZ-703',
    title: 'Ubicación en el plano',
    courseId: 'course-7a',
    teacherId: 't-1',
    teacherName: 'Landy Rivera',
    gradeLevel: '7_basico',
    axis: 'geometria',
    oaCode: 'OA 11',
    difficulty: 'facil',
    totalQuestions: 8,
    deadline: '2026-08-25',
    timeLimitMinutes: 15,
    questions: generateQuestionsForOA({
      grade: '7_basico',
      oaCode: 'OA 11',
      difficulty: 'facil',
      count: 8,
    }),
    createdAt: '2026-08-08',
  },
  {
    id: 'quiz-7a-4',
    code: 'QUIZ-704',
    title: 'Plano 2',
    courseId: 'course-7a',
    teacherId: 't-1',
    teacherName: 'Landy Rivera',
    gradeLevel: '7_basico',
    axis: 'geometria',
    oaCode: 'OA 11',
    difficulty: 'medio',
    totalQuestions: 10,
    deadline: '2026-09-05',
    timeLimitMinutes: 20,
    questions: generateQuestionsForOA({
      grade: '7_basico',
      oaCode: 'OA 11',
      difficulty: 'medio',
      count: 10,
    }),
    createdAt: '2026-08-18',
  },
  {
    id: 'quiz-7a-5',
    code: 'QUIZ-705',
    title: 'Ángulos',
    courseId: 'course-7a',
    teacherId: 't-1',
    teacherName: 'Landy Rivera',
    gradeLevel: '7_basico',
    axis: 'geometria',
    oaCode: 'OA 11',
    difficulty: 'medio',
    totalQuestions: 10,
    deadline: '2026-09-12',
    timeLimitMinutes: 20,
    questions: generateQuestionsForOA({
      grade: '7_basico',
      oaCode: 'OA 11',
      difficulty: 'medio',
      count: 10,
    }),
    createdAt: '2026-08-26',
  },
  {
    id: 'quiz-7a-6',
    code: 'QUIZ-706',
    title: 'Ángulos interiores y polígonos',
    courseId: 'course-7a',
    teacherId: 't-1',
    teacherName: 'Landy Rivera',
    gradeLevel: '7_basico',
    axis: 'geometria',
    oaCode: 'OA 11',
    difficulty: 'dificil',
    totalQuestions: 10,
    deadline: '2026-09-20',
    timeLimitMinutes: 25,
    questions: generateQuestionsForOA({
      grade: '7_basico',
      oaCode: 'OA 11',
      difficulty: 'dificil',
      count: 10,
    }),
    createdAt: '2026-09-02',
  },
  {
    id: 'quiz-7a-7',
    code: 'QUIZ-707',
    title: 'Área de paralelógramos',
    courseId: 'course-7a',
    teacherId: 't-1',
    teacherName: 'Landy Rivera',
    gradeLevel: '7_basico',
    axis: 'geometria',
    oaCode: 'OA 11',
    difficulty: 'medio',
    totalQuestions: 8,
    deadline: '2026-09-28',
    timeLimitMinutes: 20,
    questions: generateQuestionsForOA({
      grade: '7_basico',
      oaCode: 'OA 11',
      difficulty: 'medio',
      count: 8,
    }),
    createdAt: '2026-09-10',
  },
  {
    id: 'quiz-7a-8',
    code: 'QUIZ-708',
    title: 'Área de polígonos',
    courseId: 'course-7a',
    teacherId: 't-1',
    teacherName: 'Landy Rivera',
    gradeLevel: '7_basico',
    axis: 'geometria',
    oaCode: 'OA 11',
    difficulty: 'dificil',
    totalQuestions: 10,
    deadline: '2026-10-10',
    timeLimitMinutes: 25,
    questions: generateQuestionsForOA({
      grade: '7_basico',
      oaCode: 'OA 11',
      difficulty: 'dificil',
      count: 10,
    }),
    createdAt: '2026-09-18',
  },

  // 5° Básico quiz
  {
    id: 'quiz-501',
    code: 'QUIZ-5821',
    title: 'Operaciones Combinadas (PAPOMUDAS)',
    courseId: 'course-5a',
    teacherId: 't-1',
    teacherName: 'Landy Rivera',
    gradeLevel: '5_basico',
    axis: 'numeros_operaciones',
    oaCode: 'OA 02',
    difficulty: 'medio',
    totalQuestions: 10,
    deadline: '2026-10-15',
    timeLimitMinutes: 20,
    questions: generateQuestionsForOA({
      grade: '5_basico',
      oaCode: 'OA 02',
      difficulty: 'medio',
      count: 10,
    }),
    createdAt: '2026-09-20',
  },
];

// Matching grades from the user's ThatQuiz screenshot!
// Row data mapping: [Ecuaciones, Inecuaciones, Ubicación, Plano 2, Ángulos, Ángulos Int, Área paralelóg, Área políg]
const SCREENSHOT_MATRIX_DATA: Record<string, (number | null | 'yellow')[]> = {
  'st-7a-1': [5.5, null, null, null, null, null, null, null], // AINHOA VÁSQUEZ
  'st-7a-2': [7.0, 4.0, 4.0, 6.3, 5.5, null, 7.0, null], // ALAN CASTILLO
  'st-7a-3': [5.5, 4.8, 4.8, 6.3, 4.0, 4.9, 5.5, 5.5], // ALONSO ALDEA
  'st-7a-4': [7.0, 7.0, 6.3, 5.5, 5.5, 7.0, 7.0, 5.5], // AMELIA HENRY
  'st-7a-5': [5.5, 6.3, 5.5, 7.0, 6.3, 4.9, 5.5, 4.8], // AMSTY ETIENNE
  'st-7a-6': [7.0, 4.0, null, null, null, null, null, null], // ANGEL FLORES
  'st-7a-7': [5.5, 4.0, 5.5, 7.0, 5.5, 4.9, 'yellow', null], // ARTURO SEGOVIA ('yellow' = guardado no acabado)
  'st-7a-8': [7.0, null, 5.5, 6.3, null, null, null, null], // BELEN VILLAGRAN
  'st-7a-9': [7.0, 5.5, 7.0, 4.8, 6.3, 5.9, 6.3, 7.0], // ELOÍSA URQUIETA
  'st-7a-10': [5.5, 5.5, 7.0, 7.0, 7.0, null, 6.3, 5.5], // EMELY SÁNCHEZ
  'st-7a-11': [null, null, null, null, null, null, null, null], // EMILIO VEAS
  'st-7a-12': [5.5, 4.0, 7.0, 4.0, 6.3, 4.9, 6.3, 7.0], // FACUNDO SAGARDÍA
  'st-7a-13': [5.5, 6.3, 7.0, 5.5, 7.0, 7.0, 5.5, 5.5], // GASPAR MUÑOZ
  'st-7a-14': [7.0, null, 4.0, 5.5, 5.5, null, null, null], // IAN BALTAZAR
  'st-7a-15': [7.0, 7.0, null, null, null, null, null, null], // IVANNA ROMANQUE
  'st-7a-16': [7.0, 5.5, 4.0, 4.0, 7.0, 4.9, 6.3, 5.5], // JAYRO KARL
  'st-7a-17': [5.5, 5.5, 5.5, 6.3, 6.3, 7.0, 5.5, null], // JOAQUÍN ROMERO
  'st-7a-18': [7.0, 7.0, 6.3, 7.0, 7.0, 7.0, 7.0, 'yellow'], // KATIE COLAN
  'st-7a-19': [7.0, null, null, null, null, null, null, null], // LESLIE MONSALVE
  'st-7a-20': [null, null, null, null, null, null, null, null], // MARTINA ESCOBAR
  'st-7a-21': [7.0, 7.0, 6.3, 6.3, 6.3, 4.9, 6.3, 6.3], // MATTEO ORTIZ
  'st-7a-22': [7.0, 7.0, 6.3, 7.0, 7.0, 7.0, 7.0, 6.3], // OSCAR SANDOVAL
  'st-7a-23': [7.0, 7.0, 7.0, 6.3, 6.3, 5.9, 7.0, 6.3], // RAFAEL BARBACHAN
  'st-7a-24': [7.0, null, null, null, null, null, null, null], // RAFAEL MEDINA
  'st-7a-25': [7.0, 6.3, 6.3, 6.3, 7.0, 7.0, null, null], // RENATO FLORES
  'st-7a-26': [7.0, 4.0, 5.5, 4.8, null, null, null, null], // SAID QUISPE
  'st-7a-27': [7.0, 4.8, 6.3, 7.0, 6.3, 5.9, null, null], // SOFÍA IGNACIA CORTÉS
  'st-7a-28': [5.5, 'yellow', null, null, 6.3, 4.9, null, null], // SOFÍA MAGDALE CORTÉS
  'st-7a-29': [5.5, null, null, null, null, 4.8, 4.0, null], // TEO CANO
  'st-7a-30': [7.0, 6.3, 5.5, 7.0, 5.9, 5.5, null, null], // VICTORIA HERRERA
};

export const INITIAL_ATTEMPTS: QuizAttempt[] = [];

// Populate attempts from the matrix data
const QUIZ_IDS_7A = [
  'quiz-7a-1',
  'quiz-7a-2',
  'quiz-7a-3',
  'quiz-7a-4',
  'quiz-7a-5',
  'quiz-7a-6',
  'quiz-7a-7',
  'quiz-7a-8',
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildWrongAnswer(correctAnswer: string, options: string[] | undefined, seed: number): string {
  if (options && options.length > 1) {
    const distractors = options.filter(opt => opt.trim() !== correctAnswer.trim());
    if (distractors.length > 0) {
      return distractors[seed % distractors.length];
    }
  }
  const normalized = correctAnswer.trim().replace(',', '.');
  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    const num = parseFloat(normalized);
    const deltas = [1, -1, 2, -2, 3, 4, -3, 5];
    const delta = deltas[seed % deltas.length];
    const wrong = Number.isInteger(num) ? String(num + delta) : (num + delta * 0.5).toFixed(1).replace('.', ',');
    return wrong === correctAnswer.trim() ? String(num + 10) : wrong;
  }
  return 'Sin coincidencia';
}

Object.entries(SCREENSHOT_MATRIX_DATA).forEach(([studentId, grades]) => {
  const student = INITIAL_STUDENTS.find(s => s.id === studentId);
  if (!student) return;

  grades.forEach((gradeVal, qIdx) => {
    if (gradeVal === null || gradeVal === 'yellow') return;
    const quizId = QUIZ_IDS_7A[qIdx];
    const quiz = INITIAL_ASSIGNMENTS.find(q => q.id === quizId);
    if (!quiz) return;

    const totalQuestions = quiz.totalQuestions;
    // Find score under official 60% exigency closest to gradeVal
    let bestScore = totalQuestions;
    let bestDiff = Infinity;
    for (let s = 0; s <= totalQuestions; s++) {
      const g = calculateChileanGrade(s, totalQuestions, 60);
      const diff = Math.abs(g - (gradeVal as number));
      if (diff < bestDiff) {
        bestDiff = diff;
        bestScore = s;
      }
    }
    const score = bestScore;
    const percentage = Math.round((score / totalQuestions) * 100);
    const wrongCount = Math.max(0, totalQuestions - score);
    const seed = hashSeed(`${studentId}_${quizId}`);

    // Select deterministic wrong question indices
    const wrongIndices = new Set<number>();
    let offset = seed % totalQuestions;
    while (wrongIndices.size < wrongCount) {
      wrongIndices.add(offset % totalQuestions);
      offset += 3;
    }

    let totalDuration = 0;
    const answers: QuestionAnswer[] = quiz.questions.slice(0, totalQuestions).map((q, idx) => {
      const qTime = 11 + ((seed + idx * 7) % 19); // 11s - 29s per item
      totalDuration += qTime;
      const isWrong = wrongIndices.has(idx);
      const studentAnswer = isWrong
        ? buildWrongAnswer(q.correctAnswer, q.options, seed + idx)
        : q.correctAnswer;

      return {
        questionId: q.id,
        prompt: q.context ? `${q.prompt} [${q.context}]` : q.prompt,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect: !isWrong,
        timeSpentSeconds: qTime,
        explanation: q.explanation,
      };
    });

    const perfLevel =
      gradeVal >= 5.1 ? 'Adecuado' : gradeVal >= 4.0 ? 'Elemental' : 'Insuficiente';

    const hour = 8 + (seed % 9);
    const minute = String(10 + (seed % 49)).padStart(2, '0');
    const createdDay = quiz.createdAt || '2026-08-10';

    INITIAL_ATTEMPTS.push({
      id: `att_${studentId}_${quizId}`,
      quizId,
      quizTitle: quiz.title,
      oaCode: quiz.oaCode,
      axis: quiz.axis,
      studentId: student.id,
      studentName: student.name,
      courseId: 'course-7a',
      teacherId: 't-1',
      answers,
      score,
      totalQuestions,
      percentage,
      chileanGrade: gradeVal as number,
      performanceLevel: perfLevel,
      completedAt: `${createdDay.replace(/-/g, '.')} ${hour}:${minute}`,
      durationSeconds: totalDuration,
    });
  });
});
