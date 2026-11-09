"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { LatihanQuestion } from "@/types/latihan";

type LatihanContextValue = {
  questions: LatihanQuestion[];
  setQuestions: Dispatch<SetStateAction<LatihanQuestion[]>>;
};

const LatihanContext = createContext<LatihanContextValue | null>(null);

export function LatihanProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<LatihanQuestion[]>([]);

  return (
    <LatihanContext.Provider value={{ questions, setQuestions }}>
      {children}
    </LatihanContext.Provider>
  );
}

export function useLatihan() {
  const context = useContext(LatihanContext);
  if (!context) {
    throw new Error("useLatihan must be used within LatihanProvider");
  }
  return context;
}
