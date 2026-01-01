"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QuestionCard from "@/components/QuestionCard";
import Timer from "@/components/Timer";
import ProgressBar from "@/components/ProgressBar";
import AIHelper from "@/components/AIHelper";
import { QuizData, User, Mistake } from "@/lib/types";

interface QuizState {
  currentQuestion: number;
  answers: (number | null)[];
  answerTimes: number[];
  startTime: number;
}

interface SavedQuizProgress {
  themeId: string;
  userId: string;
  round: number;
  quizState: QuizState;
  wrongQuestionIds?: number[];
}

const QUIZ_PROGRESS_KEY = "quizProgress";

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeId = searchParams.get("theme");
  const userId = searchParams.get("user");
  const roundParam = searchParams.get("round");
  const round = roundParam ? parseInt(roundParam, 10) : 1;

  const [user, setUser] = useState<User | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    answers: [],
    answerTimes: [],
    startTime: Date.now(),
  });
  const [questionKey, setQuestionKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const questionStartRef = useRef(Date.now());
  const handleNextRef = useRef<() => void>(() => {});

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!themeId || !userId) {
      router.push("/");
      return;
    }

    // Check for saved progress
    const savedProgressStr = localStorage.getItem(QUIZ_PROGRESS_KEY);
    let savedProgress: SavedQuizProgress | null = null;

    if (savedProgressStr) {
      try {
        savedProgress = JSON.parse(savedProgressStr);
        // Only restore if it matches current quiz
        if (
          savedProgress?.themeId !== themeId ||
          savedProgress?.userId !== userId ||
          savedProgress?.round !== round
        ) {
          savedProgress = null;
        }
      } catch {
        savedProgress = null;
      }
    }

    // Load users and quiz data
    Promise.all([
      fetch("/api/users").then((res) => res.json()),
      import(`@/data/${themeId}.json`).then((data) => data.default || data),
    ])
      .then(([users, quizDataParsed]) => {
        const foundUser = users.find((u: User) => u.id === userId);
        if (!foundUser) {
          router.push("/");
          return;
        }
        setUser(foundUser);

        // In round 2+, filter to only show questions that were answered incorrectly
        let filteredQuizData = quizDataParsed;
        if (round > 1) {
          // Use saved wrong question IDs if available, otherwise from session storage
          const wrongQuestionIds = savedProgress?.wrongQuestionIds || JSON.parse(
            sessionStorage.getItem("wrongQuestionIds") || "[]"
          ) as number[];
          if (wrongQuestionIds.length > 0) {
            filteredQuizData = {
              ...quizDataParsed,
              questions: quizDataParsed.questions.filter((q: { id: number }) =>
                wrongQuestionIds.includes(q.id)
              ),
            };
          }
        }

        setQuizData(filteredQuizData);

        // Restore saved state or create new one
        if (savedProgress && savedProgress.quizState.answers.length === filteredQuizData.questions.length) {
          setQuizState(savedProgress.quizState);
          questionStartRef.current = Date.now();
        } else {
          const newState = {
            currentQuestion: 0,
            answers: new Array(filteredQuizData.questions.length).fill(null),
            answerTimes: new Array(filteredQuizData.questions.length).fill(0),
            startTime: Date.now(),
          };
          setQuizState(newState);
          questionStartRef.current = Date.now();

          // Save initial progress
          const wrongQuestionIds = round > 1
            ? JSON.parse(sessionStorage.getItem("wrongQuestionIds") || "[]")
            : undefined;
          localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify({
            themeId,
            userId,
            round,
            quizState: newState,
            wrongQuestionIds,
          }));
        }

        setLoading(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [themeId, userId, router, round]);

  // Save progress to localStorage
  const saveProgress = useCallback((state: QuizState) => {
    if (!themeId || !userId) return;
    const wrongQuestionIds = round > 1
      ? JSON.parse(sessionStorage.getItem("wrongQuestionIds") || "[]")
      : undefined;
    localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify({
      themeId,
      userId,
      round,
      quizState: state,
      wrongQuestionIds,
    }));
  }, [themeId, userId, round]);

  const submitResults = useCallback(
    async (finalState: QuizState) => {
      if (!quizData || !user || submitting) return;
      setSubmitting(true);

      // Clear saved progress on submit
      localStorage.removeItem(QUIZ_PROGRESS_KEY);

      const score = finalState.answers.reduce<number>((acc, answer, idx) => {
        return acc + (answer === quizData.questions[idx].correct ? 1 : 0);
      }, 0);

      const totalTimeSeconds = Math.floor((Date.now() - finalState.startTime) / 1000);
      const avgTimePerQuestion =
        finalState.answerTimes.reduce((a, b) => a + b, 0) / quizData.questions.length;

      const mistakes: Mistake[] = quizData.questions
        .map((q, idx) => {
          const userAnswer = finalState.answers[idx];
          if (userAnswer === q.correct) return null;
          return {
            questionNumber: idx + 1,
            question: q.question,
            userAnswer: userAnswer !== null ? q.answers[userAnswer] : null,
            correctAnswer: q.answers[q.correct],
            hint: q.hint,
          };
        })
        .filter((m): m is Mistake => m !== null);

      const allAnswers = quizData.questions.map((q, idx) => ({
        questionId: q.id,
        question: q.question,
        userAnswer: finalState.answers[idx],
        correctAnswer: q.correct,
        timeSpent: finalState.answerTimes[idx],
      }));

      // Store in session for results page
      // Use themeId from URL (includes level suffix) not quizData.themeId
      const resultForDisplay = {
        themeId: themeId,
        themeName: quizData.theme,
        userId: user.id,
        userName: user.name,
        questions: quizData.questions,
        userAnswers: finalState.answers,
        answerTimes: finalState.answerTimes,
        score,
        totalTime: totalTimeSeconds,
        completedAt: new Date().toISOString(),
        round,
      };
      sessionStorage.setItem("quizResult", JSON.stringify(resultForDisplay));

      // Submit to API with retry logic
      const submitPayload = {
        userId: user.id,
        userName: user.name,
        themeId: themeId,
        themeName: quizData.theme,
        score,
        totalQuestions: quizData.questions.length,
        totalTimeSeconds,
        avgTimePerQuestion,
        mistakes,
        allAnswers,
        round,
      };

      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch("/api/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitPayload),
          });

          if (response.ok) {
            break; // Success, exit retry loop
          }

          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          console.error(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (lastError) {
        console.error("All attempts to submit results failed:", lastError);
        // Store failed submission for potential later retry
        const failedSubmissions = JSON.parse(localStorage.getItem("failedSubmissions") || "[]");
        failedSubmissions.push({ ...submitPayload, timestamp: Date.now() });
        localStorage.setItem("failedSubmissions", JSON.stringify(failedSubmissions));
      }

      router.push("/results");
    },
    [quizData, user, router, submitting, round, themeId]
  );

  const handleTimeUp = useCallback(() => {
    // Record time for current question before submitting
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    setQuizState((prev) => {
      const newAnswerTimes = [...prev.answerTimes];
      newAnswerTimes[prev.currentQuestion] = timeSpent;
      const finalState = { ...prev, answerTimes: newAnswerTimes };
      submitResults(finalState);
      return finalState;
    });
  }, [submitResults]);

  const handleSelectAnswer = (answerIndex: number) => {
    setQuizState((prev) => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestion] = answerIndex;
      const newState = { ...prev, answers: newAnswers };
      saveProgress(newState);
      return newState;
    });

    // On mobile, auto-advance after selecting an answer
    if (isMobile) {
      setTimeout(() => handleNextRef.current(), 150);
    }
  };

  const handleNext = () => {
    if (!quizData) return;

    // Record time for current question
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);

    if (quizState.currentQuestion < quizData.questions.length - 1) {
      setQuizState((prev) => {
        const newAnswerTimes = [...prev.answerTimes];
        newAnswerTimes[prev.currentQuestion] = timeSpent;
        const newState = {
          ...prev,
          currentQuestion: prev.currentQuestion + 1,
          answerTimes: newAnswerTimes,
        };
        saveProgress(newState);
        return newState;
      });
      questionStartRef.current = Date.now();
      setQuestionKey((k) => k + 1);
    } else {
      // Quiz finished
      setQuizState((prev) => {
        const newAnswerTimes = [...prev.answerTimes];
        newAnswerTimes[prev.currentQuestion] = timeSpent;
        const finalState = { ...prev, answerTimes: newAnswerTimes };
        submitResults(finalState);
        return finalState;
      });
    }
  };

  // Keep ref updated for mobile auto-advance
  handleNextRef.current = handleNext;

  const handlePrevious = () => {
    if (quizState.currentQuestion > 0) {
      // Record time for current question
      const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);
      setQuizState((prev) => {
        const newAnswerTimes = [...prev.answerTimes];
        newAnswerTimes[prev.currentQuestion] += timeSpent;
        const newState = {
          ...prev,
          currentQuestion: prev.currentQuestion - 1,
          answerTimes: newAnswerTimes,
        };
        saveProgress(newState);
        return newState;
      });
      questionStartRef.current = Date.now();
      setQuestionKey((k) => k + 1);
    }
  };

  // Guard against empty filtered questions (e.g., all questions answered correctly)
  // Must be before conditional returns to follow Rules of Hooks
  useEffect(() => {
    if (!loading && quizData && quizData.questions.length === 0) {
      router.push("/results");
    }
  }, [loading, quizData, router]);

  // Keyboard shortcuts: A, B, C, D to select answer and move to next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || submitting || !quizData) return;

      const key = e.key.toLowerCase();
      const answerMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

      if (key in answerMap) {
        const answerIndex = answerMap[key];
        // Select the answer
        setQuizState((prev) => {
          const newAnswers = [...prev.answers];
          newAnswers[prev.currentQuestion] = answerIndex;
          const newState = { ...prev, answers: newAnswers };
          saveProgress(newState);
          return newState;
        });
        // Move to next question after a brief delay
        setTimeout(() => {
          handleNext();
        }, 150);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, submitting, quizData, handleNext, saveProgress]);

  if (loading || !quizData || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🧮</div>
          <p className="text-xl text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📊</div>
          <p className="text-xl text-gray-600">Saving your results...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[quizState.currentQuestion];
  const isLastQuestion = quizState.currentQuestion === quizData.questions.length - 1;
  const totalTimeSeconds = quizData.totalTimeMinutes * 60;
  const questionTimeSeconds = quizData.questionTimeMinutes * 60;

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🧮</div>
          <p className="text-xl text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-4 md:p-8">
      {/* Header with timers */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${user.bgColor}`}
          >
            {user.id}
          </span>
          <span className="text-2xl font-bold text-indigo-600 md:text-3xl">
            Galamath
          </span>
        </div>
        <div className="flex gap-3">
          <Timer
            key={`question-${questionKey}`}
            initialSeconds={questionTimeSeconds}
            label="Question"
            isIndicative
            resetKey={questionKey}
          />
          <Timer
            initialSeconds={totalTimeSeconds}
            onTimeUp={handleTimeUp}
            label="Total"
          />
        </div>
      </header>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar
          current={quizState.currentQuestion}
          total={quizData.questions.length}
          skipped={quizState.answers.slice(0, quizState.currentQuestion).filter(a => a === null).length}
        />
      </div>

      {/* Question */}
      <main className="flex-1">
        <div className="flex flex-col gap-6">
          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={quizState.answers[quizState.currentQuestion]}
            onSelectAnswer={handleSelectAnswer}
          />

          {/* Hint - shown in round 2+ */}
          {round > 1 && currentQuestion.hint && (
            <div className="mx-auto max-w-2xl rounded-xl bg-amber-50 border-2 border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="font-semibold text-amber-800 mb-1">Hint</p>
                  <p className="text-amber-700">{currentQuestion.hint}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Helper - shown in round 2+, fixed at bottom center */}
      {round > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
          <AIHelper
            key={currentQuestion.id}
            question={currentQuestion.question}
            hint={currentQuestion.hint}
            theme={quizData.theme}
            answers={currentQuestion.answers}
            userName={user?.name}
          />
        </div>
      )}

      {/* Navigation */}
      <footer className="mt-6 flex justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={quizState.currentQuestion === 0}
          className="rounded-2xl bg-gray-200 px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:bg-gray-300 active:scale-95 disabled:opacity-40 disabled:active:scale-100 md:px-12 md:text-xl"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 md:px-12 md:text-xl"
        >
          {isLastQuestion ? "Finish" : "Next"}
        </button>
      </footer>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl">🧮</div>
            <p className="text-xl text-gray-600">Loading quiz...</p>
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
