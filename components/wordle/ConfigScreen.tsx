"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Sun, Moon, Monitor, Volume2, VolumeX, User as UserIcon, Check, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { applyTheme, listenSystemThemeChange, Theme } from "@/utils/theme";

import { useAuth } from "@/hooks/use-auth";
import { isNicknameAvailable, normalizeNickname, updateNicknameTransactional } from "@/utils/nicknames";

interface SettingsData {
    theme: Theme;
    soundEnabled: boolean;
    soundVolume: number;
}

const loadSettings = (): SettingsData => {
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

    const { user, authLoading } = useAuth();
    const [nickInput, setNickInput] = useState("");
    const [nickValid, setNickValid] = useState<{ ok: boolean; reason?: string }>({ ok: true });
    const [checking, setChecking] = useState(false);
    const [available, setAvailable] = useState<boolean | null>(null);
    const [saveBusy, setSaveBusy] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [saveErr, setSaveErr] = useState<string | null>(null);

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

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setNickInput("");
            setAvailable(null);
            return;
        }
        const initial = user.displayName ?? user.email?.split("@")[0] ?? "";
        setNickInput(initial);
        setAvailable(null);
        setSaveMsg(null);
        setSaveErr(null);
    }, [user, authLoading]);

    useEffect(() => {
        if (!user) return;
        const n = normalizeNickname(nickInput);
        if (!n.ok) {
            setNickValid({ ok: false, reason: n.reason });
            setAvailable(null);
            return;
        }
        setNickValid({ ok: true });

        setChecking(true);
        setAvailable(null);
        const t = setTimeout(async () => {
            try {
                const ok = await isNicknameAvailable(nickInput.trim());
                setAvailable(ok);
            } catch {
                setAvailable(null);
            } finally {
                setChecking(false);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [nickInput, user]);

    const onSaveNickname = async () => {
        if (!user) return;
        setSaveBusy(true);
        setSaveMsg(null);
        setSaveErr(null);
        try {
            await updateNicknameTransactional(nickInput.trim());
            setSaveMsg("Nickname actualizado correctamente.");
        } catch (e: any) {
            setSaveErr(e?.message ?? "No se pudo actualizar el nickname.");
        } finally {
            setSaveBusy(false);
        }
    };

    const saveDisabled =
        !user ||
        !nickValid.ok ||
        checking ||
        available === false ||
        saveBusy ||
        nickInput.trim().length === 0 ||
        (user?.displayName ?? user?.email?.split("@")[0] ?? "") === nickInput.trim();

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border border-border rounded-lg w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h2 className="text-foreground font-bold text-base tracking-wide">
                        Configuración
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
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
                                <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider">
                                    Sonido
                                </h3>
                                <button
                                    onClick={() => handleChange({ ...settings, soundEnabled: !settings.soundEnabled })}
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

                        {user && (
                            <div className="bg-background border border-border rounded-lg p-4">
                                <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider mb-4">
                                    Cuenta
                                </h3>

                                <div className="text-xs text-muted-foreground mb-3">
                                    Correo:{" "}
                                    <span className="font-medium text-foreground">
                                        {user.email}
                                    </span>
                                </div>

                                <label className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                    Nickname
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 flex items-center gap-2 border border-border rounded-md px-3 py-2">
                                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                                        <input
                                            className="bg-transparent outline-none w-full text-sm"
                                            placeholder="Tu nickname"
                                            value={nickInput}
                                            onChange={(e) => setNickInput(e.target.value)}
                                            disabled={saveBusy}
                                        />
                                    </div>
                                    <button
                                        onClick={onSaveNickname}
                                        disabled={saveDisabled}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-foreground text-background font-semibold hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        {saveBusy ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="w-4 h-4" />
                                        )}
                                        Guardar
                                    </button>
                                </div>

                                <div className="min-h-5 mt-1 text-xs">
                                    {!nickValid.ok && (
                                        <span className="text-red-500">{nickValid.reason}</span>
                                    )}
                                    {nickValid.ok && checking && (
                                        <span className="text-muted-foreground">Comprobando disponibilidad…</span>
                                    )}
                                    {nickValid.ok && available === true && (
                                        <span className="text-green-500 inline-flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" /> Disponible
                                        </span>
                                    )}
                                    {nickValid.ok && available === false && (
                                        <span className="text-red-500 inline-flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Ya está en uso
                                        </span>
                                    )}
                                </div>

                                {saveMsg && (
                                    <div className="text-xs text-green-600 mt-1">{saveMsg}</div>
                                )}
                                {saveErr && (
                                    <div className="text-xs text-red-500 mt-1">{saveErr}</div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}