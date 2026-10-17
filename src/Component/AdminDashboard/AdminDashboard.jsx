import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Projects from "./Projects";
import Employees from "./Employees";
import Tasks from "./Tasks";
import Progress from "./Progress";
import Reports from "./Reports";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";

const navigation = [
  { name: "Overview", icon: "overview" },
  { name: "Projects", icon: "projects" },
  { name: "Employees", icon: "employees" },
  { name: "Tasks", icon: "tasks" },
  { name: "Progress", icon: "progress" },
  { name: "Reports", icon: "reports" },
];

const statDefinitions = [
  {
    key: "projects",
    title: "Total Projects",
    description: "All workspace projects",
    icon: "projects",
    color: "blue",
  },
  {
    key: "employees",
    title: "Total Employees",
    description: "Registered team members",
    icon: "employees",
    color: "violet",
  },
  {
    key: "tasks",
    title: "Total Tasks",
    description: "All workspace tasks",
    icon: "tasks",
    color: "amber",
  },
  {
    key: "completedTasks",
    title: "Completed Tasks",
    description: "Successfully completed",
    icon: "completed",
    color: "emerald",
  },
];


function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    projects: <><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" /><path d="M3 10h18" /></>,
    employees: <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="7.5" r="3.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8M17 15h1a3 3 0 0 1 3 3v2" /></>,
    tasks: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8 9 2 2 4-4M8 16h8" /></>,
    progress: <><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 6-7" /><path d="M15 6h5v5" /></>,
    reports: <><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 12h7M8 16h7" /></>,
    completed: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  };

  return <svg {...common}>{paths[name] || paths.overview}</svg>;
}

const initialStats = {
  projects: 0,
  employees: 0,
  tasks: 0,
  completedTasks: 0,
};

const cardQueries = {
  projects: () =>
    supabase
      .from("projects")
      .select("id, name, description, status, due_date, created_at")
      .order("created_at", { ascending: false }),

  employees: () =>
    supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .eq("role", "employee")
      .order("created_at", { ascending: false }),

  tasks: () =>
    supabase
      .from("tasks")
      .select(
        "id, title, description, status, priority, due_date, created_at"
      )
      .order("created_at", { ascending: false }),

  completedTasks: () =>
    supabase
      .from("tasks")
      .select(
        "id, title, description, status, priority, due_date, completed_at"
      )
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),
};

const colorStyles = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    value: "text-blue-600",
  },
  violet: {
    icon: "bg-slate-100 text-slate-800",
    value: "text-slate-900",
  },
  amber: {
    icon: "bg-blue-50 text-[#1683FF]",
    value: "text-[#1683FF]",
  },
  emerald: {
    icon: "bg-slate-100 text-slate-700",
    value: "text-slate-900",
  },
};

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}`.includes("T") ? value : `${value}T00:00:00`)
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
}

function formatLabel(value) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getRecordTitle(record) {
  return record.name || record.title || record.full_name || "Untitled";
}

export default function AdminDashboard({
  adminName = "Administrator",
  onLogout,
}) {
  const [activePage, setActivePage] = useState("Overview");

  const [stats, setStats] = useState(initialStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [chartTasks, setChartTasks] = useState([]);
  const [chartProjects, setChartProjects] = useState([]);

  const [selectedCard, setSelectedCard] = useState("");
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // Load live dashboard statistics from Supabase.
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError("");

    try {
      const results = await Promise.all([
        supabase
          .from("projects")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "employee"),

        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed"),
      ]);

      const failedResult = results.find((result) => result.error);

      if (failedResult) {
        throw failedResult.error;
      }

      setStats({
        projects: results[0].count ?? 0,
        employees: results[1].count ?? 0,
        tasks: results[2].count ?? 0,
        completedTasks: results[3].count ?? 0,
      });
    } catch (error) {
      setStatsError(
        error.message || "Unable to load dashboard statistics."
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    let active = true;
    async function loadChartData() {
      const [taskResult, projectResult] = await Promise.all([
        supabase.from("tasks").select("id, title, status, priority, created_at, due_date"),
        supabase.from("projects").select("id, name, status, created_at, due_date"),
      ]);
      if (!active) return;
      if (!taskResult.error) setChartTasks(taskResult.data ?? []);
      if (!projectResult.error) setChartProjects(projectResult.data ?? []);
    }
    loadChartData();
    return () => { active = false; };
  }, []);

  // Refresh dashboard data.
  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadStats();

      if (selectedCard) {
        await openCard(selectedCard);
      }
    } finally {
      setRefreshing(false);
    }
  }

  // Stat cards navigate to their actual module pages.
  function openCard(cardKey) {
    const pageByCard = {
      projects: "Projects",
      employees: "Employees",
      tasks: "Tasks",
      completedTasks: "Tasks",
    };

    const targetPage = pageByCard[cardKey];
    if (targetPage) handleNavigation(targetPage);
  }

  function closeCardDetails() {
    setSelectedCard("");
    setRecords([]);
    setRecordsError("");
  }

  // Logout through the existing App authentication handler.
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      if (onLogout) {
        await onLogout();
      } else {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;
      }
    } catch (error) {
      setLogoutError(error.message || "Unable to sign out.");
    } finally {
      setLoggingOut(false);
    }
  }

  function handleNavigation(page) {
    setActivePage(page);
    setMobileMenuOpen(false);
    closeCardDetails();
  }

  const selectedDefinition = statDefinitions.find(
    (item) => item.key === selectedCard
  );

  // Render the records associated with a statistic card.
  function renderRecords() {
    if (recordsLoading) {
      return (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Loading records...
          </p>
        </div>
      );
    }

    if (recordsError) {
      return (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Unable to load records.</p>
          <p className="mt-1 break-words">{recordsError}</p>

          <button
            type="button"
            onClick={() => openCard(selectedCard)}
            className="mt-3 rounded-lg bg-red-100 px-4 py-2 font-semibold hover:bg-red-200"
          >
            Try again
          </button>
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <div className="py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
            ▤
          </div>

          <p className="mt-4 font-semibold text-slate-700">
            No records found
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Records will appear here when they are available.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-5 space-y-3">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:border-[#1683FF]/40 hover:bg-blue-50/20 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="break-words font-semibold text-slate-900">
                  {getRecordTitle(record)}
                </h4>

                {record.description && (
                  <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                    {record.description}
                  </p>
                )}
              </div>

              {record.status && (
                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {formatLabel(record.status)}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              {record.role && (
                <span>
                  Role: {formatLabel(record.role)}
                </span>
              )}

              {record.priority && (
                <span>
                  Priority: {formatLabel(record.priority)}
                </span>
              )}

              {record.due_date && (
                <span>
                  Deadline: {formatDate(record.due_date)}
                </span>
              )}

              {record.created_at && (
                <span>
                  Created: {formatDate(record.created_at)}
                </span>
              )}

              {record.completed_at && (
                <span>
                  Completed: {formatDate(record.completed_at)}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    );
  }

  function renderOverview() {
    const statusOf = (value = "") => value.toLowerCase().replaceAll("_", " ");
    const statusCounts = [
      { name: "Completed", value: chartTasks.filter(t => statusOf(t.status) === "completed" || statusOf(t.status) === "done").length, color: "#b7ff4a" },
      { name: "In progress", value: chartTasks.filter(t => statusOf(t.status).includes("progress") || statusOf(t.status) === "in progress").length, color: "#9b7bff" },
      { name: "Pending", value: chartTasks.filter(t => ["pending", "todo", "to do", "open"].includes(statusOf(t.status))).length, color: "#35d8ef" },
    ];
    const monthlyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (6 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const tasks = chartTasks.filter(t => (t.created_at || "").slice(0, 7) === key);
      const completed = tasks.filter(t => ["completed", "done"].includes(statusOf(t.status))).length;
      return { month: label, created: tasks.length, completed };
    });
    const weeklyData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
      const now = new Date();
      const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const date = new Date(monday); date.setDate(monday.getDate() + index);
      const key = date.toDateString();
      return { day, tasks: chartTasks.filter(t => t.created_at && new Date(t.created_at).toDateString() === key).length };
    });
    const recentTasks = [...chartTasks].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
    const recentProjects = [...chartProjects].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 3);
    const cardThemes = [
      { key: "projects", title: "Total Projects", accent: "#b7ff4a", icon: "projects" },
      { key: "employees", title: "Total Employees", accent: "#9b7bff", icon: "employees" },
      { key: "tasks", title: "Total Tasks", accent: "#35d8ef", icon: "tasks" },
      { key: "completedTasks", title: "Completed Tasks", accent: "#ffcf5a", icon: "completed" },
    ];
    return (
      <div className="space-y-6 text-white">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">NEXOVA X / ANALYTICS</p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {adminName}<span className="text-cyan-300">.</span></h2>
            <p className="mt-2 text-sm text-slate-400">Here’s what’s happening across your workspace.</p>
          </div>
          <button type="button" onClick={handleRefresh} disabled={refreshing || statsLoading} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 disabled:opacity-50">{refreshing ? "Refreshing…" : "↻ Refresh dashboard"}</button>
        </section>

        {statsError && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{statsError}</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {cardThemes.map((item, index) => (
            <button key={item.key} type="button" onClick={() => openCard(item.key)} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1929] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-cyan-950/30">
              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-10 blur-2xl" style={{ background: item.accent }} />
              <div className="relative flex items-start justify-between gap-3"><div><p className="text-xs text-slate-400">{item.title}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{statsLoading ? "—" : stats[item.key]}</p><p className="mt-2 text-[11px] text-slate-500">{["Across your workspace", "Active team members", "All assigned work", "Successfully finished"][index]}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: item.accent, background: `${item.accent}18` }}><Icon name={item.icon} className="h-5 w-5" /></span></div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full transition-all duration-700 group-hover:w-full" style={{ width: `${[72,58,84,Math.min(100, stats.tasks ? stats.completedTasks / stats.tasks * 100 : 0)][index]}%`, background: item.accent }} /></div>
            </button>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.65fr_1fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#071726] p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Task analytics</h3><p className="mt-1 text-xs text-slate-500">Tasks created and completed by month</p></div><span className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-slate-400">Last 7 months</span></div>
            <div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><defs><linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#35d8ef" stopOpacity={0.3}/><stop offset="95%" stopColor="#35d8ef" stopOpacity={0}/></linearGradient><linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b7ff4a" stopOpacity={0.22}/><stop offset="95%" stopColor="#b7ff4a" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#ffffff10" vertical={false}/><XAxis dataKey="month" tick={{ fill: "#71849a", fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fill: "#71849a", fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: "#071726", border: "1px solid #ffffff20", borderRadius: 12, color: "#fff" }}/><Area type="monotone" dataKey="created" name="Created" stroke="#35d8ef" strokeWidth={2.5} fill="url(#createdFill)"/><Area type="monotone" dataKey="completed" name="Completed" stroke="#b7ff4a" strokeWidth={2.5} fill="url(#completedFill)"/><Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}/></AreaChart></ResponsiveContainer></div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#071726] p-5 sm:p-6"><div className="mb-3"><h3 className="font-semibold">Task status</h3><p className="mt-1 text-xs text-slate-500">Current distribution from your tasks</p></div><div className="h-[220px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusCounts} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={4} stroke="none">{statusCounts.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{ background: "#071726", border: "1px solid #ffffff20", borderRadius: 12, color: "#fff" }}/></PieChart></ResponsiveContainer></div><div className="space-y-3">{statusCounts.map(item => <div key={item.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-400"><span className="h-2.5 w-2.5 rounded-full" style={{background:item.color}}/>{item.name}</span><span className="font-semibold text-white">{item.value}</span></div>)}</div></div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.3fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#071726] p-5 sm:p-6"><div className="mb-5"><h3 className="font-semibold">Weekly activity</h3><p className="mt-1 text-xs text-slate-500">Tasks created this week</p></div><div className="h-[220px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData} margin={{top:10,right:4,left:-22,bottom:0}}><CartesianGrid stroke="#ffffff10" vertical={false}/><XAxis dataKey="day" tick={{fill:"#71849a",fontSize:11}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fill:"#71849a",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#071726",border:"1px solid #ffffff20",borderRadius:12,color:"#fff"}}/><Bar dataKey="tasks" name="Tasks" fill="#9b7bff" radius={[6,6,0,0]} maxBarSize={32}/></BarChart></ResponsiveContainer></div></div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#071726] p-5 sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-semibold">Recent tasks</h3><p className="mt-1 text-xs text-slate-500">Latest work added to the workspace</p></div><button type="button" onClick={() => handleNavigation("Tasks")} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">View all →</button></div>{recentTasks.length ? <div className="divide-y divide-white/[0.07]">{recentTasks.map(task => <div key={task.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{task.title || "Untitled task"}</p><p className="mt-1 text-[11px] text-slate-500">{task.created_at ? formatDate(task.created_at) : "No date"}{task.priority ? ` · ${formatLabel(task.priority)} priority` : ""}</p></div><span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-300">{formatLabel(task.status)}</span></div>)}</div> : <div className="py-8 text-center text-sm text-slate-500">No tasks yet. Tasks will appear here when added.</div>}</div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-[#071726] p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold">Recent projects</h3><p className="mt-1 text-xs text-slate-500">Latest projects in your workspace</p></div><button type="button" onClick={() => handleNavigation("Projects")} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">Manage projects →</button></div>{recentProjects.length ? <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{recentProjects.map(project => <div key={project.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-medium">{project.name || "Untitled project"}</p><span className="h-2 w-2 shrink-0 rounded-full bg-lime-300"/></div><p className="mt-2 text-xs text-slate-500">{project.status ? formatLabel(project.status) : "No status set"}</p><div className="mt-4 h-1 rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"/></div></div>)}</div> : <p className="py-6 text-center text-sm text-slate-500">No projects found yet.</p>}</section>

        {selectedCard && <section className="rounded-2xl border border-white/[0.08] bg-[#071726] p-5 sm:p-6" aria-live="polite"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">{selectedDefinition?.title} details</h3><p className="mt-1 text-xs text-slate-500">{recordsLoading ? "Loading records…" : `${records.length} record(s)`}</p></div><button type="button" onClick={closeCardDetails} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Close</button></div>{renderRecords()}</section>}
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1683FF] font-bold text-white">
          {adminName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {adminName}
          </p>

          <p className="mt-1 text-xs text-[#1683FF]">
            Administrator
          </p>
        </div>
      </div>
    );
  }

  function renderSidebarNavigation() {
    return (
      <nav className="space-y-1">
        {navigation.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => handleNavigation(item.name)}
            aria-current={activePage === item.name ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
              activePage === item.name
                ? "bg-cyan-300/10 text-cyan-200 ring-1 ring-inset ring-cyan-300/15"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <span className="flex w-6 shrink-0 justify-center">
              <Icon name={item.icon} className="h-5 w-5" />
            </span>

            {item.name}
          </button>
        ))}
      </nav>
    );
  }

  function renderPage() {
    switch (activePage) {
      case "Overview":
        return renderOverview();
      case "Projects":
        return <Projects />;

      case "Employees":
        return <Employees />;

      case "Tasks":
        return <Tasks />;

      case "Progress":
        return <Progress/>;

      case "Reports":
        return <Reports />;
      default:
        return renderOverview();
    }
  }

  function renderModulePlaceholder() {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <button
          type="button"
          onClick={() => handleNavigation("Overview")}
          className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          ← Back to Overview
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
          <Icon name={navigation.find((item) => item.name === activePage)?.icon} className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-900">
          {activePage}
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          The {activePage.toLowerCase()} module will be implemented in
          its own JSX file. Its database operations will be connected
          when we build that module.
        </p>

        <span className="mt-5 inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          Module setup pending
        </span>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#04111e] text-white">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#050505] text-white md:flex">
          <div className="border-b border-white/10 px-6 py-7">
            <h1 className="text-2xl font-extrabold tracking-tight">
              NEXOVA<span className="text-blue-600">X</span>
            </h1>

            <p className="mt-1 text-xs tracking-wide text-slate-400">
              Project & Task Tracker
            </p>
          </div>

          <div className="px-4 py-6">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Workspace
            </p>

            {renderSidebarNavigation()}
          </div>

          <div className="mt-auto space-y-4 border-t border-white/10 p-4">
            {renderProfile()}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 md:ml-64">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.08] bg-[#061522]/95 px-4 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                className="rounded-lg border border-slate-200 px-3 py-2 text-lg md:hidden"
              >
                ☰
              </button>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  NEXOVA X / Workspace
                </p>

                <h2 className="mt-1 text-lg font-bold text-white">
                  {activePage}
                </h2>
              </div>
            </div>

            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAdminMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={adminMenuOpen}
                aria-label="Open administrator menu"
                className="flex items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1683FF]"
              >
                <span className="text-right">
                  <span className="block text-sm font-semibold text-slate-900">
                    {adminName}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Administrator
                  </span>
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1683FF] font-bold text-white ring-4 ring-blue-50">
                  {adminName.charAt(0).toUpperCase()}
                </span>
                <span aria-hidden="true" className="text-xs text-slate-500">
                  {adminMenuOpen ? "▲" : "▼"}
                </span>
              </button>

              {adminMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close administrator menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setAdminMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                  >
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {adminName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Administrator account
                      </p>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        setAdminMenuOpen(false);
                        await handleLogout();
                      }}
                      disabled={loggingOut}
                      className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span aria-hidden="true">↪</span>
                      {loggingOut ? "Signing out..." : "Logout"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-30 md:hidden">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute inset-0 h-full w-full bg-slate-900/40"
              />

              <aside className="absolute bottom-0 left-0 top-0 flex w-72 max-w-[85vw] flex-col bg-[#050505] text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-6">
                  <h2 className="text-xl font-extrabold">
                    NEXOVA<span className="text-blue-600">X</span>
                  </h2>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4">
                  {renderSidebarNavigation()}
                </div>

                <div className="mt-auto space-y-4 border-t border-white/10 p-4">
                  {renderProfile()}

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
                  >
                    {loggingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* Logout Error */}
          {logoutError && (
            <div
              role="alert"
              className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:mx-8"
            >
              {logoutError}
            </div>
          )}

          {/* Page Content */}
          <div className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}