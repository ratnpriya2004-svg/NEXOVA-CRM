import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const EMPTY_FORM = { full_name: "", email: "", password: "" };

function Icon({ name, className = "h-5 w-5" }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const icons = {
    people: <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="10" cy="7.5" r="3.5"/><path d="M17 11a3.5 3.5 0 0 0 0-7M17 15h1a3 3 0 0 1 3 3v2"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.2 4.2"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4.8 9A7.5 7.5 0 0 1 18 6.5L20 12M4 17v-5h5"/><path d="M19.2 15A7.5 7.5 0 0 1 6 17.5L4 12"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    edit: <><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/></>,
    trash: <><path d="M3.5 6.5h17M9 6.5V4h6v2.5M6 6.5l1 14h10l1-14M10 10v7M14 10v7"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  };
  return <svg {...common}>{icons[name]}</svg>;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const inputClass = "w-full rounded-xl border border-slate-700 bg-[#071b2e] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setEmployees((data ?? []).filter((profile) => profile.role?.trim().toLowerCase() === "employee"));
    } catch (err) {
      console.error("Employee loading failed:", err);
      setError(err.message || "Unable to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((employee) =>
      (employee.full_name ?? "").toLowerCase().includes(q) || employee.id.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const visibleEmployees = useMemo(() => {
    if (activeFilter === "matching") return filteredEmployees;
    return employees;
  }, [activeFilter, employees, filteredEmployees]);

  function scrollToDirectory() {
    // Let React apply the selected filter before moving the user to the results.
    window.setTimeout(() => {
      document.getElementById("employee-directory")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function showAllEmployees() {
    setSearch("");
    setActiveFilter("all");
    scrollToDirectory();
  }

  function showMatchingEmployees() {
    // Keep the current search and bring the search box into view.
    setActiveFilter("matching");
    window.setTimeout(() => {
      const searchInput = document.getElementById("employee-search");
      searchInput?.scrollIntoView({ behavior: "smooth", block: "center" });
      searchInput?.focus({ preventScroll: true });
    }, 0);
  }

  function openCreate() {
    setEditingEmployee(null); setForm(EMPTY_FORM); setError(""); setNotice(""); setModalOpen(true);
  }
  function openEdit(employee) {
    setEditingEmployee(employee);
    setForm({ full_name: employee.full_name ?? "", email: "", password: "" });
    setError(""); setNotice(""); setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault(); setError(""); setNotice("");
    const fullName = form.full_name.trim();
    if (!fullName) { setError("Employee name is required."); return; }
    setBusy(true);
    try {
      if (editingEmployee) {
        const { data, error: functionError } = await supabase.functions.invoke("admin-manage-employee", {
          body: { action: "update", employee_id: editingEmployee.id, full_name: fullName },
        });
        if (functionError) throw functionError;
        if (data?.error) throw new Error(data.error);
        setNotice("Employee profile updated successfully.");
      } else {
        if (!form.email.trim() || !form.password) throw new Error("Email and password are required.");
        if (form.password.length < 8) throw new Error("Password must contain at least 8 characters.");
        const { data, error: functionError } = await supabase.functions.invoke("admin-manage-employee", {
          body: { action: "create", full_name: fullName, email: form.email.trim(), password: form.password },
        });
        if (functionError) throw functionError;
        if (data?.error) throw new Error(data.error);
        setNotice("Employee account created successfully.");
      }
      setModalOpen(false); setForm(EMPTY_FORM); await loadEmployees();
    } catch (err) {
      console.error("Employee save failed:", err);
      setError(err.message || "Something went wrong.");
    } finally { setBusy(false); }
  }

  async function handleDelete(employee) {
    const confirmed = window.confirm(`Delete employee "${employee.full_name || "Unnamed Employee"}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;
    setError(""); setNotice(""); setBusy(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke("admin-manage-employee", {
        body: { action: "delete", employee_id: employee.id },
      });
      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);
      setNotice("Employee deleted successfully."); await loadEmployees();
    } catch (err) {
      console.error("Employee deletion failed:", err);
      setError(err.message || "Unable to delete employee.");
    } finally { setBusy(false); }
  }

  async function copyUID(id) {
    try {
      await navigator.clipboard.writeText(id);
      setNotice("Employee UID copied to clipboard.");
    } catch {
      setError("Could not copy UID. Please copy it manually.");
    }
  }

  return (
    <section className="min-h-full space-y-6 pb-8 text-slate-100">
      {/* Page heading */}
      <header className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#09253b] via-[#071b2e] to-[#101b3b] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-70px] right-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" /> NEXOVA X / TEAM
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Employee Management</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Manage your people, maintain team records and keep your workspace organized.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={loadEmployees} disabled={loading || busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600/80 bg-[#0a2237]/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50">
              <Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button type="button" onClick={openCreate} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-bold text-[#041524] shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:shadow-cyan-400/25 disabled:opacity-50">
              <Icon name="plus" className="h-4 w-4" /> Add Employee
            </button>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-200"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-400/15 font-bold">!</span><div className="min-w-0 flex-1"><p className="font-semibold">Something needs your attention</p><p className="mt-1 break-words text-rose-200/80">{error}</p></div><button type="button" onClick={() => setError("")} className="text-rose-200/70 hover:text-white" aria-label="Dismiss error">✕</button></div>}
      {notice && <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15">✓</span><div className="min-w-0 flex-1"><p className="font-semibold">Success</p><p className="mt-1 text-emerald-100/75">{notice}</p></div><button type="button" onClick={() => setNotice("")} className="text-emerald-100/70 hover:text-white" aria-label="Dismiss message">✕</button></div>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button type="button" onClick={showAllEmployees} aria-pressed={activeFilter === "all"} className={`group relative overflow-hidden rounded-2xl border bg-[#071b2e] p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/30 ${activeFilter === "all" ? "border-cyan-300/50 ring-1 ring-cyan-300/20" : "border-cyan-300/15 hover:border-cyan-300/40"}`}>
          <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/20" />
          <div className="relative flex items-start justify-between"><div><p className="text-sm font-medium text-slate-400">Total Employees</p><p className="mt-3 text-4xl font-bold tracking-tight text-white">{loading ? "—" : employees.length}</p><p className="mt-2 text-xs text-cyan-300">Registered team members <span className="ml-1">↗</span></p></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300"><Icon name="people" className="h-6 w-6" /></span></div>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" /></div>
        </button>
        <button type="button" onClick={showMatchingEmployees} aria-pressed={activeFilter === "matching"} className={`group relative overflow-hidden rounded-2xl border bg-[#071b2e] p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-950/30 ${activeFilter === "matching" ? "border-violet-300/50 ring-1 ring-violet-300/20" : "border-violet-300/15 hover:border-violet-300/40"}`}>
          <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-violet-400/10 blur-2xl transition group-hover:bg-violet-400/20" />
          <div className="relative flex items-start justify-between"><div><p className="text-sm font-medium text-slate-400">Matching Results</p><p className="mt-3 text-4xl font-bold tracking-tight text-white">{loading ? "—" : filteredEmployees.length}</p><p className="mt-2 text-xs text-violet-300">Based on your search <span className="ml-1">↗</span></p></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-300"><Icon name="search" className="h-6 w-6" /></span></div>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 transition-all" style={{ width: `${employees.length ? Math.max(5, (filteredEmployees.length / employees.length) * 100) : 0}%` }} /></div>
        </button>

      </div>

      {/* Directory */}
      <section id="employee-directory" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-700/70 bg-[#071b2e] shadow-xl shadow-black/10">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-700/70 p-5 sm:flex-row sm:items-center sm:px-6">
          <div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" /><h2 className="text-lg font-bold text-white">Team Directory</h2></div><p className="mt-1 text-sm text-slate-400">{activeFilter === "matching" ? "Showing employees matching your current search" : "Employee profiles and account management"}</p></div>
          <label className="relative block w-full sm:max-w-sm"><span className="sr-only">Search employees</span><Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="employee-search" type="search" value={search} onChange={(event) => { const value = event.target.value; setSearch(value); setActiveFilter(value.trim() ? "matching" : "all"); }} placeholder="Search name or employee UID..." className="w-full rounded-xl border border-slate-700 bg-[#041524] py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10" /></label>
        </div>

        {loading ? <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-slate-400"><span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-300"/><p className="text-sm">Loading team directory...</p></div> : visibleEmployees.length === 0 ? <div className="flex flex-col items-center px-6 py-16 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 text-slate-400"><Icon name="people" className="h-8 w-8" /></span><h3 className="mt-4 text-lg font-semibold text-white">{search ? "No matching employees" : "No employees yet"}</h3><p className="mt-2 max-w-sm text-sm text-slate-400">{search ? "Try another name or UID, or clear your search." : "Add your first team member to start building your employee directory."}</p>{search ? <button type="button" onClick={() => setSearch("")} className="mt-4 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Clear search</button> : <button type="button" onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#041524] hover:bg-cyan-300"><Icon name="plus" className="h-4 w-4"/> Add Employee</button>}</div> : <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-[#0a2740] text-[11px] uppercase tracking-[0.15em] text-slate-400"><tr><th className="px-6 py-4 font-semibold">Employee</th><th className="px-6 py-4 font-semibold">Role</th><th className="px-6 py-4 font-semibold">Date Joined</th><th className="px-6 py-4 text-right font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-800/90">
              {visibleEmployees.map((employee) => <tr key={employee.id} className="group transition hover:bg-[#0a2740]/60">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/20 to-blue-500/20 text-sm font-bold text-cyan-200">{(employee.full_name || "E").trim().charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate font-semibold text-white">{employee.full_name || "Unnamed Employee"}</p><div className="mt-1 flex items-center gap-2"><span className="text-xs text-slate-500">UID {employee.id.slice(0, 8)}…</span><button type="button" onClick={() => copyUID(employee.id)} title="Copy full UID" aria-label={`Copy UID for ${employee.full_name || "employee"}`} className="rounded-md p-1 text-slate-500 transition hover:bg-cyan-300/10 hover:text-cyan-300"><Icon name="copy" className="h-3.5 w-3.5" /></button></div></div></div></td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold capitalize text-blue-200"><span className="h-1.5 w-1.5 rounded-full bg-blue-300"/>{employee.role || "employee"}</span></td>
                <td className="px-6 py-4 text-sm text-slate-400">{formatDate(employee.created_at)}</td>
                <td className="px-6 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openEdit(employee)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200 disabled:opacity-50"><Icon name="edit" className="h-3.5 w-3.5"/> Edit</button><button type="button" onClick={() => handleDelete(employee)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10 disabled:opacity-50"><Icon name="trash" className="h-3.5 w-3.5"/> Delete</button></div></td>
              </tr>)}
            </tbody>
          </table>
          <div className="flex flex-col justify-between gap-2 border-t border-slate-700/70 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center"><span>Showing <span className="font-semibold text-slate-300">{visibleEmployees.length}</span> of <span className="font-semibold text-slate-300">{employees.length}</span> employees</span><span>Updated from Supabase</span></div>
        </div>}
      </section>

      {/* Create / edit modal */}
      {modalOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#020b14]/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setModalOpen(false); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="employee-modal-title" className="my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-[#071b2e] shadow-2xl shadow-black/50">
          <div className="relative overflow-hidden border-b border-slate-700/80 bg-gradient-to-r from-[#0b2a43] to-[#111d3b] p-6"><div className="absolute -right-4 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl"/><div className="relative flex items-start justify-between gap-4"><div><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300"><Icon name="people" className="h-5 w-5"/></span><h3 id="employee-modal-title" className="mt-3 text-xl font-bold text-white">{editingEmployee ? "Edit Employee" : "Add New Employee"}</h3><p className="mt-1 text-sm text-slate-400">{editingEmployee ? "Update this employee's profile details." : "Create an employee account for your workspace."}</p></div><button type="button" onClick={() => !busy && setModalOpen(false)} disabled={busy} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50" aria-label="Close dialog"><Icon name="close"/></button></div></div>
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div><label htmlFor="employee-name" className="mb-2 block text-sm font-semibold text-slate-200">Full name <span className="text-cyan-300">*</span></label><input id="employee-name" type="text" required autoFocus value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="e.g. Aditi Sharma" className={inputClass}/></div>
            {!editingEmployee && <>
              <div><label htmlFor="employee-email" className="mb-2 block text-sm font-semibold text-slate-200">Email address <span className="text-cyan-300">*</span></label><input id="employee-email" type="email" required autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="employee@company.com" className={inputClass}/></div>
              <div><label htmlFor="employee-password" className="mb-2 block text-sm font-semibold text-slate-200">Temporary password <span className="text-cyan-300">*</span></label><input id="employee-password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" className={inputClass}/><p className="mt-2 text-xs leading-5 text-slate-500">Share the temporary password securely with the employee.</p></div>
            </>}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-700/70 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModalOpen(false)} disabled={busy} className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50">Cancel</button><button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-bold text-[#041524] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#041524]/30 border-t-[#041524]"/> Please wait...</> : <><Icon name={editingEmployee ? "edit" : "plus"} className="h-4 w-4"/>{editingEmployee ? "Save Changes" : "Create Employee"}</>}</button></div>
          </form>
        </div>
      </div>}
    </section>
  );
}
