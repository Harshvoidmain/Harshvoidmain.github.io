import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { getSessionUser } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
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
  const body = await request.json();
  const id = parseInt(body?.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  type Row = { id: number; user_id: number };
  const rows = (await query(
    `SELECT id, user_id FROM publications WHERE id = ? AND status = 1 LIMIT 1`,
    [id]
  )) as Row[];
  if (!rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ownerId = rows[0].user_id;
  if (user.role !== "admin" && user.id !== ownerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await query(`UPDATE publications SET status = 0 WHERE id = ?`, [id]);
  return NextResponse.json({ success: true });
}
