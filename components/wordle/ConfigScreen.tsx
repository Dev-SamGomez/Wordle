"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Sun, Moon, Monitor, Volume2, VolumeX } from "lucide-react";
import { applyTheme, listenSystemThemeChange, Theme } from "@/utils/theme";
interface SettingsData {
    theme: Theme;
    soundEnabled: boolean;
    soundVolume: number;
}

const loadSettings = (): SettingsData  => {
    if (typeof window === "undefined")
        return { theme: "system", soundEnabled: true, soundVolume: 70 };
    try {
        const raw = localStorage.getItem("wordle-settings");
        if (!raw) return { theme: "system", soundEnabled: true, soundVolume: 70 };
        return JSON.parse(raw);
    } catch {
        return { theme: "system", soundEnabled: true, soundVolume: 70 };
    }
}

function saveSettings(s: SettingsData) {
    localStorage.setItem("wordle-settings", JSON.stringify(s));
}

interface SettingsProps {
    onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsProps) {
    const [settings, setSettings] = useState<SettingsData>(loadSettings);

    const handleChange = useCallback((s: SettingsData) => {
        setSettings(s);
        saveSettings(s);
        applyTheme(s.theme);
    }, []);

    const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
        { value: "light", icon: Sun, label: "Claro" },
        { value: "dark", icon: Moon, label: "Oscuro" },
        { value: "system", icon: Monitor, label: "Sistema" },
    ];

    useEffect(() => {
        applyTheme(settings.theme);

        if (settings.theme === "system") {
            const unsub = listenSystemThemeChange((isDark) => {
                document.documentElement.classList.toggle("dark", isDark);
            });
            return () => unsub();
        }
    }, [settings.theme]);

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border border-border rounded-lg w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h2 className="text-foreground font-bold text-base tracking-wide">
                        Configuracion
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[muted-foreground hover:text-foreground transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4 px-5 py-5">
                        <div className="bg-background border border-border rounded-lg p-4">
                            <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider mb-4">
                                Apariencia
                            </h3>
                            <div className="flex gap-2">
                                {themes.map((t) => {
                                    const Icon = t.icon;
                                    const active = settings.theme === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            onClick={() => handleChange({ ...settings, theme: t.value })}
                                            className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-lg border transition-all ${active
                                                ? "border-[hsl(var(--tile-correct))] bg-muted/15 text-[hsl(var(--tile-correct))]"
                                                : "border-border bg-transparent text-muted-foreground hover:border-border"
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-[11px] font-medium">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-background border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[11px] text-muted-goreground uppercase tracking-wider">
                                    Sonido
                                </h3>
                                <button
                                    onClick={() =>
                                        handleChange({ ...settings, soundEnabled: !settings.soundEnabled })
                                    }
                                    className={`relative w-11 h-6 rounded-full transition-colors ${settings.soundEnabled ? "bg-[hsl(var(--tile-correct))]" : "bg-muted"
                                        }`}
                                    aria-label="Toggle sonido"
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-muted-foreground transition-transform ${settings.soundEnabled ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className={`transition-opacity ${settings.soundEnabled ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                                <div className="flex items-center gap-3">
                                    <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 relative h-6 flex items-center">
                                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[hsl(var(--tile-correct))] rounded-full"
                                                style={{ width: `${settings.soundVolume}%` }}
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={settings.soundVolume}
                                            onChange={(e) =>
                                                handleChange({
                                                    ...settings,
                                                    soundVolume: Number(e.target.value),
                                                })
                                            }
                                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                                        {settings.soundVolume}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
