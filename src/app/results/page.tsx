"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizResult, User } from "@/lib/types";

interface ExtendedQuizResult extends QuizResult {
  round?: number;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ExtendedQuizResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedResult = sessionStorage.getItem("quizResult");
    if (!storedResult) {
      router.push("/");
      return;
    }

    const parsedResult = JSON.parse(storedResult);
    setResult(parsedResult);

    // Load users to get the user info
    fetch("/api/users")
      .then((res) => res.json())
      .then((users) => {
        const foundUser = users.find((u: User) => u.id === parsedResult.userId);
        setUser(foundUser || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📊</div>
          <p className="text-xl text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }
  const percentage = Math.round((result.score / result.questions.length) * 100);
  const avgTime =
    result.answerTimes && result.answerTimes.length > 0
      ? (result.answerTimes.reduce((a, b) => a + b, 0) / result.questions.length).toFixed(1)
      : "N/A";

  const emoji =
    percentage >= 90
      ? "🏆"
      : percentage >= 70
        ? "🌟"
        : percentage >= 50
          ? "👍"
          : "💪";

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        {user && (
          <div className="mb-4 flex items-center justify-center gap-3">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white ${user.bgColor}`}
            >
              {user.id}
            </span>
            <span className="text-2xl font-semibold text-gray-700">
              {user.name}&apos;s Results
            </span>
          </div>
        )}
        <h1 className="mb-2 text-4xl font-extrabold text-indigo-600 md:text-5xl">
          Quiz Complete! {emoji}
        </h1>
        <p className="text-lg text-gray-600">{result.themeName}</p>
      </header>

      {/* Score summary */}
      <div className="mx-auto mb-8 max-w-2xl rounded-3xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 text-6xl font-bold text-indigo-600 md:text-7xl">
            {result.score}/{result.questions.length}
          </div>
          <div className="text-2xl font-semibold text-gray-700">
            {percentage}% correct
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">Total Time</div>
            <div className="text-xl font-bold text-gray-700">
              {formatTime(result.totalTime)}
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">Avg per Question</div>
            <div className="text-xl font-bold text-gray-700">{avgTime}s</div>
          </div>
        </div>
      </div>

      {/* Next action */}
      {(() => {
        const mistakeCount = result.questions.length - result.score;
        const isPerfectScore = result.score === result.questions.length;

        // Perfect score - show celebration
        if (isPerfectScore) {
          return (
            <div className="mx-auto max-w-4xl">
              <div className="rounded-3xl bg-green-50 p-8 text-center shadow-lg">
                <div className="mb-4 text-6xl">🎉</div>
                <h2 className="mb-2 text-3xl font-bold text-green-700">Perfect Score!</h2>
                <p className="text-lg text-green-600">
                  Congratulations! You answered all {result.questions.length} questions correctly
                  {result.round && result.round > 1 && ` in ${result.round} rounds`}!
                </p>
              </div>
            </div>
          );
        }

        // Not perfect - show big "Round X" button
        const nextRound = (result.round || 1) + 1;

        // Get IDs of questions that were answered incorrectly
        const wrongQuestionIds = result.questions
          .filter((q, idx) => result.userAnswers[idx] !== q.correct)
          .map((q) => q.id);

        return (
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-8 text-lg text-gray-600">
              You got {mistakeCount} question{mistakeCount > 1 ? "s" : ""} wrong.
              Try again to improve your score!
            </p>
            <button
              onClick={() => {
                // Store wrong question IDs for next round
                sessionStorage.setItem("wrongQuestionIds", JSON.stringify(wrongQuestionIds));
                router.push(`/quiz?theme=${result.themeId}&user=${result.userId}&round=${nextRound}`);
              }}
              className="rounded-3xl bg-indigo-600 px-16 py-8 text-3xl font-bold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-95"
            >
              Round {nextRound}
            </button>
          </div>
        );
      })()}

      {/* Actions - only show Back to Home for perfect scores */}
      {result.score === result.questions.length && (
        <div className="mx-auto mt-8 flex max-w-4xl justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
