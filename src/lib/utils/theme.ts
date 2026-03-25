export type Theme = "light" | "dark" | "system";

const LS_KEY = "wordle-settings";

type SettingsData = {
    theme: Theme;
    soundEnabled: boolean;
    soundVolume: number;
};

export function readStoredSettings(): SettingsData | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? (JSON.parse(raw) as SettingsData) : null;
    } catch {
        return null;
    }
}

export function writeStoredSettings(next: SettingsData) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch { }
}

export function getStoredTheme(): Theme | null {
    const s = readStoredSettings();
    return s?.theme ?? null;
}

export function applyTheme(theme: Theme) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (theme === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", isDark);
    } else {
        root.classList.toggle("dark", theme === "dark");
    }
    
    try {
        document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch { }
}

export function listenSystemThemeChange(cb: (isDark: boolean) => void) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => cb(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
}

export function initThemeFromStorage(defaultTheme: Theme = "system"): Theme {
    const stored = getStoredTheme();
    const theme = stored ?? defaultTheme;
    applyTheme(theme);
    return theme;
}
