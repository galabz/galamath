"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserSelector from "@/components/UserSelector";
import PasscodeScreen from "@/components/PasscodeScreen";
import { User } from "@/lib/types";

interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  access?: number[];
}

const themes: Theme[] = [
  {
    id: "addition",
    name: "Addition",
    description: "Practice adding numbers - from simple sums to two-digit addition",
    icon: "➕",
  },
  {
    id: "subtraction",
    name: "Subtraction",
    description: "Practice taking away - from basic subtraction to borrowing",
    icon: "➖",
  },
  {
    id: "order-of-operations",
    name: "Order of Operations",
    description: "Master PEMDAS - Parentheses, Exponents, Multiplication, Division, Addition, Subtraction",
    icon: "🧮",
  },
  {
    id: "work-rate",
    name: "Rate & Proportion",
    description: "Speed, distance, time, workers, filling tanks, and meeting problems",
    icon: "🚗",
  },
  {
    id: "geometry",
    name: "Geometry",
    description: "Angles, areas, perimeters, circles, 3D shapes, and nets",
    icon: "📐",
  },
  {
    id: "algebra",
    name: "Algebra",
    description: "Equations, expressions, patterns, and word problems",
    icon: "🔢",
  },
  {
    id: "word-problems-useless",
    name: "Filter the Info",
    description: "Word problems with useless information - find what matters!",
    icon: "🔍",
  },
  {
    id: "logic-gates",
    name: "Logic & Binary",
    description: "Logic gates, truth tables, binary numbers, and circuits",
    icon: "🔌",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    description: "Architecture, OS, networks, and Swift programming basics",
    icon: "💻",
  },
  {
    id: "number-lines",
    name: "Number Lines",
    description: "Read numbers on number lines - from basic counting to skip counting patterns",
    icon: "📏",
  },
];

const levels = [
  { id: "easy", name: "Easy", color: "bg-green-500", description: "Simple calculations" },
  { id: "medium", name: "Medium", color: "bg-yellow-500", description: "More operations" },
  { id: "hard", name: "Hard", color: "bg-red-500", description: "Exponents & complex" },
];

type Mode = "training" | "test";

export default function Home() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMode, setSelectedMode] = useState<Mode>("training");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeAccess, setThemeAccess] = useState<Record<string, number[]>>({});

  useEffect(() => {
    // Check if already unlocked
    const isUnlocked = localStorage.getItem("unlocked") === "true";
    setUnlocked(isUnlocked);

    // Load users and theme access data
    Promise.all([
      fetch("/api/users").then((res) => res.json()),
      // Load access data from each theme's easy level
      Promise.all(
        themes.map(async (theme) => {
          try {
            const data = await import(`@/data/${theme.id}-easy.json`);
            return { id: theme.id, access: data.access || data.default?.access || [0] };
          } catch {
            return { id: theme.id, access: [0] };
          }
        })
      ),
    ])
      .then(([usersData, accessData]) => {
        setUsers(usersData);
        const accessMap: Record<string, number[]> = {};
        accessData.forEach(({ id, access }) => {
          accessMap[id] = access;
        });
        setThemeAccess(accessMap);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Retry any failed submissions from previous sessions
    const retryFailedSubmissions = async () => {
      const failedSubmissions = JSON.parse(localStorage.getItem("failedSubmissions") || "[]");
      if (failedSubmissions.length === 0) return;

      const stillFailed: typeof failedSubmissions = [];

      for (const submission of failedSubmissions) {
        try {
          const response = await fetch("/api/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submission),
          });

          if (!response.ok) {
            stillFailed.push(submission);
          } else {
            console.log("Successfully retried failed submission:", submission.themeName, submission.round);
          }
        } catch {
          stillFailed.push(submission);
        }
      }

      if (stillFailed.length > 0) {
        localStorage.setItem("failedSubmissions", JSON.stringify(stillFailed));
      } else {
        localStorage.removeItem("failedSubmissions");
      }
    };

    retryFailedSubmissions();
  }, []);

  const handleLevelSelect = (levelId: string) => {
    if (!selectedUser) return;

    if (selectedMode === "test") {
      // Test mode: use all available themes for this user
      router.push(`/quiz?mode=test&level=${levelId}&user=${selectedUser.id}`);
    } else {
      // Training mode: use selected theme
      if (!selectedTheme) return;
      router.push(`/quiz?theme=${selectedTheme.id}-${levelId}&user=${selectedUser.id}`);
    }
  };

  const handleBack = () => {
    if (selectedTheme) {
      setSelectedTheme(null);
    } else if (selectedMode === "test" && selectedUser) {
      // In test mode, go back from level to mode selection
      setSelectedMode("training");
    } else if (selectedUser) {
      setSelectedUser(null);
      setSelectedMode("training");
    }
  };

  // Show loading state
  if (unlocked === null || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🧮</div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show passcode screen if not unlocked
  if (!unlocked) {
    return <PasscodeScreen onUnlock={() => setUnlocked(true)} />;
  }

  // Determine current step
  // In test mode: user -> mode -> level (skip theme)
  // In training mode: user -> mode -> theme -> level
  const step = !selectedUser
    ? "user"
    : selectedMode === "test"
      ? "level"
      : !selectedTheme
        ? "theme"
        : "level";

  return (
    <div className="flex min-h-screen flex-col items-center p-6 pt-12 md:p-12 md:pt-20">
      <header className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-extrabold text-indigo-600 md:text-6xl">
          Galamath
        </h1>
        <p className="text-lg text-gray-600 md:text-xl">
          {step === "user" && "Select your profile to begin"}
          {step === "theme" && "Choose a topic"}
          {step === "level" && selectedMode === "test" && "Choose test difficulty"}
          {step === "level" && selectedMode === "training" && "Choose difficulty level"}
        </p>
      </header>

      {/* Back button */}
      {(selectedUser || selectedTheme) && (
        <button
          onClick={handleBack}
          className="mb-8 flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200"
        >
          ← Back
        </button>
      )}

      {/* User selection */}
      {step === "user" && (
        <UserSelector
          users={users}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
      )}

      {/* Mode toggle - shown after user selection */}
      {selectedUser && (
        <div className="mb-8 flex items-center gap-2 rounded-full bg-gray-100 p-1">
          <button
            onClick={() => {
              setSelectedMode("training");
              setSelectedTheme(null);
            }}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
              selectedMode === "training"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Training
          </button>
          <button
            onClick={() => {
              setSelectedMode("test");
              setSelectedTheme(null);
            }}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
              selectedMode === "test"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Test
          </button>
        </div>
      )}

      {/* Theme selection */}
      {step === "theme" && selectedUser && (
        <main className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {themes
            .filter((theme) => {
              const userIndex = users.findIndex((u) => u.id === selectedUser.id);
              const access = themeAccess[theme.id] || [0];
              return access.includes(userIndex);
            })
            .map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className="flex w-full flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
              >
                <span className="text-6xl">{theme.icon}</span>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
                    {theme.name}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 md:text-base">
                    {theme.description}
                  </p>
                </div>
              </button>
            ))}
        </main>
      )}

      {/* Level selection */}
      {step === "level" && (
        <main className="grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-3">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevelSelect(level.id)}
              className={`flex flex-col items-center gap-3 rounded-3xl p-8 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${level.color}`}
            >
              <span className="text-4xl font-extrabold md:text-5xl">
                {level.id === "easy" ? "⭐" : level.id === "medium" ? "⭐⭐" : "⭐⭐⭐"}
              </span>
              <h2 className="text-xl font-bold md:text-2xl">{level.name}</h2>
              <p className="text-sm text-white/80">{level.description}</p>
            </button>
          ))}
        </main>
      )}

      <footer className="mt-12 text-center text-sm text-gray-500">
        {selectedMode === "test" ? (
          <p>40 questions from all topics • 1h30 total time • Good luck!</p>
        ) : (
          <p>40 questions • 1h30 total time • Good luck!</p>
        )}
      </footer>
    </div>
  );
}
