import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface Question {
  id: number;
  question: string;
  answers: string[];
  correct: number;
  hint?: string;
  sourceTheme?: string;
}

interface QuizData {
  theme: string;
  themeId: string;
  level: string;
  totalTimeMinutes: number;
  questionTimeMinutes: number;
  questions: Question[];
  access?: number[];
}

const themes = [
  "addition",
  "subtraction",
  "order-of-operations",
  "work-rate",
  "geometry",
  "algebra",
  "word-problems-useless",
  "logic-gates",
  "computer-science",
  "number-lines",
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const level = searchParams.get("level");
  const userId = searchParams.get("user");

  if (!level || !userId) {
    return NextResponse.json(
      { error: "Missing level or user parameter" },
      { status: 400 }
    );
  }

  if (!["easy", "medium", "hard"].includes(level)) {
    return NextResponse.json(
      { error: "Invalid level. Must be easy, medium, or hard" },
      { status: 400 }
    );
  }

  // Get user index from users list
  const usersEnv = process.env.USERS!;
  const userNames = usersEnv.split(",").map((name) => name.trim());
  const userIndex = userNames.findIndex(
    (name) => name[0].toUpperCase() === userId
  );

  if (userIndex === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const dataDir = path.join(process.cwd(), "src", "data");
  const allQuestions: Question[] = [];
  const accessibleThemes: string[] = [];

  // Load questions from all accessible themes
  for (const theme of themes) {
    const filePath = path.join(dataDir, `${theme}-${level}.json`);

    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const quizData: QuizData = JSON.parse(fileContent);

      // Check if user has access to this theme
      const access = quizData.access || [0];
      if (!access.includes(userIndex)) {
        continue;
      }

      accessibleThemes.push(theme);

      // Add questions with source theme info
      const questionsWithSource = quizData.questions.map((q) => ({
        ...q,
        sourceTheme: quizData.theme,
      }));

      allQuestions.push(...questionsWithSource);
    } catch {
      // Theme file not found or not accessible, skip
      continue;
    }
  }

  if (allQuestions.length === 0) {
    return NextResponse.json(
      { error: "No accessible themes found for this user" },
      { status: 404 }
    );
  }

  // Shuffle all questions
  const shuffledQuestions = shuffleArray(allQuestions);

  // Take 40 questions (or all if less than 40)
  const selectedQuestions = shuffledQuestions.slice(0, 40);

  // Re-number the questions for the test
  const numberedQuestions = selectedQuestions.map((q, index) => ({
    ...q,
    id: index + 1,
  }));

  const testQuiz = {
    theme: "Test - All Topics",
    themeId: `test-${level}`,
    level,
    totalTimeMinutes: 90,
    questionTimeMinutes: 2,
    questions: numberedQuestions,
    accessibleThemes,
  };

  return NextResponse.json(testQuiz);
}
