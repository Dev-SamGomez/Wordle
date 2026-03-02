export type Theme = "light" | "dark" | "system";

export function applyTheme(theme: Theme) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (theme === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", isDark);
        return;
    }

    root.classList.toggle("dark", theme === "dark");
}

export function listenSystemThemeChange(cb: (isDark: boolean) => void) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => cb(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
}
