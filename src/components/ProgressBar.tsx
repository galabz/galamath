"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  skipped?: number;
}

export default function ProgressBar({ current, total, skipped = 0 }: ProgressBarProps) {
  const percentage = ((current + 1) / total) * 100;

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-sm font-medium text-gray-600">
        <span>
          Question {current + 1} of {total}
          {skipped > 0 && (
            <span className="ml-2 text-orange-500">
              ({skipped} skipped)
            </span>
          )}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
