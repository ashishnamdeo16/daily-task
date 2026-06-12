"use client";

import { create } from "zustand";
import type { FocusSession } from "@prisma/client";

interface FocusState {
  session: FocusSession | null;
  expectedEndAt: number | null; // epoch ms
  alarmActive: boolean;

  setSession: (s: FocusSession | null) => void;
  setExpectedEnd: (ms: number | null) => void;
  triggerAlarm: () => void;
  clearAlarm: () => void;
  reset: () => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  session: null,
  expectedEndAt: null,
  alarmActive: false,

  setSession: (s) =>
    set({
      session: s,
      expectedEndAt: s ? new Date(s.expectedEndAt).getTime() : null,
      alarmActive: false,
    }),
  setExpectedEnd: (ms) => set({ expectedEndAt: ms }),
  triggerAlarm: () => set({ alarmActive: true }),
  clearAlarm: () => set({ alarmActive: false }),
  reset: () => set({ session: null, expectedEndAt: null, alarmActive: false }),
}));
