"use client";

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase/config";
import { getUserDocument } from "../firebase/firestore";
import type { UserDocument } from "../types/user.types";

interface AuthState {
  user: User | null;
  userDoc: UserDocument | null;
  loading: boolean;
  initialized: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    userDoc: null,
    loading: true,
    initialized: false,
  });

  const fetchUserDoc = useCallback(async (user: User) => {
    try {
      const doc = await getUserDocument(user.uid);
      setState({
        user,
        userDoc: doc,
        loading: false,
        initialized: true,
      });
    } catch {
      setState({
        user,
        userDoc: null,
        loading: false,
        initialized: true,
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserDoc(user);
      } else {
        setState({ user: null, userDoc: null, loading: false, initialized: true });
      }
    });

    return () => unsubscribe();
  }, [fetchUserDoc]);

  return state;
}
