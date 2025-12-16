import { query } from "@/app/lib/db";
import { getSessionUser } from "@/app/lib/auth";
import EditForm from "./EditForm";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  type PubRow = {
    id: number;
    user_id: number;
    title: string;
    category: string;
    publisher: string | null;
    venue: string | null;
    year: number;
    abstract: string | null;
    co_authors: string | null;
    pdf_url: string | null;
    status: number;
  };
  const { id } = await params;
  const pubId = parseInt(id);
  const user = await getSessionUser();
  if (!user || Number.isNaN(pubId)) {
    return <div>Unauthorized</div>;
  }
  await query(`
    CREATE TABLE IF NOT EXISTS publications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
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
  const rows = (await query(
    `SELECT id, user_id, title, category, publisher, venue, year, abstract, co_authors, pdf_url, status
     FROM publications WHERE id = ? AND status = 1 LIMIT 1`,
    [pubId]
  )) as PubRow[];
  if (!rows.length) {
    return <div>Not found</div>;
  }
  const pub = rows[0];
  if (user.role !== "admin" && user.id !== pub.user_id) {
    return <div>Forbidden</div>;
  }
  const initial = {
    id: pub.id as number,
    title: pub.title as string,
    category: pub.category as string,
    year: Number(pub.year),
    abstract: pub.abstract || "",
    publisher: pub.publisher || "",
    venue: pub.venue || "",
    co_authors:
      pub.co_authors ? JSON.parse(pub.co_authors) : [],
    pdf_url: pub.pdf_url || null,
  };
  return (
    <div style={{ padding: 16 }}>
      <h1>Edit Publication</h1>
      <EditForm initial={initial} />
    </div>
  );
}
