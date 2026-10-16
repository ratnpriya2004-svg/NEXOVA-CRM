import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Projects from "./Projects";
import Employees from "./Employees";
import Tasks from "./Tasks";
import Progress from "./Progress";
import Reports from "./Reports";

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

  // Load records when a statistic card is clicked.
  async function openCard(cardKey) {
    setSelectedCard(cardKey);
    setRecords([]);
    setRecordsError("");
    setRecordsLoading(true);

    try {
      const queryFunction = cardQueries[cardKey];

      if (!queryFunction) {
        throw new Error("Unknown dashboard category.");
      }

      const { data, error } = await queryFunction();

      if (error) throw error;

      setRecords(data ?? []);
    } catch (error) {
      setRecordsError(
        error.message || "Unable to load records."
      );
    } finally {
      setRecordsLoading(false);
    }
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
    return (
      <>
        {/* Welcome Section */}
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-bold tracking-widest text-blue-600">
              ADMIN WORKSPACE
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {adminName}!
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage your projects, team and tasks from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || statsLoading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <span className={refreshing ? "animate-spin" : ""}>
              ↻
            </span>
            {refreshing ? "Refreshing..." : "Refresh Dashboard"}
          </button>
        </section>

        {/* Statistics Error */}
        {statsError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p className="font-semibold">
              Could not load dashboard statistics.
            </p>

            <p className="mt-1 break-words">{statsError}</p>

            <button
              type="button"
              onClick={loadStats}
              className="mt-3 rounded-lg bg-red-100 px-4 py-2 font-semibold hover:bg-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <section>
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">
              Workspace Overview
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Click any card to explore its records.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {statDefinitions.map((stat) => {
              const styles = colorStyles[stat.color];

              return (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => openCard(stat.key)}
                  aria-label={`View ${stat.title}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#1683FF]/50 hover:shadow-[0_18px_40px_rgba(22,131,255,0.12)] focus:outline-none focus:ring-2 focus:ring-[#1683FF] sm:p-6 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-[#1683FF] before:to-[#73b5ff] before:opacity-0 before:transition-opacity hover:before:opacity-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <h4
                        className={`mt-4 text-3xl font-bold ${
                          styles.value
                        }`}
                      >
                        {statsLoading ? "..." : stats[stat.key]}
                      </h4>
                    </div>

                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-inset ring-black/[0.03] transition duration-300 group-hover:rotate-3 group-hover:scale-105 ${styles.icon}`}
                    >
                      <Icon name={stat.icon} className="h-7 w-7" />
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {stat.description}
                  </p>

                  <p className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-[#1683FF] transition-colors group-hover:text-slate-950">
                    View details →
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected Card Details */}
        {selectedCard && (
          <section
            className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)] sm:p-6"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedDefinition?.title} Details
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {recordsLoading
                    ? "Loading..."
                    : `${records.length} record(s) loaded`}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCardDetails}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {renderRecords()}
          </section>
        )}

        {/* Workspace Modules */}
        <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)] sm:p-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Workspace Modules
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Navigate to the section you want to manage.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {navigation.slice(1).map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleNavigation(item.name)}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_4px_18px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1683FF]/50 hover:bg-blue-50/30 hover:shadow-[0_14px_30px_rgba(22,131,255,0.10)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>

                <h4 className="mt-4 font-semibold text-slate-900">
                  {item.name}
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Open {item.name.toLowerCase()} workspace.
                </p>

                <span className="mt-4 inline-block text-sm font-bold text-blue-600">
                  Open module →
                </span>
              </button>
            ))}
          </div>
        </section>
      </>
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
                ? "bg-[#1683FF] text-white shadow-lg shadow-blue-950/30"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
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
        return <Reports/>;
        
        return renderModulePlaceholder();
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
    <div className="min-h-screen bg-white text-[#111111]">
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
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm shadow-slate-200/30 backdrop-blur sm:px-8">
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

                <h2 className="mt-1 text-lg font-bold">
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
          <div className="mx-auto max-w-[1600px] p-5 sm:p-8 lg:p-10">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}