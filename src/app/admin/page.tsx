"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface User {
  user_id: string;
  user_name: string;
}

interface SummaryStats {
  user_id: string;
  user_name: string;
  total_quizzes: number;
  total_questions: number;
  avg_time_per_question: number;
}

interface SeriousnessStats {
  user_name: string;
  theme_name: string;
  level: string;
  total_multi_round_sessions: number;
  total_mistakes: number;
  total_corrections: number;
  correction_rate: number;
  mastery_count: number;
  last_attempt: string;
}

interface SingleRoundStats {
  user_id: string;
  user_name: string;
  theme_name: string;
  level: string;
  total_sessions: number;
  perfect_sessions: number;
  last_attempt: string;
}

interface Round1Progress {
  user_id: string;
  user_name: string;
  theme_name: string;
  level: string;
  completed_at: string;
  percentage: number;
}

interface LearningRateProgress {
  user_name: string;
  theme_name: string;
  level: string;
  session_id: string;
  completed_at: string;
  correction_rate: number;
  mistakes: number;
  corrections: number;
}

interface RepeatedMistake {
  user_name: string;
  theme_name: string;
  level: string;
  question: string;
  correct_answer: string;
  count: number;
}

interface Stats {
  users: User[];
  summaryStats: SummaryStats[];
  seriousnessStats: SeriousnessStats[];
  singleRoundStats: SingleRoundStats[];
  round1Progress: Round1Progress[];
  learningRateProgress: LearningRateProgress[];
  repeatedMistakes: RepeatedMistake[];
}

const userColors: Record<string, { bg: string }> = {
  Z: { bg: "bg-pink-500" },
  I: { bg: "bg-yellow-500" },
  R: { bg: "bg-blue-500" },
};

const levelConfig: Record<string, { color: string; label: string }> = {
  easy: { color: "#22c55e", label: "Easy" },
  medium: { color: "#eab308", label: "Medium" },
  hard: { color: "#ef4444", label: "Hard" },
};

// Speed gauge component (half circle)
function SpeedGauge({
  percentage,
  size = 120,
  label,
  showTicks = true,
  strokeWidth: customStrokeWidth,
  fontSize,
}: {
  percentage: number;
  size?: number;
  label?: string;
  showTicks?: boolean;
  strokeWidth?: number;
  fontSize?: string;
}) {
  const strokeWidth = customStrokeWidth || (size > 60 ? 10 : 6);
  const radius = (size - strokeWidth) / 2;
  const halfCircumference = Math.PI * radius;
  const offset = halfCircumference - (percentage / 100) * halfCircumference;

  const getColor = (pct: number) => {
    if (pct >= 50) return "#22c55e";
    if (pct >= 25) return "#eab308";
    return "#ef4444";
  };

  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + (size > 60 ? 15 : 8) }}>
        <svg width={size} height={size / 2 + 10} className="overflow-visible">
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={halfCircumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
          {/* Tick marks */}
          {showTicks && [0, 25, 50, 75, 100].map((tick) => {
            const angle = Math.PI - (tick / 100) * Math.PI;
            const x1 = size / 2 + (radius - 6) * Math.cos(angle);
            const y1 = size / 2 - (radius - 6) * Math.sin(angle);
            const x2 = size / 2 + (radius + 2) * Math.cos(angle);
            const y2 = size / 2 - (radius + 2) * Math.sin(angle);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#d1d5db"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className={`${fontSize || (size > 60 ? 'text-xl' : 'text-xs')} font-bold`} style={{ color }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {label && <div className="text-xs text-gray-500 mt-1">{label}</div>}
    </div>
  );
}

// Chart component
function ThemeChart({ data }: { data: Round1Progress[] }) {
  // Group by level, sorted by completed_at to get test sequence
  const byLevel: Record<string, number[]> = { easy: [], medium: [], hard: [] };

  // Sort data by completed_at first
  const sorted = [...data].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

  sorted.forEach(p => {
    if (byLevel[p.level]) {
      byLevel[p.level].push(Number(p.percentage));
    }
  });

  // Find max number of tests across all levels
  const maxTests = Math.max(byLevel.easy.length, byLevel.medium.length, byLevel.hard.length);

  if (maxTests === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
        No data yet
      </div>
    );
  }

  // Build chart data with test number as X axis
  const chartData = Array.from({ length: maxTests }, (_, i) => ({
    testNum: i + 1,
    easy: byLevel.easy[i] ?? null,
    medium: byLevel.medium[i] ?? null,
    hard: byLevel.hard[i] ?? null,
  }));

  return (
    <div className="h-48">
      {/* Legend */}
      <div className="flex gap-3 mb-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelConfig.easy.color }} />
          <span>Easy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelConfig.medium.color }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelConfig.hard.color }} />
          <span>Hard</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <XAxis
            dataKey="testNum"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value, name) => [
              `${value}%`,
              levelConfig[name as string]?.label || name
            ]}
          />
          <Line type="monotone" dataKey="easy" stroke={levelConfig.easy.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="medium" stroke={levelConfig.medium.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="hard" stroke={levelConfig.hard.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Learning Rate Chart component
function LearningRateChart({ data }: { data: LearningRateProgress[] }) {
  // Group by level, sorted by completed_at to get session sequence
  const byLevel: Record<string, number[]> = { easy: [], medium: [], hard: [] };

  const sorted = [...data].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

  sorted.forEach(p => {
    if (byLevel[p.level]) {
      byLevel[p.level].push(p.correction_rate);
    }
  });

  const maxSessions = Math.max(byLevel.easy.length, byLevel.medium.length, byLevel.hard.length);

  if (maxSessions === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
        No retry data yet
      </div>
    );
  }

  const chartData = Array.from({ length: maxSessions }, (_, i) => ({
    sessionNum: i + 1,
    easy: byLevel.easy[i] ?? null,
    medium: byLevel.medium[i] ?? null,
    hard: byLevel.hard[i] ?? null,
  }));

  return (
    <div className="h-48">
      {/* Legend */}
      <div className="flex gap-3 mb-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelConfig.easy.color }} />
          <span>Easy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelConfig.medium.color }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelConfig.hard.color }} />
          <span>Hard</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <XAxis
            dataKey="sessionNum"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value, name) => [
              `${value}%`,
              levelConfig[name as string]?.label || name
            ]}
          />
          <Line type="monotone" dataKey="easy" stroke={levelConfig.easy.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="medium" stroke={levelConfig.medium.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="hard" stroke={levelConfig.hard.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setStats(data);
          if (data.users?.length > 0) {
            setSelectedUser(data.users[0].user_name);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load stats");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-5xl animate-bounce">📊</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !stats || stats.users.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-5xl">📭</div>
          <p className="text-gray-600">{error || "No data yet"}</p>
          <button onClick={() => router.push("/")} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white">
            ← Home
          </button>
        </div>
      </div>
    );
  }

  // Get data for selected user
  const userSummary = stats.summaryStats.find(s => s.user_name === selectedUser);
  const userSeriousness = stats.seriousnessStats.filter(s => s.user_name === selectedUser);
  const userSingleRound = stats.singleRoundStats.filter(s => s.user_name === selectedUser);
  const userRound1Progress = stats.round1Progress.filter(p => p.user_name === selectedUser);
  const userLearningRateProgress = stats.learningRateProgress.filter(p => p.user_name === selectedUser);
  const userMistakes = stats.repeatedMistakes.filter(m => m.user_name === selectedUser);

  // Calculate overall correction rate
  const totalMistakes = userSeriousness.reduce((sum, s) => sum + s.total_mistakes, 0);
  const totalCorrections = userSeriousness.reduce((sum, s) => sum + s.total_corrections, 0);
  const overallCorrectionRate = totalMistakes > 0 ? (totalCorrections / totalMistakes) * 100 : 0;

  // Get unique themes sorted by last attempt
  const themeLastAttempt: Record<string, Date> = {};
  [...userSeriousness, ...userSingleRound].forEach(s => {
    const date = new Date(s.last_attempt);
    if (!themeLastAttempt[s.theme_name] || date > themeLastAttempt[s.theme_name]) {
      themeLastAttempt[s.theme_name] = date;
    }
  });
  const userThemes = Object.keys(themeLastAttempt).sort(
    (a, b) => themeLastAttempt[b].getTime() - themeLastAttempt[a].getTime()
  );

  // Group data by theme and level
  const seriousnessByTheme: Record<string, Record<string, SeriousnessStats>> = {};
  userSeriousness.forEach(s => {
    if (!seriousnessByTheme[s.theme_name]) seriousnessByTheme[s.theme_name] = {};
    seriousnessByTheme[s.theme_name][s.level] = s;
  });

  const sessionsByTheme: Record<string, Record<string, SingleRoundStats>> = {};
  userSingleRound.forEach(s => {
    if (!sessionsByTheme[s.theme_name]) sessionsByTheme[s.theme_name] = {};
    sessionsByTheme[s.theme_name][s.level] = s;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Progress Dashboard</h1>
        <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
      </header>

      {/* User Selector */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {stats.users.map((user) => {
          const color = userColors[user.user_id] || { bg: "bg-gray-500" };
          const isSelected = user.user_name === selectedUser;
          return (
            <button
              key={user.user_id}
              onClick={() => setSelectedUser(user.user_name)}
              className={`rounded-full px-4 py-2 font-medium transition-all ${
                isSelected ? `${color.bg} text-white shadow-lg scale-105` : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {user.user_name}
            </button>
          );
        })}
      </div>

      {/* Summary Row - 3 Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-indigo-600">{userSummary?.total_quizzes || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Quizzes</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-purple-600">{userSummary?.total_questions || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Questions</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm flex flex-col items-center justify-center">
          <SpeedGauge percentage={overallCorrectionRate} size={90} label="Learning Rate" />
        </div>
      </div>

      {/* Info about the metric */}
      <div className="mb-4 px-2 py-2 bg-blue-50 rounded-lg text-xs text-blue-700">
        <strong>Learning Rate</strong> = % of mistakes corrected on retry. Random clicking ≈ 25%.
      </div>

      {/* Per-Theme Rows */}
      {userThemes.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="text-4xl mb-2">📚</div>
          <p className="text-gray-500">No quiz data yet for {selectedUser}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userThemes.map(theme => {
            const themeData = userRound1Progress.filter(p => p.theme_name === theme);
            const themeLearningData = userLearningRateProgress.filter(p => p.theme_name === theme);

            return (
              <div key={theme}>
                <h2 className="font-bold text-gray-800 mb-2 px-1">{theme}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {/* Left: Round 1 Success Chart */}
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="text-xs text-gray-400 mb-1">Round 1 Success %</div>
                    <ThemeChart data={themeData} />
                  </div>

                  {/* Right: Learning Rate Chart */}
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="text-xs text-gray-400 mb-1">Learning Rate %</div>
                    <LearningRateChart data={themeLearningData} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Repeated Mistakes */}
      {userMistakes.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-800">
            Needs Review
            <span className="ml-2 text-sm font-normal text-gray-500">(missed 2+ times)</span>
          </h2>
          <div className="space-y-2">
            {userMistakes.slice(0, 10).map((mistake, idx) => (
              <div key={idx} className="rounded-xl bg-red-50 p-3 border border-red-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">{mistake.theme_name} · {mistake.level}</div>
                    <p className="text-sm text-gray-800">{mistake.question}</p>
                    <p className="text-xs text-green-600 mt-1">✓ {mistake.correct_answer}</p>
                  </div>
                  <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-700">
                    {mistake.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
