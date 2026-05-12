import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  type User,
} from "firebase/auth";
import { auth } from "./config";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/too-many-requests": "Too many failed attempts. Please try again in 30 minutes.",
  "auth/user-disabled": "This account has been disabled. Contact your administrator.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password is too weak. Use at least 8 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/network-request-failed": "Network error. Please check your internet connection.",
  "auth/requires-recent-login": "Please log out and log back in to perform this action.",
};

export function getAuthErrorMessage(code: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? "An unexpected error occurred. Please try again.";
}

export async function signIn(
  email: string,
  password: string,
  rememberMe = false
): Promise<User> {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function changeUserPassword(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user.");
  await updatePassword(user, newPassword);
}
