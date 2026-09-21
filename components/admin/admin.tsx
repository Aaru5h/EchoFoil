"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import a from "@/messages/admin.json";
import { StructuredFields } from "./fields";
const RevenueChart = dynamic(() => import("./chart"), {
  ssr: false,
  loading: () => <div className="skeleton" />,
});
export function Chart({ data }: { data: { date: string; revenue: number }[] }) {
  return <RevenueChart data={data} />;
}
export function RecordEditor({
  resource,
  initial,
  id,
  onSaved,
}: {
  resource: string;
  initial: unknown;
  id?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  async function submit(operation = "save") {
    setBusy(true);
    setMessage("");
    try {
      const data = JSON.parse(text);
      const response = await fetch(`/api/admin/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, id, data }),
      });
      if (!response.ok) throw new Error();
      setMessage(a.saved);
      router.refresh();
      if (onSaved) onSaved();
    } catch {
      setMessage(a.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-editor stack">
      <p className="small muted">{a.editorHelp}</p>
      <StructuredFields
        value={JSON.parse(text)}
        onChange={(v) => setText(JSON.stringify(v, null, 2))}
      />
      <details>
        <summary>{a.advanced}</summary>
        <label>
          {a.jsonLabel}
          <textarea
            defaultValue={text}
            onBlur={(e) => {
              try {
                setText(JSON.stringify(JSON.parse(e.target.value), null, 2));
              } catch {
                setMessage(a.error);
              }
            }}
            spellCheck={false}
          />
        </label>
      </details>
      <div className="row wrap">
        <button className="btn" disabled={busy} onClick={() => submit()}>
          {busy ? a.saving : a.save}
        </button>
        {resource === "orders" && (
          <button className="btn secondary" disabled={busy} onClick={() => submit("email")}>
            {a.email}
          </button>
        )}
        {id && ["products", "categories", "posts"].includes(resource) && (
          <button className="btn secondary" disabled={busy} onClick={() => setConfirm(true)}>
            {a.delete}
          </button>
        )}
        {confirm && (
          <>
            <button className="btn danger" onClick={() => submit("delete")}>
              {a.confirmDelete}
            </button>
            <button className="btn secondary" onClick={() => setConfirm(false)}>
              {a.cancel}
            </button>
          </>
        )}
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
export function DataTable({
  rows,
  resource,
}: {
  rows: {
    id: string;
    name: string;
    status?: string;
    total?: string;
    created?: string;
    href?: string;
  }[];
  resource: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [asc, setAsc] = useState(true);
  const filtered = rows
    .filter(
      (r) =>
        `${r.name} ${r.id}`.toLowerCase().includes(query.toLowerCase()) &&
        (!status || r.status === status),
    )
    .sort((x, y) => (asc ? x.name.localeCompare(y.name) : y.name.localeCompare(x.name)));
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const actual = Math.min(page, pages);
  return (
    <>
      <div className="row wrap">
        <input
          aria-label={a.search}
          placeholder={a.search}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 400 }}
        />
        <select
          aria-label={a.filter}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 220 }}
        >
          <option value="">{a.all}</option>
          {[...new Set(rows.map((r) => r.status).filter(Boolean))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>
                <button className="btn ghost" onClick={() => setAsc(!asc)}>
                  {a.name} {asc ? "↑" : "↓"}
                </button>
              </th>
              <th>{a.status}</th>
              <th>{a.total}</th>
              <th>{a.created}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice((actual - 1) * 20, actual * 20).map((r) => (
              <tr key={r.id}>
                <td>
                  <Link className="link" href={r.href ?? `/admin/${resource}/${r.id}`}>
                    {r.name}
                  </Link>
                </td>
                <td>{r.status && <span className="badge">{r.status}</span>}</td>
                <td>{r.total}</td>
                <td>{r.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && <p>{a.empty}</p>}
      <div className="row" style={{ marginTop: 24 }}>
        <button
          className="btn secondary"
          disabled={actual === 1}
          onClick={() => setPage(actual - 1)}
        >
          {a.previous}
        </button>
        <span>
          {actual} / {pages}
        </span>
        <button
          className="btn secondary"
          disabled={actual === pages}
          onClick={() => setPage(actual + 1)}
        >
          {a.next}
        </button>
      </div>
    </>
  );
}
export function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return;
        setBusy(true);
        try {
          const body = new FormData();
          body.append("file", file);
          const r = await fetch("/api/admin-upload", { method: "POST", body });
          const data = await r.json();
          setMessage(r.ok ? data.url : a.error);
        } catch {
          setMessage(a.error);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>{a.uploadHelp}</p>
      <input
        type="file"
        aria-label={a.upload}
        accept="image/jpeg,image/png,image/webp"
        required
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button className="btn" disabled={busy || !file}>
        {busy ? a.saving : a.upload}
      </button>
      <p role="status" style={{ overflowWrap: "anywhere" }}>
        {message}
      </p>
    </form>
  );
}
export function PackingPrint() {
  return (
    <button className="btn secondary no-print" onClick={() => window.print()}>
      {a.print}
    </button>
  );
}
