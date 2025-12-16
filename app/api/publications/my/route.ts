import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { getSessionUser } from "@/app/lib/auth";

type PubRow = {
  id: number;
  user_id: number;
  title: string;
  category: string;
  year: number;
  abstract: string | null;
  co_authors: string | null;
  pdf_url: string | null;
  status: number;
  created_at: string;
  updated_at: string;
};

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await query(`
    CREATE TABLE IF NOT EXISTS publications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      publisher VARCHAR(255) NULL,
      venue VARCHAR(255) NULL,
      year INT NOT NULL,
      abstract TEXT NULL,
      co_authors JSON NULL,
      pdf_url VARCHAR(1000) NULL,
      status TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (user_id),
      INDEX (status)
    )
  `);
  try { await query(`ALTER TABLE publications ADD COLUMN publisher VARCHAR(255) NULL`); } catch {}
  try { await query(`ALTER TABLE publications ADD COLUMN venue VARCHAR(255) NULL`); } catch {}
  const pageParam = request.nextUrl.searchParams.get("page");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const page = Math.max(1, parseInt(pageParam || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(limitParam || "10")));
  const offset = (page - 1) * limit;
  const where =
    user.role === "admin" ? "status = 1" : "status = 1 AND user_id = ?";
  const params = user.role === "admin" ? [] : [user.id];
  const totalRows = (await query(
    `SELECT COUNT(*) as cnt FROM publications WHERE ${where}`,
    params
  )) as Array<{ cnt: number }>;
  const total = totalRows[0]?.cnt ? Number(totalRows[0].cnt) : 0;
  const rows = (await query(
    `SELECT id, user_id, title, category, publisher, venue, year, abstract, co_authors, pdf_url, status, created_at, updated_at
     FROM publications
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )) as PubRow[];
  const data = rows.map((r) => ({
    ...r,
    co_authors:
      typeof r.co_authors === "string"
        ? JSON.parse(r.co_authors)
        : r.co_authors,
  }));
  return NextResponse.json({
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
