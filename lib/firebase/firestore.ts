import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  type DocumentData,
  type QueryConstraint,
  enableIndexedDbPersistence,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type { UserDocument } from "../types/user.types";

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch(() => {
    // Persistence already enabled or not supported — ignore
  });
}

// Generic helpers
export async function getDocument<T>(path: string): Promise<T | null> {
  const snap = await getDoc(doc(db, path));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function setDocument(path: string, data: DocumentData): Promise<void> {
  await setDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() });
}

export async function addDocument(
  collectionPath: string,
  data: DocumentData
): Promise<string> {
  const ref = await addDoc(collection(db, collectionPath), {
    ...data,
    blocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocument(path: string, data: Partial<DocumentData>): Promise<void> {
  await updateDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(path: string): Promise<void> {
  await updateDoc(doc(db, path), { blocked: true, updatedAt: serverTimestamp() });
}

export async function hardDeleteDocument(path: string): Promise<void> {
  await deleteDoc(doc(db, path));
}

export async function queryDocuments<T>(
  collectionPath: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionPath), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

// User-specific helpers
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  return getDocument<UserDocument>(`users/${uid}`);
}

export async function updateUserDocument(
  uid: string,
  data: Partial<UserDocument>
): Promise<void> {
  await updateDocument(`users/${uid}`, data);
}

export function subscribeToUser(
  uid: string,
  callback: (user: UserDocument | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as unknown as UserDocument);
  });
}

// Audit log
export async function writeAuditLog(log: {
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await addDoc(collection(db, "auditLogs"), {
    ...log,
    timestamp: serverTimestamp(),
  });
}

// Re-export query helpers
export { query, where, orderBy, limit, collection, doc, onSnapshot, serverTimestamp };
