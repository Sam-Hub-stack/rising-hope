"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle, Check, ChevronDown, LoaderCircle, Pencil, Plus,
  RefreshCw, Search, Trash2, X,
} from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import type { FieldDef, ResourceConfig } from "@/lib/resources";

type Row = Record<string, unknown>;
type Option = { id: string; label: string };
type Toast = { text: string; kind: "success" | "error" };

export function ResourceManager({
  config,
  initialRows,
  options,
}: {
  config: ResourceConfig;
  initialRows: Row[];
  options: Record<string, Option[]>;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const statuses = useMemo(() => {
    const values = new Set(rows.map((row) => String(row.status ?? "")).filter(Boolean));
    return ["all", ...Array.from(values)];
  }, [rows]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "all" && String(row.status ?? "") !== status) return false;
      if (!term) return true;
      return config.searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(term));
    });
  }, [rows, query, status, config.searchKeys]);

  function notify(text: string, kind: Toast["kind"] = "success") {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 3500);
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/resources/${config.key}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Refresh failed");
      setRows(data.rows);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Refresh failed", "error");
    } finally {
      setRefreshing(false);
    }
  }

  function initialValue(field: FieldDef): string | boolean {
    if (field.type === "checkbox") return false;
    if (field.optionsKey) return options[field.optionsKey]?.[0]?.id ?? "";
    if (field.options?.length) return field.options[0].value;
    return "";
  }

  function openCreate() {
    const next: Record<string, string | boolean> = {};
    for (const field of config.fields) next[field.key] = initialValue(field);
    setForm(next);
    setEditing("new");
  }

  function openEdit(row: Row) {
    const next: Record<string, string | boolean> = {};
    for (const field of config.fields) {
      const value = row[field.key];
      if (field.type === "money") next[field.key] = String(Number(value ?? 0) / 100);
      else if (field.type === "checkbox") next[field.key] = Boolean(value);
      else if (field.type === "date") next[field.key] = String(value ?? "").slice(0, 10);
      else next[field.key] = String(value ?? "");
    }
    setForm(next);
    setEditing(row);
  }

  function setField(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      const value = form[field.key];
      if (field.type === "money") payload[field.key] = Math.round(Number(value || 0) * 100);
      else if (field.type === "number") payload[field.key] = Number(value || 0);
      else if (field.type === "checkbox") payload[field.key] = Boolean(value);
      else payload[field.key] = String(value ?? "");
    }

    const isNew = editing === "new";
    const tempId = `pending-${Date.now()}`;
    const optimistic: Row = { ...(isNew ? {} : editing as Row), ...payload, id: tempId, _pending: true };
    if (isNew) setRows((current) => [optimistic, ...current]);
    else setRows((current) => current.map((row) => (row.id === (editing as Row).id ? optimistic : row)));

    try {
      const response = await fetch(isNew ? `/api/resources/${config.key}` : `/api/resources/${config.key}/${(editing as Row).id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save this record.");
      setEditing(null);
      notify(isNew ? `${config.singular} created` : `${config.singular} updated`);
      await refresh();
    } catch (error) {
      setRows((current) => isNew ? current.filter((row) => row.id !== tempId) : current.map((row) => row.id === tempId ? editing as Row : row));
      notify(error instanceof Error ? error.message : "Could not save this record.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!confirm(`Delete this ${config.singular.toLowerCase()}? This cannot be undone.`)) return;
    setDeletingId(String(row.id));
    const before = rows;
    setRows((current) => current.filter((item) => item.id !== row.id));
    try {
      const response = await fetch(`/api/resources/${config.key}/${row.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      notify(`${config.singular} deleted`);
      await refresh();
    } catch {
      setRows(before);
      notify("Could not delete this record.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function renderCell(row: Row, key: string) {
    const value = row[key];
    if (value === undefined || value === null || value === "") return <span className="text-muted/50">—</span>;
    if (key === "rating") return <span className="flex items-center gap-0.5 text-coral">★ {String(value)}</span>;
    if (key === "createdAt" || key === "reviewedAt" || key === "endDate" || key === "startDate") return formatDate(value as string | Date);
    if (key === "status" || key === "tier") {
      const text = String(value);
      const tone = ["completed", "approved", "active"].includes(text.toLowerCase()) ? "text-mint bg-mint/10 border-mint/20" : ["pending"].includes(text.toLowerCase()) ? "text-coral bg-coral/10 border-coral/20" : "text-muted bg-white/5 border-white/10";
      return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${tone}`}>{text}</span>;
    }
    if (typeof value === "boolean") return <span className={value ? "text-mint" : "text-muted/60"}>{value ? "Active" : "Inactive"}</span>;
    if ((key.endsWith("Cents") || key === "total") && typeof value === "number") return <span className="font-mono-tech text-mint">{formatMoney(value)}</span>;
    return <span className="line-clamp-1" title={String(value)}>{String(value)}</span>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Manage · {config.key}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{config.title}</h1>
          <p className="mt-1.5 text-sm text-muted">{config.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="btn-outline px-3.5 py-2.5 text-xs" title="Refresh data"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /></button>
          <button onClick={openCreate} className="btn-primary text-xs"><Plus className="h-3.5 w-3.5" /> New {config.singular.toLowerCase()}</button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/8 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input className="input py-2 pl-9 text-xs" placeholder={`Search ${config.title.toLowerCase()}...`} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {statuses.length > 1 && (
            <div className="relative">
              <select className="input appearance-none py-2 pr-8 text-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statuses.map((item) => <option key={item} value={item} className="bg-panel">{item === "all" ? "All statuses" : item}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          )}
          <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted">{filtered.length} records</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-mint/20 bg-mint/8"><Search className="h-6 w-6 text-mint" /></span>
            <h3 className="font-display text-lg font-bold">{rows.length === 0 ? `No ${config.title.toLowerCase()} yet` : "No matching records"}</h3>
            <p className="mt-2 max-w-xs text-xs text-muted">{rows.length === 0 ? `Create your first ${config.singular.toLowerCase()} to start building your impact ledger.` : "Try a different search term or status filter."}</p>
            {rows.length === 0 && <button onClick={openCreate} className="btn-primary mt-5 text-xs"><Plus className="h-3.5 w-3.5" /> Add {config.singular.toLowerCase()}</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-white/8 bg-white/[0.02] font-mono-tech text-[10px] uppercase tracking-wider text-muted">
                <tr>{config.columns.map((column) => <th key={column.key} className="px-5 py-3.5 font-medium">{column.label}</th>)}<th className="px-5 py-3.5 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {filtered.map((row) => (
                  <tr key={String(row.id)} className={`transition hover:bg-white/[0.025] ${row._pending ? "opacity-50" : ""}`}>
                    {config.columns.map((column) => <td key={column.key} className="max-w-[240px] px-5 py-3.5 text-muted">{renderCell(row, column.key)}</td>)}
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(row)} disabled={Boolean(row._pending)} className="rounded-lg p-2 text-muted transition hover:bg-white/8 hover:text-mint disabled:opacity-30"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(row)} disabled={Boolean(row._pending) || deletingId === row.id} className="rounded-lg p-2 text-muted transition hover:bg-coral/10 hover:text-coral disabled:opacity-30">{deletingId === row.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/85 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditing(null); }}>
          <div className="panel-strong my-auto w-full max-w-2xl animate-rise shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
              <div><p className="section-kicker">{editing === "new" ? "Create record" : "Edit record"}</p><h2 className="mt-1 font-display text-xl font-bold">{editing === "new" ? `New ${config.singular.toLowerCase()}` : `Edit ${config.singular.toLowerCase()}`}</h2></div>
              <button onClick={() => !saving && setEditing(null)} className="rounded-lg p-2 text-muted hover:bg-white/8 hover:text-ice"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={save}>
              <div className="grid max-h-[62vh] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
                {config.fields.map((field) => (
                  <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className="label">{field.label}</label>
                    {field.type === "checkbox" ? (
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-muted">
                        <input type="checkbox" checked={Boolean(form[field.key])} onChange={(e) => setField(field.key, e.target.checked)} className="h-4 w-4 accent-[#6ef2c8]" /> Enabled
                      </label>
                    ) : field.type === "textarea" ? (
                      <textarea rows={3} className="input resize-none" placeholder={field.placeholder} value={String(form[field.key] ?? "")} onChange={(e) => setField(field.key, e.target.value)} />
                    ) : field.type === "select" ? (
                      <select className="input" value={String(form[field.key] ?? "")} onChange={(e) => setField(field.key, e.target.value)}>
                        {field.optionsKey ? <option value="">— None —</option> : null}
                        {field.optionsKey ? (options[field.optionsKey] ?? []).map((option) => <option key={option.id} value={option.id} className="bg-panel">{option.label}</option>) : null}
                        {field.options?.map((option) => <option key={option.value} value={option.value} className="bg-panel">{option.label}</option>)}
                      </select>
                    ) : (
                      <input
                        className="input"
                        type={field.type === "money" || field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
                        step={field.type === "money" ? "0.01" : undefined}
                        placeholder={field.placeholder}
                        value={String(form[field.key] ?? "")}
                        onChange={(e) => setField(field.key, e.target.value)}
                      />
                    )}
                    {field.help && <p className="mt-1 text-[10px] text-muted/70">{field.help}</p>}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-white/8 px-6 py-4">
                <button type="button" onClick={() => setEditing(null)} disabled={saving} className="btn-ghost text-xs">Cancel</button>
                <button className="btn-primary text-xs" disabled={saving}>{saving ? <><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Check className="h-3.5 w-3.5" /> Save changes</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[80] flex items-center gap-2 rounded-xl border px-4 py-3 text-xs shadow-2xl backdrop-blur-xl ${toast.kind === "success" ? "border-mint/30 bg-[#0b201c]/95 text-mint" : "border-coral/30 bg-[#24140f]/95 text-coral"}`}>
          {toast.kind === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{toast.text}
        </div>
      )}
    </div>
  );
}
