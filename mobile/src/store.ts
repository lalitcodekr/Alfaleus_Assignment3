import { create } from 'zustand';

interface InterviewStore {
  token: string | null;
  candidateName: string | null;
  roleTitle: string | null;
  questions: any[];
  currentScreen: 'welcome' | 'interview' | 'done';
  setInterviewData: (token: string, candidateName: string, roleTitle: string, questions: any[]) => void;
  setScreen: (screen: 'welcome' | 'interview' | 'done') => void;
  reset: () => void;
}

export const useStore = create<InterviewStore>((set) => ({
  token: null,
  candidateName: null,
  roleTitle: null,
  questions: [],
  currentScreen: 'welcome',
  setInterviewData: (token, candidateName, roleTitle, questions) =>
    set({ token, candidateName, roleTitle, questions, currentScreen: 'interview' }),
  setScreen: (screen) => set({ currentScreen: screen }),
  reset: () =>
    set({ token: null, candidateName: null, roleTitle: null, questions: [], currentScreen: 'welcome' }),
}));
