import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",

  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("Themes", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    get().setTheme(next);
  },

  initTheme: () => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("Themes") as Theme | null;

    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const theme = stored ?? (systemPrefersDark ? "dark" : "light");

    document.documentElement.classList.toggle("dark", theme === "dark");

    set({ theme });
  },
}));
