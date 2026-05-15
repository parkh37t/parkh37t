"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TaskModal, type TaskModalMode } from "./task-modal";

type OpenCreateOpts = {
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
};

type TaskModalContextValue = {
  openCreate: (opts?: OpenCreateOpts) => void;
  openEdit: (task: Extract<TaskModalMode, { kind: "edit" }>["task"]) => void;
  close: () => void;
};

const TaskModalContext = createContext<TaskModalContextValue | null>(null);

export function useTaskModal(): TaskModalContextValue {
  const ctx = useContext(TaskModalContext);
  if (!ctx) {
    throw new Error("useTaskModal must be used inside <TaskModalProvider>");
  }
  return ctx;
}

export function TaskModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TaskModalMode | null>(null);

  const openCreate = useCallback((opts?: OpenCreateOpts) => {
    setMode({ kind: "create", ...(opts ?? {}) });
  }, []);
  const openEdit = useCallback(
    (task: Extract<TaskModalMode, { kind: "edit" }>["task"]) => {
      setMode({ kind: "edit", task });
    },
    [],
  );
  const close = useCallback(() => setMode(null), []);

  const value = useMemo<TaskModalContextValue>(
    () => ({ openCreate, openEdit, close }),
    [openCreate, openEdit, close],
  );

  return (
    <TaskModalContext.Provider value={value}>
      {children}
      {mode ? (
        <TaskModal open={true} onClose={close} mode={mode} />
      ) : null}
    </TaskModalContext.Provider>
  );
}
