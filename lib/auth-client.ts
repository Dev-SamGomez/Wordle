"use client";

import { getFirebase } from "@/lib/firebase-client";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export async function signInWithGoogle(): Promise<User> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { auth } = deps;

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    return result.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { auth } = deps;

    const res = await createUserWithEmailAndPassword(auth, email, password);
    return res.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { auth } = deps;

    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
}

export async function ensureNickname(nickname: string): Promise<void> {
    const deps = getFirebase();
    if (!deps) throw new Error("Firebase no disponible");
    const { auth, db } = deps;

    const user = auth.currentUser;
    if (!user) throw new Error("No hay usuario autenticado");

    if (!user.displayName || user.displayName !== nickname) {
        await updateProfile(user, { displayName: nickname });
    }

    await setDoc(
        doc(db, "profiles", user.uid),
        { nickname, lastUpdated: serverTimestamp() },
        { merge: true }
    );
}

export async function signOutUser() {
    const deps = getFirebase();
    if (!deps) return;
    await signOut(deps.auth);
}

export function getCurrentUser(): User | null {
    return getFirebase()?.auth.currentUser ?? null;
}