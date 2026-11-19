import React, { useState, useEffect, useRef } from 'react';
import { Clock, Edit3, ArrowRight, CornerDownLeft, Delete, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { QuizAssignment, Student, QuestionAnswer, QuizAttempt } from '../../types';
import { calculateChileanGrade, calculateSimceScore, getMineducPerformanceLevel, formatDifficultyName, formatGradeLevelName, formatAxisName } from '../../utils/chileanGrades';
import { MathVisuals } from './MathVisuals';
import { Scratchpad } from './Scratchpad';
import { QuizResultSummary } from './QuizResultSummary';
import { useApp } from '../../context/AppContext';

interface ThatQuizExamProps {
  quiz: QuizAssignment;
  student: Student;
  onExit: () => void;
  isFreePractice?: boolean;
  onRegeneratePractice?: () => void;
  onPracticeSameTopic?: () => void;
}

export const ThatQuizExam: React.FC<ThatQuizExamProps> = ({
  quiz,
  student,
  onExit,
  isFreePractice = false,
  onRegeneratePractice,
  onPracticeSameTopic,
}) => {
  const { recordQuizAttempt } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
  const [questionStartSec, setQuestionStartSec] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Live timer
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Focus input on question change
  useEffect(() => {
    if (!isCompleted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, isCompleted]);

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];

  const handleKeypadPress = (val: string) => {
    if (val === 'DEL') {
      setCurrentAnswer(prev => prev.slice(0, -1));
    } else if (val === 'ENTER') {
      handleSubmitAnswer();
    } else {
      // Prevent multiple negative signs or multiple commas
      if (val === '-' && currentAnswer.length > 0) return;
      if (val === ',' && (currentAnswer.includes(',') || currentAnswer.includes('.'))) return;
      setCurrentAnswer(prev => prev + val);
    }
  };

  const normalizeAnswer = (ans: string): string => {
    return ans.trim().replace(/\./g, ',').toLowerCase();
  };

  const isAnswerCorrect = (userAns: string, correctAns: string): boolean => {
    const u = normalizeAnswer(userAns);
    const c = normalizeAnswer(correctAns);
    if (u === c) return true;
    
    // Numeric equivalence only when both answers are strictly plain numbers (never algebraic expressions like "3 - 3y" or "24 : 3")
    const pureNumberRegex = /^-?\d+([.,]\d+)?$/;
    if (pureNumberRegex.test(u) && pureNumberRegex.test(c)) {
      const numU = parseFloat(u.replace(',', '.'));
      const numC = parseFloat(c.replace(',', '.'));
      return Math.abs(numU - numC) < 0.001;
    }
    return false;
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim() && currentQuestion.questionType !== 'multiple_choice') {
      return; // Do not submit empty
    }

    const spentOnCurrent = Math.max(1, elapsedSeconds - questionStartSec);
    const updatedTimes = { ...questionTimes, [currentIndex]: spentOnCurrent };
    const updatedAnswers = { ...answers, [currentIndex]: currentAnswer };
    setQuestionTimes(updatedTimes);
    setAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentIndex < questions.length - 1) {
      setQuestionStartSec(elapsedSeconds);
      setCurrentIndex(prev => prev + 1);
    } else {
      finishExam(updatedAnswers, updatedTimes);
    }
  };

  const handleSkip = () => {
    const spentOnCurrent = Math.max(1, elapsedSeconds - questionStartSec);
    const updatedTimes = { ...questionTimes, [currentIndex]: spentOnCurrent };
    const updatedAnswers = { ...answers, [currentIndex]: '' };
    setQuestionTimes(updatedTimes);
    setAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentIndex < questions.length - 1) {
      setQuestionStartSec(elapsedSeconds);
      setCurrentIndex(prev => prev + 1);
    } else {
      finishExam(updatedAnswers, updatedTimes);
    }
  };

  const finishExam = (
    finalAnswers: Record<number, string>,
    finalTimes: Record<number, number> = questionTimes
  ) => {
    let score = 0;
    const evaluatedAnswers: QuestionAnswer[] = questions.map((q, idx) => {
      const studentAns = finalAnswers[idx] || '';
      const correct = isAnswerCorrect(studentAns, q.correctAnswer);
      if (correct) score += 1;

      return {
        questionId: q.id,
        prompt: q.prompt + (q.context ? ` [${q.context}]` : ''),
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
        isCorrect: correct,
        timeSpentSeconds: finalTimes[idx] ?? Math.max(1, Math.round(elapsedSeconds / questions.length)),
        explanation: q.explanation,
      };
    });

    const maxScore = questions.length;
    const percentage = Math.round((score / maxScore) * 100);
    const grade = calculateChileanGrade(score, maxScore, 60);
    const performanceLevel = getMineducPerformanceLevel(grade);
    const simceResult = quiz.isSimce
      ? calculateSimceScore(score, maxScore, quiz.gradeLevel)
      : null;

    const newAttempt: QuizAttempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      oaCode: quiz.oaCode,
      axis: quiz.axis,
      studentId: student.id,
      studentName: student.name,
      courseId: quiz.courseId,
      answers: evaluatedAnswers,
      score,
      totalQuestions: maxScore,
      percentage,
      chileanGrade: grade,
      performanceLevel,
      completedAt: new Date().toLocaleString('es-CL'),
      durationSeconds: elapsedSeconds,
      isSimce: quiz.isSimce,
      simceScore: simceResult?.score,
      simceLevel: simceResult?.level,
    };

    if (!isFreePractice) {
      recordQuizAttempt(newAttempt);
    }
    setCompletedAttempt(newAttempt);
    setIsCompleted(true);
  };

  // Optional countdown auto-finish when timeLimitMinutes > 0 in free practice
  useEffect(() => {
    if (isFreePractice && quiz.timeLimitMinutes > 0 && !isCompleted) {
      const limitSec = quiz.timeLimitMinutes * 60;
      if (elapsedSeconds >= limitSec) {
        finishExam(answers);
      }
    }
  }, [elapsedSeconds, isFreePractice, quiz.timeLimitMinutes, isCompleted, answers]);

  const handleRetry = () => {
    if (!isFreePractice && onPracticeSameTopic) {
      onPracticeSameTopic();
      return;
    }
    if (onRegeneratePractice) {
      onRegeneratePractice();
      return;
    }
    setCurrentIndex(0);
    setCurrentAnswer('');
    setAnswers({});
    setQuestionTimes({});
    setQuestionStartSec(0);
    setElapsedSeconds(0);
    setIsCompleted(false);
    setCompletedAttempt(null);
  };

  if (isCompleted && completedAttempt) {
    return (
      <QuizResultSummary
        attempt={completedAttempt}
        onRetry={handleRetry}
        onExit={onExit}
        onPracticeSameTopic={onPracticeSameTopic}
        isFreePractice={isFreePractice}
      />
    );
  }

  // Count current progress like ThatQuiz
  const answeredCount = Object.keys(answers).length;
  const remainingCount = questions.length - currentIndex;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-dvh tq-page flex flex-col items-center justify-start p-2 sm:p-3 font-sans">
      {/* Scratchpad Modal */}
      <Scratchpad isOpen={isScratchpadOpen} onClose={() => setIsScratchpadOpen(false)} />

      {/* ThatQuiz Friendly Header Bar */}
      <header className="w-full max-w-4xl tq-card border rounded-xl shadow-xs px-3 sm:px-4 py-2 mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="p-1.5 tq-text-muted hover:tq-text hover:bg-[var(--tq-muted-bg)] rounded-lg transition-colors cursor-pointer shrink-0"
            title="Salir de la evaluación"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold tq-text text-xs sm:text-sm truncate">
                {quiz.isSimce
                  ? isFreePractice
                    ? 'Práctica Libre · SIMCE'
                    : 'Evaluación SIMCE'
                  : isFreePractice
                  ? 'Práctica Libre MateClic'
                  : 'MateClic Escolar'}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 tq-accent-soft rounded-full border tq-border">
                {quiz.oaCode} · {formatGradeLevelName(quiz.gradeLevel)}
              </span>
            </div>
            <span className="text-[11px] tq-text-muted block truncate max-w-xs md:max-w-md">
              {isFreePractice ? (
                <>Sin registro · <strong className="tq-text-2">{quiz.title}</strong></>
              ) : (
                <>Estudiante: <strong className="tq-text">{student.name}</strong> · {quiz.title}</>
              )}
            </span>
          </div>
        </div>

        {/* Live ThatQuiz Counters */}
        <div className="flex items-center gap-2 text-xs font-mono font-medium shrink-0">
          <div className="flex items-center gap-1 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800 text-sky-900 dark:text-sky-100 px-2.5 py-1 rounded-lg font-bold">
            <span className="text-sky-700 dark:text-sky-300 hidden sm:inline">Pregunta:</span>
            <span className="tabular-nums">{currentIndex + 1}/{questions.length}</span>
          </div>

          <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 text-purple-900 dark:text-purple-100 px-2.5 py-1 rounded-lg font-bold">
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
            <span className="tabular-nums">
              {isFreePractice && quiz.timeLimitMinutes > 0
                ? formatTimer(Math.max(0, quiz.timeLimitMinutes * 60 - elapsedSeconds))
                : formatTimer(elapsedSeconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsScratchpadOpen(true)}
            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg flex items-center gap-1 font-sans text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Abrir cuaderno de borrador para hacer cálculos"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
            <span>Borrador</span>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full max-w-4xl tq-muted h-1.5 rounded-full overflow-hidden mb-2 border tq-border shadow-2xs">
        <div
          className="tq-btn-gradient h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main ThatQuiz Exercise Card */}
      <main className="w-full max-w-4xl tq-card border rounded-2xl shadow-sm p-3.5 sm:p-5 flex flex-col justify-between">
        {/* Question Header & Context */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs tq-text-muted border-b tq-border pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold tq-accent-soft px-2 py-0.5 rounded-full text-[11px]">
                {currentQuestion.isSimce ? `Pregunta SIMCE ${currentIndex + 1} de ${questions.length}` : `Ejercicio ${currentIndex + 1} de ${questions.length}`}
              </span>
              {currentQuestion.isSimce && currentQuestion.axis && (
                <span className="text-[11px]">
                  {formatAxisName(currentQuestion.axis)}
                  {currentQuestion.simceSkill ? ` · ${currentQuestion.simceSkill}` : ''}
                  {currentQuestion.oaCode ? ` · ${currentQuestion.oaCode}` : ''}
                </span>
              )}
              {!currentQuestion.isSimce && currentQuestion.categoryLabel && (
                <span className="font-medium text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 px-2 py-0.5 rounded-full text-[11px]">
                  {currentQuestion.categoryLabel}
                </span>
              )}
            </div>
            <span className="font-bold tq-muted tq-text-2 px-2 py-0.5 rounded-full text-[11px]">
              {formatDifficultyName(currentQuestion.difficulty)}
            </span>
          </div>

          {/* Prompt */}
          <div className="text-center py-0.5">
            <h2 className="text-base sm:text-xl font-bold tq-text max-w-2xl mx-auto leading-snug">
              {currentQuestion.prompt}
            </h2>

            {currentQuestion.context && (
              <div className="mt-2 px-3.5 py-2 tq-tint border rounded-xl inline-block text-lg sm:text-xl font-mono font-black tq-text-accent tracking-wider shadow-2xs">
                {currentQuestion.context}
              </div>
            )}
          </div>

          {/* Visual Diagram */}
          <MathVisuals
            visualType={currentQuestion.visualType}
            visualData={currentQuestion.visualData}
          />

          {/* Answer Input Section */}
          <div className={currentQuestion.questionType === 'multiple_choice' ? 'max-w-xl mx-auto pt-1' : 'max-w-sm mx-auto pt-1'}>
            {currentQuestion.questionType === 'multiple_choice' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(currentQuestion.options || []).map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
                    const isSelected = currentAnswer === opt;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => {
                          setCurrentAnswer(opt);
                        }}
                        className={`p-2.5 sm:p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all text-left flex items-center justify-between gap-2.5 shadow-2xs cursor-pointer ${
                          isSelected
                            ? 'border-[var(--tq-accent)] tq-tint tq-text shadow-xs ring-2 ring-[var(--tq-accent)]/30'
                            : 'tq-card border-[var(--tq-border)] hover:border-[var(--tq-border-strong)] hover:bg-[var(--tq-subtle-bg)] tq-text'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-md font-mono text-[11px] font-black flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'tq-btn-primary border-[var(--tq-accent)]'
                                : 'tq-muted tq-text-2 tq-border'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 tq-text-accent shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {currentQuestion.simceSource && (
                  <p className="text-[11px] tq-text-muted text-center">
                    Fuente referencial: {currentQuestion.simceSource}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={currentAnswer}
                    onChange={e => setCurrentAnswer(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleSubmitAnswer();
                      }
                    }}
                    placeholder="Escribe tu respuesta..."
                    className="w-full text-center text-2xl font-black font-mono py-2 px-3 border-2 tq-input focus:outline-hidden rounded-xl transition-all shadow-2xs"
                  />
                </div>

                {/* On-Screen Numeric Keypad */}
                <div className="grid grid-cols-3 gap-1.5 max-w-[260px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', ','].map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypadPress(key)}
                      className="py-1.5 tq-subtle hover:bg-[var(--tq-muted-bg)] rounded-lg font-mono text-base font-bold tq-text border tq-border shadow-2xs transition-all cursor-pointer"
                    >
                      {key}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('DEL')}
                    className="py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                    title="Borrar carácter"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentAnswer('')}
                    className="py-1.5 tq-muted hover:opacity-85 tq-text-2 rounded-lg text-xs font-bold border tq-border shadow-2xs transition-all cursor-pointer"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!currentAnswer.trim()}
                    className="py-1.5 tq-btn-gradient-alt hover:opacity-95 disabled:opacity-40 rounded-lg text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>OK</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer controls: Saltar & Responder */}
        <div className="pt-3 border-t tq-border mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-3 py-1.5 text-xs font-bold tq-text-muted hover:tq-text hover:bg-[var(--tq-muted-bg)] rounded-xl transition-colors cursor-pointer"
          >
            Saltar ejercicio
          </button>

          <button
            type="button"
            onClick={handleSubmitAnswer}
            disabled={!currentAnswer.trim() && currentQuestion.questionType !== 'multiple_choice'}
            className="px-5 py-2 text-xs sm:text-sm font-bold tq-btn-primary disabled:opacity-40 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>{currentIndex === questions.length - 1 ? 'Finalizar evaluación' : 'Responder y continuar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};
