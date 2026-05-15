"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase/config";
import { subscribeToUser } from "../firebase/firestore";
import type { UserDocument } from "../types/user.types";
import { ROLE_DEFAULT_PERMISSIONS } from "../types/permissions.types";

interface AuthContextValue {
  user: User | null;
  userDoc: UserDocument | null;
  loading: boolean;
  initialized: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  userDoc: null,
  loading: true,
  initialized: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (firebaseUser) {
        unsubscribeDoc = subscribeToUser(firebaseUser.uid, (doc) => {
          if (doc && !doc.modulePermissions) {
            doc.modulePermissions = ROLE_DEFAULT_PERMISSIONS[doc.role];
          }
          setUserDoc(doc);
          setLoading(false);
          setInitialized(true);
        });
      } else {
        setUserDoc(null);
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDoc?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}
