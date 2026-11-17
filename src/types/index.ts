export type GradeLevel = 
  | '1_basico' 
  | '2_basico' 
  | '3_basico' 
  | '4_basico' 
  | '5_basico' 
  | '6_basico' 
  | '7_basico' 
  | '8_basico';

export type ThematicAxis = 
  | 'numeros_operaciones' 
  | 'patrones_algebra' 
  | 'geometria' 
  | 'medicion' 
  | 'datos_probabilidades';

export type DifficultyLevel = 'facil' | 'medio' | 'dificil' | 'progresivo';

export type PerformanceLevel = 'Insuficiente' | 'Elemental' | 'Adecuado';

export type ThemePaletteId = 'estandar' | 'pastel' | 'claro' | 'nocturno' | 'vibrante';

export interface LearningObjective {
  code: string; // e.g. "OA 03"
  grade: GradeLevel;
  axis: ThematicAxis;
  title: string;
  description: string;
  indicators: string[];
}

export type VisualType = 
  | 'none' 
  | 'fraction_bar' 
  | 'fraction_circle' 
  | 'grid_multiplication' 
  | 'geometry_shape' 
  | 'clock' 
  | 'number_line' 
  | 'balance_equation'
  | 'bar_chart'
  | 'table_data'
  | 'angle_figure'
  | 'cube_prism';

export type SimceGradeLevel = '4_basico' | '6_basico' | '8_basico';

export type SimceSkill =
  | 'Resolver problemas'
  | 'Representar'
  | 'Modelar'
  | 'Argumentar y comunicar';

export interface Question {
  id: string;
  prompt: string;
  context?: string; // Chilean story context or stimulus expression
  visualType: VisualType;
  visualData?: any;
  questionType: 'numeric' | 'multiple_choice';
  options?: string[];
  correctAnswer: string;
  hint?: string;
  explanation: string;
  oaCode: string;
  difficulty: DifficultyLevel;
  categoryLabel?: string; // e.g. "Problema Cotidiano", "Cálculo y Algoritmo", "Geometría Visual"
  isSimce?: boolean;
  axis?: ThematicAxis;
  simceSkill?: SimceSkill;
  simceSource?: string;
}

export interface Student {
  id: string;
  name: string;
  rut: string;
  courseId: string;
  teacherId: string; // owner teacher who loaded this student list
  accessCode: string; // e.g. MAT-5A-01
  pin: string; // e.g. 4821
  hasCustomPin?: boolean; // indicates if the student has set their personal PIN
  avatarSeed?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  password?: string;
  hasCustomPassword?: boolean;
  schoolName: string;
  commune: string;
  rbd: string;
}

export interface Course {
  id: string;
  grade: GradeLevel;
  section: string; // e.g. "5° Básico A"
  schoolName: string;
  rbd: string;
  commune: string;
  teacherName: string;
  academicYear: number;
}

export interface QuizAssignment {
  id: string;
  code: string; // e.g. "QUIZ-7821"
  title: string;
  courseId: string;
  teacherId: string; // owner teacher who created/sent this exam
  teacherName?: string;
  gradeLevel: GradeLevel;
  axis: ThematicAxis;
  oaCode: string;
  difficulty: DifficultyLevel;
  totalQuestions: number; // 5 to 24
  deadline: string; // YYYY-MM-DD
  timeLimitMinutes: number; // 0 for no limit
  questions: Question[];
  createdAt: string;
  isSimce?: boolean;
  simceAxisFilter?: ThematicAxis | 'all';
}

export interface QuestionAnswer {
  questionId: string;
  prompt: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  oaCode: string;
  axis: ThematicAxis;
  studentId: string;
  studentName: string;
  courseId: string;
  teacherId?: string;
  answers: QuestionAnswer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  chileanGrade: number; // 1.0 - 7.0
  performanceLevel: PerformanceLevel;
  completedAt: string;
  durationSeconds: number;
  isSimce?: boolean;
  simceScore?: number;
  simceLevel?: PerformanceLevel;
}

export type TeacherTab = 
  | 'matrix' 
  | 'quizzes' 
  | 'create_quiz' 
  | 'simce'
  | 'courses' 
  | 'stats' 
  | 'reports' 
  | 'curriculum';

export interface ParentReport {
  student: Student;
  course: Course;
  attempts: QuizAttempt[];
  averageGrade: number;
  averageAchievement: number;
  overallPerformance: PerformanceLevel;
  strengths: string[];
  growthAreas: string[];
  pedagogicalRecommendations: string;
  generatedDate: string;
}
