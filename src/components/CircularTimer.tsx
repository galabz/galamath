"use client";

import { useEffect, useState } from "react";

interface CircularTimerProps {
  initialSeconds: number;
  resetKey?: number;
}

export default function CircularTimer({
  initialSeconds,
  resetKey = 0,
}: CircularTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [resetKey, initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  const progress = seconds / initialSeconds;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - progress);

  const isLow = seconds <= 10;
  const isVeryLow = seconds <= 5;

  const strokeColor = isVeryLow
    ? "#dc2626"
    : isLow
      ? "#ea580c"
      : "#6366f1";

  const textColor = isVeryLow
    ? "text-red-600"
    : isLow
      ? "text-orange-600"
      : "text-indigo-600";

  return (
    <div className="relative flex h-8 w-8 items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-linear ${isVeryLow ? "animate-pulse" : ""}`}
        />
      </svg>
      <span className={`text-xs font-bold tabular-nums ${textColor}`}>{seconds}</span>
    </div>
  );
}
