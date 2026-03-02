"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Sun, Moon, Monitor, Volume2, VolumeX } from "lucide-react";
import { applyTheme, listenSystemThemeChange } from "@/utils/theme";

type Theme = "light" | "dark" | "system";

interface SettingsData {
    theme: Theme;
    soundEnabled: boolean;
    soundVolume: number;
}

function loadSettings(): SettingsData {
    if (typeof window === "undefined")
        return { theme: "dark", soundEnabled: true, soundVolume: 70 };
    try {
        const raw = localStorage.getItem("wordle-settings");
        if (!raw) return { theme: "dark", soundEnabled: true, soundVolume: 70 };
        return JSON.parse(raw);
    } catch {
        return { theme: "dark", soundEnabled: true, soundVolume: 70 };
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
            <div className="bg-[#1a1a1b] border border-[#3a3a3c] rounded-lg w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#3a3a3c] shrink-0">
                    <h2 className="text-white font-bold text-base tracking-wide">
                        Configuracion
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[#818384] hover:text-white transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-4 px-5 py-5">
                        <div className="bg-[#121213] border border-[#3a3a3c] rounded-lg p-4">
                            <h3 className="text-[11px] text-[#818384] uppercase tracking-wider mb-4">
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
                                                ? "border-[#538d4e] bg-[#538d4e]/15 text-[#538d4e]"
                                                : "border-[#3a3a3c] bg-transparent text-[#818384] hover:border-[#565656]"
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-[11px] font-medium">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-[#121213] border border-[#3a3a3c] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[11px] text-[#818384] uppercase tracking-wider">
                                    Sonido
                                </h3>
                                <button
                                    onClick={() =>
                                        handleChange({ ...settings, soundEnabled: !settings.soundEnabled })
                                    }
                                    className={`relative w-11 h-6 rounded-full transition-colors ${settings.soundEnabled ? "bg-[#538d4e]" : "bg-[#3a3a3c]"
                                        }`}
                                    aria-label="Toggle sonido"
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.soundEnabled ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className={`transition-opacity ${settings.soundEnabled ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                                <div className="flex items-center gap-3">
                                    <VolumeX className="w-4 h-4 text-[#818384] shrink-0" />
                                    <div className="flex-1 relative h-6 flex items-center">
                                        <div className="w-full h-1.5 bg-[#3a3a3c] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#538d4e] rounded-full"
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
                                    <Volume2 className="w-4 h-4 text-[#818384] shrink-0" />
                                    <span className="text-xs text-[#818384] tabular-nums w-8 text-right">
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
