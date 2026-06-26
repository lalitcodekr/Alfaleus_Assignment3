import { create } from 'zustand';

interface UiState {
  filterPanelOpen: boolean;
  scoreRange: [number, number];
  activeJobFilter: string | null;
  interviewStatusFilter: string[];
  shortlistFilter: boolean | null;
  toggleFilterPanel: () => void;
  setScoreRange: (range: [number, number]) => void;
  setActiveJobFilter: (jobId: string | null) => void;
  setInterviewStatusFilter: (statuses: string[]) => void;
  setShortlistFilter: (v: boolean | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  filterPanelOpen: false,
  scoreRange: [0, 100],
  activeJobFilter: null,
  interviewStatusFilter: [],
  shortlistFilter: null,
  toggleFilterPanel: () => set((s) => ({ filterPanelOpen: !s.filterPanelOpen })),
  setScoreRange: (range) => set({ scoreRange: range }),
  setActiveJobFilter: (jobId) => set({ activeJobFilter: jobId }),
  setInterviewStatusFilter: (statuses) => set({ interviewStatusFilter: statuses }),
  setShortlistFilter: (v) => set({ shortlistFilter: v }),
}));
