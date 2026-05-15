export type Priority = "low" | "med" | "high";

export type Category = "work" | "personal" | "health" | "study" | "default";

export type Task = {
  id: string;
  title: string;
  done: boolean;
  priority?: Priority;
  category?: Category;
  dueAt?: string | null;
  endsAt?: string | null;
  googleEventId?: string | null;
  createdAt: string;
};

export type Event = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  category?: Category;
  priority?: Priority;
  source: "local" | "google";
  googleEventId?: string | null;
  taskId?: string | null;
  ownerName?: string | null;
};

export type Note = {
  id: string;
  content: string;
  createdAt: string;
};
