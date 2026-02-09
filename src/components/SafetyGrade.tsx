import { cn } from "@/lib/utils";

interface SafetyGradeProps {
  violationCount: number;
  healthViolationCount: number;
  leadLevel?: number | null;
  size?: "sm" | "md" | "lg";
}

export function calculateGrade(
  violationCount: number,
  healthViolationCount: number,
  leadLevel?: number | null
): { grade: string; label: string; color: string } {
  let score = 100;

  // Deduct for violations
  score -= Math.min(violationCount * 3, 40);
  // Deduct more for health violations
  score -= Math.min(healthViolationCount * 8, 30);
  // Deduct for lead above action level (15 ppb)
  if (leadLevel && leadLevel > 15) {
    score -= 20;
  } else if (leadLevel && leadLevel > 5) {
    score -= 10;
  }

  score = Math.max(0, score);

  if (score >= 90) return { grade: "A", label: "Excellent", color: "bg-green-500 dark:bg-green-600" };
  if (score >= 80) return { grade: "B", label: "Good", color: "bg-blue-500 dark:bg-blue-600" };
  if (score >= 70) return { grade: "C", label: "Fair", color: "bg-yellow-500 dark:bg-yellow-600" };
  if (score >= 50) return { grade: "D", label: "Poor", color: "bg-orange-500 dark:bg-orange-600" };
  return { grade: "F", label: "Failing", color: "bg-red-500 dark:bg-red-600" };
}

export function SafetyGrade({ violationCount, healthViolationCount, leadLevel, size = "md" }: SafetyGradeProps) {
  const { grade, label, color } = calculateGrade(violationCount, healthViolationCount, leadLevel);

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-12 w-12 text-xl",
    lg: "h-20 w-20 text-4xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-lg flex items-center justify-center font-bold text-white",
          color,
          sizeClasses[size]
        )}
      >
        {grade}
      </div>
      {size !== "sm" && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
