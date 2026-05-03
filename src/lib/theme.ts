import type { Category, Priority } from "@/types";

export const categoryColors: Record<Category, string> = {
  work: "#38bdf8",
  personal: "#8b5cf6",
  health: "#10b981",
  study: "#f59e0b",
  default: "#a3a3a3",
};

export const categoryLabels: Record<Category, string> = {
  work: "업무",
  personal: "개인",
  health: "운동",
  study: "학습",
  default: "일반",
};

export const priorityColors: Record<Priority, string> = {
  low: "#60A5FA",
  med: "#FB923C",
  high: "#F472B6",
};

// Soft pill styling for priority badges (bg + fg).
export const priorityBadge: Record<Priority, { bg: string; fg: string }> = {
  low: { bg: "#DBEAFE", fg: "#1D4ED8" },
  med: { bg: "#FFEDD5", fg: "#C2410C" },
  high: { bg: "#FCE7F3", fg: "#BE185D" },
};
