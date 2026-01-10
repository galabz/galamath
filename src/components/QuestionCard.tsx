"use client";

import { useRef, useState, useEffect } from "react";
import { Question } from "@/lib/types";
import MathText from "./MathText";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number, isTouch: boolean) => void;
  confirming?: boolean;
}

// Fun color themes for each button
const buttonThemes = [
  {
    label: "A",
    emoji: "🌸",
    bg: "bg-gradient-to-br from-pink-400 to-rose-500",
    bgHover: "hover:from-pink-500 hover:to-rose-600",
    bgSelected: "from-pink-500 to-rose-600",
    ring: "ring-pink-300",
    shadow: "shadow-pink-200",
    labelBg: "bg-white/90",
    labelText: "text-pink-600",
  },
  {
    label: "B",
    emoji: "🌟",
    bg: "bg-gradient-to-br from-amber-400 to-orange-500",
    bgHover: "hover:from-amber-500 hover:to-orange-600",
    bgSelected: "from-amber-500 to-orange-600",
    ring: "ring-amber-300",
    shadow: "shadow-amber-200",
    labelBg: "bg-white/90",
    labelText: "text-amber-600",
  },
  {
    label: "C",
    emoji: "🌿",
    bg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    bgHover: "hover:from-emerald-500 hover:to-teal-600",
    bgSelected: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-300",
    shadow: "shadow-emerald-200",
    labelBg: "bg-white/90",
    labelText: "text-emerald-600",
  },
  {
    label: "D",
    emoji: "🦋",
    bg: "bg-gradient-to-br from-violet-400 to-purple-500",
    bgHover: "hover:from-violet-500 hover:to-purple-600",
    bgSelected: "from-violet-500 to-purple-600",
    ring: "ring-violet-300",
    shadow: "shadow-violet-200",
    labelBg: "bg-white/90",
    labelText: "text-violet-600",
  },
];

// Sparkle component for selection effect
function Sparkles({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {[...Array(6)].map((_, i) => (
        <span
          key={i}
          className="absolute text-xl animate-ping"
          style={{
            left: `${15 + (i % 3) * 35}%`,
            top: `${20 + Math.floor(i / 3) * 50}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: "0.6s",
          }}
        >
          ✨
        </span>
      ))}
    </div>
  );
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  confirming = false,
}: QuestionCardProps) {
  const wasTouchRef = useRef(false);
  const [justSelected, setJustSelected] = useState<number | null>(null);

  // Reset sparkle effect
  useEffect(() => {
    if (justSelected !== null) {
      const timer = setTimeout(() => setJustSelected(null), 600);
      return () => clearTimeout(timer);
    }
  }, [justSelected]);

  const handleTouchEnd = (index: number) => {
    wasTouchRef.current = true;
    setJustSelected(index);
    onSelectAnswer(index, true);
  };

  const handleClick = (index: number) => {
    if (wasTouchRef.current) {
      wasTouchRef.current = false;
      return;
    }
    setJustSelected(index);
    onSelectAnswer(index, false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Question card with playful styling */}
      <div className="rounded-3xl bg-gradient-to-br from-white to-indigo-50 p-6 shadow-xl border-2 border-indigo-100 md:p-8">
        <h2 className="text-center text-2xl font-bold text-gray-800 md:text-3xl">
          <MathText text={question.question} />
        </h2>
        {question.svg && (
          <div
            className="mt-6 flex justify-center"
            dangerouslySetInnerHTML={{ __html: question.svg }}
          />
        )}
      </div>

      {/* Answer buttons with fun colors and animations */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {question.answers.map((answer, index) => {
          const theme = buttonThemes[index];
          const isSelected = selectedAnswer === index;
          const isConfirming = isSelected && confirming;
          const showSparkles = justSelected === index;

          return (
            <button
              key={index}
              onTouchEnd={() => handleTouchEnd(index)}
              onClick={() => handleClick(index)}
              disabled={confirming}
              className={`
                relative flex items-center gap-4 rounded-3xl p-5 text-left text-lg font-semibold
                transition-all duration-300 ease-out
                md:p-6 md:text-xl
                ${theme.bg} ${theme.bgHover}
                text-white
                shadow-lg ${theme.shadow}
                border-b-4 border-white/20
                ${isConfirming
                  ? `scale-110 ring-4 ${theme.ring} animate-bounce shadow-2xl opacity-100`
                  : isSelected
                    ? `scale-105 ring-4 ${theme.ring} shadow-xl opacity-100`
                    : selectedAnswer !== null
                      ? "opacity-40 hover:opacity-70 hover:scale-102 active:scale-95"
                      : "hover:scale-105 hover:-translate-y-1 hover:shadow-xl active:scale-95 active:translate-y-0"
                }
              `}
            >
              {/* Sparkle effect on selection */}
              <Sparkles active={showSparkles} />

              {/* Letter badge with emoji */}
              <span
                className={`
                  relative flex h-12 w-12 flex-shrink-0 items-center justify-center
                  rounded-2xl text-lg font-black md:h-14 md:w-14 md:text-xl
                  ${theme.labelBg} ${theme.labelText}
                  shadow-inner border-2 border-white/50
                  transition-transform duration-300
                  ${isSelected ? "rotate-12 scale-110" : "group-hover:rotate-6"}
                `}
              >
                <span className="absolute -top-1 -right-1 text-sm">
                  {theme.emoji}
                </span>
                {theme.label}
              </span>

              {/* Answer text */}
              <span className="flex-1 drop-shadow-sm">
                <MathText text={answer} variant="minimal" />
              </span>

              {/* Selection indicator */}
              {isSelected && (
                <span className="text-2xl animate-bounce">
                  {isConfirming ? "🚀" : "👆"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
