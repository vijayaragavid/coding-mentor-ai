import { create } from 'zustand';
import type { Session, Tab, Level, Language } from '../types';

interface AppState {
  // Sessions
  sessions: Session[];
  activeSessionId: string | null;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  updateSessionInStore: (session: Session) => void;

  // UI
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // Settings
  language: Language;
  setLanguage: (lang: Language) => void;
  level: Level;
  setLevel: (level: Level) => void;
}

export const useStore = create<AppState>((set) => ({
  // Sessions
  sessions: [],
  activeSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    })),
  setActiveSession: (id) => set({ activeSessionId: id }),
  updateSessionInStore: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    })),

  // UI
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return { darkMode: next };
    }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  // Settings
  language: 'javascript',
  setLanguage: (language) => set({ language }),
  level: 'beginner',
  setLevel: (level) => set({ level }),
}));
