"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Publication = {
  id: number;
  title: string;
  category: string;
  year: number;
};

type ApiResponse = {
  data: Publication[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export default function MyPublicationsPage() {
  const [items, setItems] = useState<Publication[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const load = async (p = page, l = limit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/publications/my?page=${p}&limit=${l}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as ApiResponse;
      setItems(json.data);
      setPages(json.pagination.pages);
      setPage(json.pagination.page);
      setLimit(json.pagination.limit);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Failed to load";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load(1, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onDelete = async (id: number) => {
    const ok = window.confirm("Delete this publication?");
    if (!ok) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/publications/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Deleted");
      await load(page, limit);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Delete failed";
      setError(String(msg));
    }
  };
  const goto = async (p: number) => {
    await load(p, limit);
  };
  return (
    <div style={{ padding: 16 }}>
      <h1>My Publications</h1>
      {message && <div style={{ color: "green" }}>{message}</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                #
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Title
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Category
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Year
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Edit
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                Delete
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id}>
                <td style={{ padding: "8px 0" }}>{(page - 1) * limit + idx + 1}</td>
                <td style={{ padding: "8px 0" }}>{it.title}</td>
                <td>{it.category}</td>
                <td>{it.year}</td>
                <td>
                  <Link href={`/publications/edit/${it.id}`}>Edit</Link>
                </td>
                <td>
                  <button onClick={() => onDelete(it.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16 }}>
                  No publications
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button disabled={page <= 1} onClick={() => goto(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button disabled={page >= pages} onClick={() => goto(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
