import { NextRequest } from "next/server";
import { query } from "@/app/lib/db";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default-very-strong-secret-key";

export async function getAuthUser(request: NextRequest) {
    try {
        let sessionToken = request.cookies.get("session_token")?.value;

        // Also check cookie header manually if Next.js didn't parse it
        if (!sessionToken) {
            const cookieHeader = request.headers.get("cookie");
            if (cookieHeader) {
                const cookies = cookieHeader.split(";");
                const sessionCookie = cookies.find((c) =>
                    c.trim().startsWith("session_token=")
                );
                if (sessionCookie) {
                    sessionToken = sessionCookie.split("=")[1];
                }
            }
        }

        // DEV MODE fallback
        if (
            process.env.NODE_ENV !== "production" &&
            request.cookies.get("auth_status")?.value === "debug_login"
        ) {
            const debugUsers = await query(
                `SELECT id, username, email, role, name, department_id, faculty_id
         FROM users 
         WHERE role = 'admin' 
         LIMIT 1`
            );
            if (debugUsers && (debugUsers as any[]).length > 0) {
                return (debugUsers as any[])[0];
            }
        }

        if (!sessionToken || !JWT_SECRET) return null;

        const encoder = new TextEncoder();
        const secretKey = encoder.encode(JWT_SECRET);
        const { payload } = await jose.jwtVerify(sessionToken, secretKey);

        const users = await query(
            `SELECT u.id, u.username, u.email, u.role, u.name, u.department_id, u.faculty_id
       FROM users u
       WHERE u.id = ? AND u.is_active = 1
       LIMIT 1`,
            [payload.userId as number]
        );

        if (users && (users as any[]).length > 0) {
            return (users as any[])[0];
        }
    } catch (error) {
        console.error("Server Auth helper error:", error);
    }
    return null;
}
