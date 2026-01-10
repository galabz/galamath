"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  skipped?: number;
}

export default function ProgressBar({ current, total, skipped = 0 }: ProgressBarProps) {
  const percentage = ((current + 1) / total) * 100;

  return (
    <div className="flex items-center gap-2 flex-1">
      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
        {current + 1}/{total}
        {skipped > 0 && (
          <span className="ml-1 text-orange-500">({skipped})</span>
        )}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
