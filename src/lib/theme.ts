import type { Category, Priority } from "@/types";

export const categoryColors: Record<Category, string> = {
  work: "#38bdf8",
  personal: "#8b5cf6",
  health: "#10b981",
  study: "#f59e0b",
  default: "#a3a3a3",
};

export const priorityColors: Record<Priority, string> = {
  low: "#10b981",
  med: "#f59e0b",
  high: "#fb7185",
};
