import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDark: () => void;
  setDarkMode: (dark: boolean) => void;
}

const prefersDark =
  localStorage.getItem('admin_dark') === 'true' ||
  (!localStorage.getItem('admin_dark') && window.matchMedia('(prefers-color-scheme: dark)').matches);

if (prefersDark) document.documentElement.classList.add('dark');

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  darkMode: prefersDark,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleDark: () =>
    set((s) => {
      const next = !s.darkMode;
      localStorage.setItem('admin_dark', String(next));
      document.documentElement.classList.toggle('dark', next);
      return { darkMode: next };
    }),

  setDarkMode: (dark) => {
    localStorage.setItem('admin_dark', String(dark));
    document.documentElement.classList.toggle('dark', dark);
    set({ darkMode: dark });
  },
}));
