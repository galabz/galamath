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
}

const themes: Theme[] = [
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
];

const levels = [
  { id: "easy", name: "Easy", color: "bg-green-500", description: "Simple calculations" },
  { id: "medium", name: "Medium", color: "bg-yellow-500", description: "More operations" },
  { id: "hard", name: "Hard", color: "bg-red-500", description: "Exponents & complex" },
];

export default function Home() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already unlocked
    const isUnlocked = localStorage.getItem("unlocked") === "true";
    setUnlocked(isUnlocked);

    // Load users
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLevelSelect = (levelId: string) => {
    if (!selectedUser || !selectedTheme) return;
    router.push(`/quiz?theme=${selectedTheme.id}-${levelId}&user=${selectedUser.id}`);
  };

  const handleBack = () => {
    if (selectedTheme) {
      setSelectedTheme(null);
    } else if (selectedUser) {
      setSelectedUser(null);
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
  const step = !selectedUser ? "user" : !selectedTheme ? "theme" : "level";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
      <header className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-extrabold text-indigo-600 md:text-6xl">
          Galamath
        </h1>
        <p className="text-lg text-gray-600 md:text-xl">
          {step === "user" && "Select your profile to begin"}
          {step === "theme" && `Hi ${selectedUser?.name}! Choose a topic`}
          {step === "level" && "Choose difficulty level"}
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

      {/* Theme selection */}
      {step === "theme" && (
        <main className="grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
          {themes.map((theme) => (
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
        <p>40 questions • 1h30 total time • Good luck!</p>
      </footer>
    </div>
  );
}
