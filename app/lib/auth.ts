import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";

export type SessionUser = { id: number; role: "user" | "admin" };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const id =
      typeof session.user.id === "string"
        ? parseInt(session.user.id as string)
        : (session.user.id as number);
    const roleRaw = (session.user as unknown as { role?: string }).role;
    const role: "user" | "admin" = roleRaw === "admin" ? "admin" : "user";
    if (!Number.isNaN(id)) return { id, role };
  }
  const h = headers();
  const idHeader = h.get("x-user-id");
  const roleHeader = h.get("x-user-role");
  if (idHeader) {
    const id = parseInt(idHeader);
    if (!Number.isNaN(id)) {
      const role: "user" | "admin" =
        roleHeader && roleHeader === "admin" ? "admin" : "user";
      return { id, role };
    }
  }
  return null;
}
