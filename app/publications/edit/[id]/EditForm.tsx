"use client";
import { useState } from "react";

type Initial = {
  id: number;
  title: string;
  category: string;
  year: number;
  abstract: string;
  publisher: string;
  venue: string;
  co_authors: string[];
  pdf_url: string | null;
};

export default function EditForm({ initial }: { initial: Initial }) {
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [year, setYear] = useState(initial.year);
  const [abstract, setAbstract] = useState(initial.abstract || "");
  const [publisher, setPublisher] = useState(initial.publisher || "");
  const [venue, setVenue] = useState(initial.venue || "");
  const [coAuthors, setCoAuthors] = useState<string[]>(
    Array.isArray(initial.co_authors) ? initial.co_authors : []
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const addCoAuthor = () => setCoAuthors([...coAuthors, ""]);
  const updateCoAuthor = (i: number, v: string) => {
    const next = [...coAuthors];
    next[i] = v;
    setCoAuthors(next);
  };
  const removeCoAuthor = (i: number) => {
    const next = [...coAuthors];
    next.splice(i, 1);
    setCoAuthors(next);
  };
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("id", String(initial.id));
      fd.append("title", title);
      fd.append("category", category);
      fd.append("year", String(year));
      fd.append("abstract", abstract);
      fd.append("publisher", publisher);
      fd.append("venue", venue);
      fd.append("co_authors", JSON.stringify(coAuthors.filter((x) => x.trim())));
      if (pdfFile) fd.append("pdf", pdfFile);
      const res = await fetch("/api/publications/update", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Saved");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Save failed";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      {message && <div style={{ color: "green" }}>{message}</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: "100%" }}
        />
      </label>
      <label>
        Category
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          style={{ width: "100%" }}
        />
      </label>
      <label>
        Year
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          required
          style={{ width: "100%" }}
        />
      </label>
      <label>
        Abstract
        <textarea
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          rows={6}
          style={{ width: "100%" }}
        />
      </label>
      <label>
        Publisher
        <input
          type="text"
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          style={{ width: "100%" }}
        />
      </label>
      <label>
        Conference/Journal Details
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          style={{ width: "100%" }}
        />
      </label>
      <div>
        <div>Co-authors</div>
        {coAuthors.map((ca, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              type="text"
              value={ca}
              onChange={(e) => updateCoAuthor(i, e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={() => removeCoAuthor(i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addCoAuthor} style={{ marginTop: 8 }}>
          Add co-author
        </button>
      </div>
      <div>
        <div>PDF</div>
        {initial.pdf_url && !pdfFile && (
          <div style={{ marginBottom: 8 }}>
            <a href={initial.pdf_url} target="_blank">
              Current PDF
            </a>
          </div>
        )}
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
        />
      </div>
      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
