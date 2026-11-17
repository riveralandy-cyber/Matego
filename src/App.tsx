/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navigation } from './components/Navigation';
import { ThatQuizSidebar } from './components/TeacherDashboard/ThatQuizSidebar';
import { ThatQuizGradeMatrix } from './components/TeacherDashboard/ThatQuizGradeMatrix';
import { QuizListView } from './components/TeacherDashboard/QuizListView';
import { QuizCreator } from './components/TeacherDashboard/QuizCreator';
import { CourseRosterView } from './components/TeacherDashboard/CourseRosterView';
import { StatisticsView } from './components/TeacherDashboard/StatisticsView';
import { ParentReportView } from './components/TeacherDashboard/ParentReportView';
import { CurriculumView } from './components/TeacherDashboard/CurriculumView';
import { TeacherLoginModal } from './components/TeacherDashboard/TeacherLoginModal';
import { TeacherLoginView } from './components/TeacherDashboard/TeacherLoginView';
import { SimceCreatorView } from './components/TeacherDashboard/SimceCreatorView';
import { StudentLogin } from './components/StudentPortal/StudentLogin';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard';
import { ThatQuizExam } from './components/QuizTaker/ThatQuizExam';
import { QuizResultSummary } from './components/QuizTaker/QuizResultSummary';
import { FreePracticeView, FreePracticeConfig } from './components/FreePractice/FreePracticeView';
import { generateQuestionsForOA } from './utils/questionGenerator';
import { buildSimceExamQuestions } from './data/simceQuestionBank';
import { QuizAssignment, QuizAttempt, SimceGradeLevel, Student } from './types';

const GUEST_PRACTICE_STUDENT: Student = {
  id: 'guest-practice',
  name: 'Práctica Libre',
  rut: '',
  courseId: 'free-practice',
  teacherId: 'free-practice',
  accessCode: 'LIBRE',
  pin: '',
};

const MainAppContent: React.FC = () => {
  const {
    role,
    setRole,
    isTeacherAuthenticated,
    activeTeacherTab,
    setActiveTeacherTab,
    currentStudent,
    setCurrentStudent,
    activeQuizTaking,
    setActiveQuizTaking,
    latestCompletedAttempt,
    setLatestCompletedAttempt,
    students,
    teacherStudents,
  } = useApp();

  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('');
  const [activePracticeConfig, setActivePracticeConfig] = useState<FreePracticeConfig | null>(null);
  const [activePracticeQuiz, setActivePracticeQuiz] = useState<QuizAssignment | null>(null);
  const [studentIndependentQuiz, setStudentIndependentQuiz] = useState<QuizAssignment | null>(null);
  const [studentIndependentConfig, setStudentIndependentConfig] = useState<FreePracticeConfig | null>(null);

  const handleSelectStudentForReport = (studentId: string) => {
    setSelectedStudentForReport(studentId);
    setActiveTeacherTab('reports');
  };

  const buildEphemeralPracticeQuiz = (config: FreePracticeConfig): QuizAssignment => {
    const questions = config.isSimce
      ? buildSimceExamQuestions({
          grade: config.grade as SimceGradeLevel,
          axisFilter: config.simceAxisFilter || 'all',
          difficulty: config.difficulty,
          count: config.count,
        })
      : generateQuestionsForOA({
          grade: config.grade,
          oaCode: config.oaCode,
          difficulty: config.difficulty,
          count: config.count,
        });

    return {
      id: `practice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: config.isSimce ? 'SIMCE-LIBRE' : 'LIBRE',
      title: config.title,
      courseId: 'free-practice',
      teacherId: 'free-practice',
      gradeLevel: config.grade,
      axis: config.axis,
      oaCode: config.oaCode,
      difficulty: config.difficulty,
      totalQuestions: questions.length,
      deadline: '',
      timeLimitMinutes: config.timeLimitMinutes,
      questions,
      createdAt: new Date().toISOString(),
      isSimce: config.isSimce,
      simceAxisFilter: config.simceAxisFilter,
    };
  };

  const startPracticeSession = (config: FreePracticeConfig) => {
    setActivePracticeConfig(config);
    setActivePracticeQuiz(buildEphemeralPracticeQuiz(config));
  };

  const startStudentIndependentSimce = (config: FreePracticeConfig) => {
    setStudentIndependentConfig(config);
    setStudentIndependentQuiz(buildEphemeralPracticeQuiz(config));
  };

  // If in active quiz examination mode (either student or teacher test-run)
  if (activeQuizTaking) {
    const teacherPreviewStudent: Student = {
      id: 'teacher-preview',
      name: 'Vista Previa Docente',
      rut: '',
      courseId: activeQuizTaking.courseId,
      teacherId: activeQuizTaking.teacherId,
      accessCode: 'DOCENTE',
      pin: '',
    };
    const activeStudent = currentStudent || teacherStudents[0] || students[0] || teacherPreviewStudent;
    return (
      <ThatQuizExam
        quiz={activeQuizTaking}
        student={activeStudent}
        onExit={() => {
          setActiveQuizTaking(null);
          if (isTeacherAuthenticated && !currentStudent) {
            setRole('teacher');
          }
        }}
      />
    );
  }

  // Open Free Practice mode (no registration, no login, no stored records)
  if (role === 'practice') {
    if (activePracticeQuiz) {
      return (
        <ThatQuizExam
          key={activePracticeQuiz.id}
          quiz={activePracticeQuiz}
          student={GUEST_PRACTICE_STUDENT}
          isFreePractice={true}
          onRegeneratePractice={() => {
            if (activePracticeConfig) {
              startPracticeSession(activePracticeConfig);
            }
          }}
          onExit={() => setActivePracticeQuiz(null)}
        />
      );
    }

    return (
      <div className="min-h-screen tq-page flex flex-col font-sans">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          <FreePracticeView onStartPractice={startPracticeSession} />
        </main>
      </div>
    );
  }

  // Student view
  if (role === 'student') {
    if (currentStudent && studentIndependentQuiz) {
      return (
        <ThatQuizExam
          key={studentIndependentQuiz.id}
          quiz={studentIndependentQuiz}
          student={currentStudent}
          isFreePractice={true}
          onRegeneratePractice={() => {
            if (studentIndependentConfig) {
              startStudentIndependentSimce(studentIndependentConfig);
            }
          }}
          onExit={() => setStudentIndependentQuiz(null)}
        />
      );
    }

    return (
      <div className="min-h-screen tq-page flex flex-col font-sans">
        <Navigation />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          {!currentStudent ? (
            <StudentLogin
              onLoginSuccess={() => {
                // Handled in context
              }}
            />
          ) : latestCompletedAttempt ? (
            <QuizResultSummary
              attempt={latestCompletedAttempt}
              onRetry={() => {
                setLatestCompletedAttempt(null);
              }}
              onExit={() => {
                setLatestCompletedAttempt(null);
              }}
            />
          ) : (
            <StudentDashboard
              onStartQuiz={(quiz: QuizAssignment) => {
                setActiveQuizTaking(quiz);
              }}
              onViewAttempt={(attempt: QuizAttempt) => {
                setLatestCompletedAttempt(attempt);
              }}
              onStartIndependentSimce={startStudentIndependentSimce}
            />
          )}
        </main>
      </div>
    );
  }

  // Teacher Login Gate: never expose student rosters, PINs, or grades without teacher password
  if (!isTeacherAuthenticated) {
    return (
      <div className="min-h-screen tq-page flex flex-col font-sans">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          <TeacherLoginView />
        </main>
      </div>
    );
  }

  // Teacher view with authentic ThatQuiz layout (authenticated only)
  return (
    <div className="min-h-screen tq-page flex flex-col font-sans">
      <Navigation />
      <TeacherLoginModal />

      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
        {/* Left ThatQuiz Sidebar */}
        <ThatQuizSidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 overflow-x-auto tq-main-pane">
          {activeTeacherTab === 'matrix' && (
            <ThatQuizGradeMatrix onSelectStudentForReport={handleSelectStudentForReport} />
          )}
          {activeTeacherTab === 'courses' && <CourseRosterView />}
          {activeTeacherTab === 'curriculum' && <CurriculumView />}
          {activeTeacherTab === 'quizzes' && <QuizListView />}
          {activeTeacherTab === 'create_quiz' && <QuizCreator />}
          {activeTeacherTab === 'simce' && <SimceCreatorView />}
          {activeTeacherTab === 'stats' && (
            <StatisticsView onSelectStudentForReport={handleSelectStudentForReport} />
          )}
          {activeTeacherTab === 'reports' && (
            <ParentReportView
              initialStudentId={selectedStudentForReport}
              onBack={() => setActiveTeacherTab('matrix')}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
