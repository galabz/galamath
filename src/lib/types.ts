export interface Question {
  id: number;
  question: string;
  svg?: string; // Optional SVG markup for visual questions
  answers: [string, string, string, string];
  correct: number; // Index 0-3
  hint: string; // Hint to guide thinking without revealing answer
  sourceTheme?: string; // Theme name for test mode questions
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  questionCount: number;
}

export interface QuizData {
  theme: string;
  themeId: string;
  level: "easy" | "medium" | "hard";
  totalTimeMinutes: number;
  questionTimeMinutes: number;
  questions: Question[];
}

export interface User {
  id: string;
  name: string;
  color: string;
  bgColor: string;
}

export interface QuizState {
  currentQuestion: number;
  answers: (number | null)[]; // User's selected answers (index or null if skipped)
  answerTimes: number[]; // Time spent on each question in seconds
  questionStartTime: number;
  startTime: number;
  endTime?: number;
}

export interface QuizResult {
  themeId: string;
  themeName: string;
  userId: string;
  userName: string;
  questions: Question[];
  userAnswers: (number | null)[];
  answerTimes: number[];
  score: number;
  totalTime: number; // in seconds
  completedAt: string; // ISO date string
}

export interface Mistake {
  questionNumber: number;
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  hint: string;
}
