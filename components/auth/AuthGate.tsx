"use client";

import { useCallback, useMemo, useState } from "react";
import { X, Mail, User as UserIcon, Lock, Loader2, ShieldCheck, RefreshCcw } from "lucide-react";
import { signInWithGoogle, signInWithEmail, signUpWithEmail, ensureNickname } from "@/lib/auth-client";
import { getFirebase } from "@/lib/firebase-client";
import { sendEmailVerification } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";

type Props = { onClose?: () => void };

function mapFirebaseError(err: any): string {
    const code = err?.code || err?.message || "";
    const lc = String(code).toLowerCase();

    if (lc.includes("network") || lc.includes("timeout")) return "Problemas de red. Inténtalo de nuevo.";
    if (lc.includes("too-many-requests")) return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
    if (lc.includes("popup-blocked")) return "El navegador bloqueó la ventana de Google. Permite pop-ups e inténtalo de nuevo.";
    if (lc.includes("unauthorized-domain")) return "Dominio no autorizado para iniciar sesión. Revisa la configuración del proyecto.";
    if (lc.includes("popup-closed-by-user")) return "Se cerró la ventana de Google antes de completar el acceso.";

    if (lc.includes("invalid-email")) return "El correo no es válido.";
    if (lc.includes("user-not-found")) return "No existe una cuenta con ese correo.";
    if (lc.includes("wrong-password")) return "Contraseña incorrecta.";
    if (lc.includes("invalid-credential")) return "Correo o contraseña incorrectos.";
    if (lc.includes("invalid-login-credentials")) return "Correo o contraseña incorrectos.";

    if (lc.includes("email-already-in-use")) return "Ese correo ya está registrado. Inicia sesión.";
    if (lc.includes("weak-password")) return "La contraseña es demasiado débil (mínimo 6 caracteres).";
    if (lc.includes("operation-not-allowed")) return "Proveedor no habilitado. Revisa la consola de Firebase.";
    if (lc.includes("admin-restricted-operation")) return "Operación restringida por configuración del proyecto.";

    return typeof err?.message === "string" ? err.message : "Ocurrió un error. Inténtalo de nuevo.";
}

export default function AuthDialogContent({ onClose }: Props) {
    const [mode, setMode] = useState<"login" | "register">("login");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [askNicknameForGoogle, setAskNicknameForGoogle] = useState(false);

    const [verificationSent, setVerificationSent] = useState(false);
    const [resending, setResending] = useState(false);

    const canSubmitAuth = useMemo(() => {
        const hasEmailPass = email.trim().length > 0 && password.length >= 6;
        if (mode === "login") return hasEmailPass;
        return hasEmailPass && nickname.trim().length > 0;
    }, [email, password, nickname, mode]);

    const withBusy = useCallback(async (fn: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        try {
            await fn();
        } catch (e: any) {
            setError(mapFirebaseError(e));
        } finally {
            setBusy(false);
        }
    }, []);

    const handleGoogle = () =>
        withBusy(async () => {
            const user = await signInWithGoogle();
            if (user.displayName) {
                onClose?.();
            } else {
                setAskNicknameForGoogle(true);
                if (!nickname.trim() && user.email) {
                    setNickname(user.email.split("@")[0] || "");
                }
            }
        });

    const handleLoginEmail = () =>
        withBusy(async () => {
            const user = await signInWithEmail(email.trim(), password);
            if (!user.displayName) {
                const nick = email.trim().split("@")[0] || "Jugador";
                await ensureNickname(nick);
            }
            onClose?.();
        });

    const handleRegisterEmail = () =>
        withBusy(async () => {
            if (nickname.trim().length === 0) {
                setError("Ingresa un nickname.");
                return;
            }
            const user = await signUpWithEmail(email.trim(), password);
            try {
                await sendEmailVerification(user);
                setVerificationSent(true);
            } catch (e) {
                setError(mapFirebaseError(e));
            }
            await ensureNickname(nickname.trim());
            onClose?.();
        });

    const handleSaveNicknameForGoogle = () =>
        withBusy(async () => {
            if (nickname.trim().length === 0) {
                setError("Ingresa un nickname.");
                return;
            }
            await ensureNickname(nickname.trim());
            onClose?.();
        });

    const onAuthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter" || busy) return;
        if (!canSubmitAuth) return;
        if (mode === "login") handleLoginEmail();
        else handleRegisterEmail();
    };

    const resendVerification = async () => {
        const deps = getFirebase();
        if (!deps) return;
        const u = deps.auth.currentUser;
        if (!u) return;

        setResending(true);
        setError(null);
        try {
            await sendEmailVerification(u);
            setVerificationSent(true);
        } catch (e: any) {
            setError(mapFirebaseError(e));
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border border-border rounded-xl m-auto w-full max-w-md overflow-hidden">
                <div className="flex flex-auto items-center justify-end p-2">
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center justify-center px-5 py-4 border-b border-border">
                    <div className="flex items-center justify-between gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-[hsl(var(--tile-correct))]" />
                        <h2 className="text-foreground font-bold text-base tracking-wide">
                            Inicia sesión para acceder a competitivo
                        </h2>
                    </div>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {!!error && (
                        <div className="text-sm text-red-500 border border-red-500/40 rounded-md px-3 py-2 bg-red-500/5">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGoogle}
                        disabled={busy}
                        className="w-full flex items-center justify-center gap-2
                bg-foreground text-background font-semibold
                py-3 rounded-lg
                hover:bg-muted-foreground transition
                disabled:opacity-50"
                    >
                        {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <span className="text-sm">
                                <FcGoogle />
                            </span>
                        )}
                        Continuar con Google
                    </button>

                    {askNicknameForGoogle && (
                        <div className="mt-2 border border-border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-2">
                                Completa tu <span className="font-semibold">nickname</span> para continuar.
                            </p>
                            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2">
                                <UserIcon className="w-4 h-4 text-muted-foreground" />
                                <input
                                    className="bg-transparent outline-none w-full text-sm"
                                    placeholder="Tu nickname"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && nickname.trim() && !busy) {
                                            handleSaveNicknameForGoogle();
                                        }
                                    }}
                                    disabled={busy}
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={handleSaveNicknameForGoogle}
                                    disabled={busy || nickname.trim().length === 0}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-foreground text-background font-semibold hover:opacity-90 transition disabled:opacity-50"
                                >
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    Guardar nickname
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-muted-foreground" />
                        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">O con email</span>
                        <div className="flex-1 h-px bg-muted-foreground" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Email
                        </label>
                        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="email"
                                placeholder="tu@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={onAuthKeyDown}
                                disabled={busy}
                                className="bg-transparent outline-none w-full text-sm text-foreground placeholder-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Contraseña
                        </label>
                        <div className="flex items-center gap-2 bg-gackground border border-border rounded-lg px-3 py-3">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={onAuthKeyDown}
                                disabled={busy}
                                className="bg-transparent outline-none w-full text-sm text-foreground placeholder-muted-foreground"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            La contraseña debe tener al menos 6 caracteres.
                        </p>
                    </div>

                    {mode === "register" && (
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Nickname
                            </label>
                            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2">
                                <UserIcon className="w-4 h-4 text-muted-foreground" />
                                <input
                                    className="bg-transparent outline-none w-full text-sm"
                                    placeholder="Tu nickname"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    onKeyDown={onAuthKeyDown}
                                    disabled={busy}
                                />
                            </div>

                            {verificationSent && (
                                <div className="text-xs border border-blue-500/40 bg-blue-500/10 text-blue-500 rounded-md px-3 py-2 flex items-center justify-between gap-3">
                                    <div>
                                        Te enviamos un correo de verificación a <strong>{email}</strong>. Revísalo para activar tu cuenta.
                                    </div>
                                    <button
                                        onClick={resendVerification}
                                        disabled={resending}
                                        className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400"
                                    >
                                        <RefreshCcw className="w-3.5 h-3.5" />
                                        {resending ? "Enviando..." : "Reenviar"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "login" ? (
                        <button
                            onClick={handleLoginEmail}
                            disabled={busy || !canSubmitAuth}
                            className="w-full py-3 rounded-lg
                bg-[hsl(var(--tile-correct))]
                text-foreground font-semibold
                hover:opacity-90 transition
                disabled:opacity-50"
                        >
                            Iniciar Sesión
                        </button>
                    ) : (
                        <button
                            onClick={handleRegisterEmail}
                            disabled={busy || !canSubmitAuth}
                            className="w-full py-3 rounded-lg
                bg-[hsl(var(--tile-correct))]
                text-foreground font-semibold
                hover:opacity-90 transition
                disabled:opacity-50"
                        >
                            Crear Cuenta
                        </button>
                    )}

                    <div className="text-center text-sm text-muted-foreground mt-2">
                        {mode === "login" ? (
                            <>
                                ¿No tienes una cuenta?{" "}
                                <button
                                    onClick={() => setMode("register")}
                                    className="text-foreground font-semibold hover:underline"
                                >
                                    Regístrate gratis
                                </button>
                            </>
                        ) : (
                            <>
                                ¿Ya tienes cuenta?{" "}
                                <button
                                    onClick={() => setMode("login")}
                                    className="text-foreground font-semibold hover:underline"
                                >
                                    Inicia sesión
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}