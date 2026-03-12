"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { getFirebase } from "@/lib/firebase-client";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const deps = getFirebase();
        if (!deps) { setAuthLoading(false); return; }

        const unsub = onAuthStateChanged(deps.auth, (u) => {
            setUser(u);
            setAuthLoading(false);
        });
        return () => unsub();
    }, []);

    return { user, authLoading };
}