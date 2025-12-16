import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { getSessionUser } from "@/app/lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

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
  const form = await request.formData();
  const idRaw = form.get("id");
  const id = typeof idRaw === "string" ? parseInt(idRaw) : NaN;
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  type Row = { id: number; user_id: number; pdf_url: string | null };
  const rows = (await query(
    `SELECT id, user_id, pdf_url FROM publications WHERE id = ? AND status = 1 LIMIT 1`,
    [id]
  )) as Row[];
  if (!rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ownerId = rows[0].user_id;
  if (user.role !== "admin" && user.id !== ownerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const title = form.get("title");
  const category = form.get("category");
  const publisher = form.get("publisher");
  const venue = form.get("venue");
  const yearRaw = form.get("year");
  const abstract = form.get("abstract");
  const coAuthorsRaw = form.get("co_authors");
  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof category !== "string" ||
    !category.trim()
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const year = typeof yearRaw === "string" ? parseInt(yearRaw) : NaN;
  if (Number.isNaN(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  let coAuthorsJson: string | null = null;
  if (typeof coAuthorsRaw === "string" && coAuthorsRaw.trim()) {
    try {
      const parsed = JSON.parse(coAuthorsRaw);
      if (!Array.isArray(parsed)) {
        return NextResponse.json({ error: "Invalid co_authors" }, { status: 400 });
      }
      coAuthorsJson = JSON.stringify(parsed);
    } catch {
      return NextResponse.json({ error: "Invalid co_authors" }, { status: 400 });
    }
  }
  let pdfUrl = rows[0].pdf_url as string | null;
  const file = form.get("pdf");
  if (file && typeof file === "object" && "arrayBuffer" in file) {
    const f = file as File;
    const type = f.type || "";
    if (type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF allowed" }, { status: 400 });
    }
    const bytes = Buffer.from(await f.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", "pdfs");
    fs.mkdirSync(dir, { recursive: true });
    const name = `${crypto.randomUUID()}.pdf`;
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, bytes);
    const newUrl = `/uploads/pdfs/${name}`;
    if (pdfUrl && pdfUrl.startsWith("/uploads/pdfs/")) {
      try {
        const oldPath = path.join(process.cwd(), "public", pdfUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch {}
    }
    pdfUrl = newUrl;
  }
  await query(
    `UPDATE publications
     SET title = ?, category = ?, publisher = ?, venue = ?, year = ?, abstract = ?, co_authors = ?, pdf_url = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      title.trim(),
      category.trim(),
      typeof publisher === "string" ? publisher.trim() : null,
      typeof venue === "string" ? venue.trim() : null,
      year,
      typeof abstract === "string" ? abstract : null,
      coAuthorsJson,
      pdfUrl,
      id,
    ]
  );
  return NextResponse.json({ success: true, id });
}
