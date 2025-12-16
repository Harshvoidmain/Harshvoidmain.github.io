import { SessionUser } from "@/app/lib/auth";

export function isAdmin(user: SessionUser | null): boolean {
  return !!user && user.role === "admin";
}

export function isOwner(user: SessionUser | null, ownerId: number): boolean {
  return !!user && user.id === ownerId;
}

export function canViewPublication(
  user: SessionUser | null,
  ownerId: number
): boolean {
  return isAdmin(user) || isOwner(user, ownerId);
}

export function canEditPublication(
  user: SessionUser | null,
  ownerId: number
): boolean {
  return isAdmin(user) || isOwner(user, ownerId);
}

export function canDeletePublication(
  user: SessionUser | null,
  ownerId: number
): boolean {
  return isAdmin(user) || isOwner(user, ownerId);
}
