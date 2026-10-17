import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const STATUS_LABELS = {
  pending: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function escapeCSV(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(filename, rows) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [taskResult, employeeResult, projectResult] =
        await Promise.all([
          supabase
            .from("tasks")
            .select(
              "id, title, description, project_id, assigned_to, status, priority, due_date, created_at, completed_at"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("profiles")
            .select("id, full_name, role")
            .eq("role", "employee")
            .order("full_name"),

          supabase.from("projects").select("id, name").order("name"),
        ]);

      if (taskResult.error) throw taskResult.error;
      if (employeeResult.error) throw employeeResult.error;
      if (projectResult.error) throw projectResult.error;

      setTasks(taskResult.data ?? []);
      setEmployees(employeeResult.data ?? []);
      setProjects(projectResult.data ?? []);
    } catch (err) {
      console.error("Reports loading error:", err);
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const today = [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, "0"), String(new Date().getDate()).padStart(2, "0")].join("-");

  const counts = useMemo(() => {
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    const pending = tasks.filter(
      (task) => task.status === "pending"
    ).length;

    const inProgress = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;

    const blocked = tasks.filter(
      (task) => task.status === "blocked"
    ).length;

    const overdue = tasks.filter(
      (task) =>
        task.due_date &&
        task.due_date < today &&
        task.status !== "completed"
    ).length;

    return {
      total: tasks.length,
      completed,
      pending,
      inProgress,
      blocked,
      overdue,
    };
  }, [tasks, today]);

  const employeeReports = useMemo(
    () =>
      employees.map((employee) => {
        const assignedTasks = tasks.filter(
          (task) => task.assigned_to === employee.id
        );

        const total = assignedTasks.length;
        const completed = assignedTasks.filter(
          (task) => task.status === "completed"
        ).length;

        return {
          employee,
          total,
          completed,
          pending: assignedTasks.filter(
            (task) => task.status === "pending"
          ).length,
          inProgress: assignedTasks.filter(
            (task) => task.status === "in_progress"
          ).length,
          blocked: assignedTasks.filter(
            (task) => task.status === "blocked"
          ).length,
          percentage:
            total === 0 ? 0 : Math.round((completed / total) * 100),
        };
      }),
    [employees, tasks]
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const employee = employees.find(
        (item) => item.id === task.assigned_to
      );

      const project = projects.find(
        (item) => item.id === task.project_id
      );

      const matchesSearch =
        (task.title ?? "").toLowerCase().includes(query) ||
        (employee?.full_name ?? "").toLowerCase().includes(query) ||
        (project?.name ?? "").toLowerCase().includes(query);

      const isOverdue = Boolean(
        task.due_date &&
        task.due_date < today &&
        task.status !== "completed"
      );

      const matchesStatus =
        statusFilter === "all" ||
        task.status === statusFilter ||
        (statusFilter === "overdue" && isOverdue);

      const matchesEmployee =
        employeeFilter === "all" ||
        task.assigned_to === employeeFilter;

      const taskDate = task.created_at?.slice(0, 10);

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" && taskDate === today) ||
        (dateFilter === "week" &&
          taskDate >=
            [new Date(Date.now() - 7 * 86400000).getFullYear(), String(new Date(Date.now() - 7 * 86400000).getMonth() + 1).padStart(2, "0"), String(new Date(Date.now() - 7 * 86400000).getDate()).padStart(2, "0")].join("-"));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesEmployee &&
        matchesDate
      );
    });
  }, [
    tasks,
    employees,
    projects,
    search,
    statusFilter,
    employeeFilter,
    dateFilter,
    today,
  ]);

  function exportTaskReport() {
    const rows = filteredTasks.map((task) => ({
      "Task Title": task.title,
      Employee:
        employees.find((item) => item.id === task.assigned_to)
          ?.full_name ?? "Unassigned",
      Project:
        projects.find((item) => item.id === task.project_id)?.name ??
        "Unknown",
      Status: STATUS_LABELS[task.status] ?? task.status,
      Priority: task.priority ?? "",
      "Created Date": task.created_at?.slice(0, 10) ?? "",
      Deadline: task.due_date ?? "",
      "Completed At": task.completed_at ?? "",
      Overdue:
        task.due_date &&
        task.due_date < today &&
        task.status !== "completed"
          ? "Yes"
          : "No",
    }));

    if (!rows.length) {
      setError("No tasks available to export with the current filters.");
      return;
    }

    downloadCSV("nexovax-task-report.csv", rows);
  }

  function exportEmployeeReport() {
    const rows = employeeReports.map((item) => ({
      Employee: item.employee.full_name ?? "Unnamed Employee",
      "Total Tasks": item.total,
      Completed: item.completed,
      Pending: item.pending,
      "In Progress": item.inProgress,
      Blocked: item.blocked,
      "Completion Percentage": `${item.percentage}%`,
    }));

    if (!rows.length) {
      setError("No employee data available to export.");
      return;
    }

    downloadCSV("nexovax-employee-report.csv", rows);
  }

  const summaryCards = [
    { title: "Total Tasks", value: counts.total, color: "text-cyan-300" },
    {
      title: "Completed",
      value: counts.completed,
      color: "text-emerald-300",
    },
    { title: "To Do", value: counts.pending, color: "text-slate-200" },
    {
      title: "In Progress",
      value: counts.inProgress,
      color: "text-amber-200",
    },
    { title: "Blocked", value: counts.blocked, color: "text-rose-300" },
    { title: "Overdue", value: counts.overdue, color: "text-rose-300" },
  ];

  return (
    <div className="space-y-6 pb-8 font-[Inter,ui-sans-serif,system-ui] text-slate-100">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
            NEXOVA X / ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Reports
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Task summaries, employee performance and deadlines.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-[#041524] px-4 py-3 text-sm text-slate-100 font-semibold text-slate-200 hover:bg-[#0b2033] disabled:opacity-50"
        >
          ↻ {loading ? "Refreshing..." : "Refresh Reports"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SUMMARY */}
<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
  {[
    {
      title: "Total Tasks",
      value: counts.total,
      filter: "all",
      color: "text-cyan-300",
    },
    {
      title: "Completed",
      value: counts.completed,
      filter: "completed",
      color: "text-emerald-300",
    },
    {
      title: "To Do",
      value: counts.pending,
      filter: "pending",
      color: "text-slate-200",
    },
    {
      title: "In Progress",
      value: counts.inProgress,
      filter: "in_progress",
      color: "text-amber-200",
    },
    {
      title: "Blocked",
      value: counts.blocked,
      filter: "blocked",
      color: "text-rose-300",
    },
    {
      title: "Overdue",
      value: counts.overdue,
      filter: "overdue",
      color: "text-rose-300",
    },
  ].map((item) => (
    <button
      key={item.title}
      type="button"
      onClick={() => {
        setSelectedReport(item.filter);
        setStatusFilter(item.filter);
        setEmployeeFilter("all");
        setDateFilter("all");
        setSearch("");

        setTimeout(() => {
            document
            .getElementById("report-details")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 100);
        }}

      className={`rounded-2xl border bg-[#071726] p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        statusFilter === item.filter
          ? "border-cyan-300/50 ring-2 ring-cyan-300/10"
          : "border-white/10 hover:border-cyan-300/40"
      }`}
    >
      <p className="text-sm font-medium text-slate-400">
        {item.title}
      </p>

      <p className={`mt-3 text-3xl font-bold ${item.color}`}>
        {loading ? "..." : item.value}
      </p>

      <p className="mt-2 text-xs font-semibold text-cyan-300">
        {statusFilter === item.filter
          ? "Currently selected ✓"
          : "View report →"}
      </p>
    </button>
  ))}
</section>

      {/* EMPLOYEE REPORT */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071726] p-5 shadow-xl sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-white">
              Employee-wise Performance
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Task completion summary for every employee.
            </p>
          </div>

          <button
            type="button"
            onClick={exportEmployeeReport}
            disabled={loading || employeeReports.length === 0}
            className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400 px-4 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            ↓ Export Employee CSV
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Loading employee reports...
          </p>
        ) : employeeReports.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No employees found.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-[#0b2033] text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">In Progress</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Progress</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.08]">
                {employeeReports.map((item) => (
                  <tr key={item.employee.id}>
                    <td className="px-4 py-4 font-semibold text-white">
                      {item.employee.full_name || "Unnamed Employee"}
                    </td>
                    <td className="px-4 py-4">{item.total}</td>
                    <td className="px-4 py-4 text-emerald-300">
                      {item.completed}
                    </td>
                    <td className="px-4 py-4 text-amber-200">
                      {item.inProgress}
                    </td>
                    <td className="px-4 py-4">{item.pending}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-[#122b40]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-400"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">
                          {item.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* TASK REPORT */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#071726] shadow-xl">
        <div className="border-b border-white/[0.08] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-white">
                Task Report
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Filter tasks and export the report to CSV.
              </p>
            </div>

            <button
              type="button"
              onClick={exportTaskReport}
              disabled={loading || filteredTasks.length === 0}
              className="rounded-xl bg-emerald-400/100/90 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              ↓ Export Task CSV
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task, employee, project..."
              className="w-full rounded-xl border border-white/10 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#041524] px-4 py-3 text-sm text-slate-100"
            >
              <option value="all">All Statuses</option>
              <option value="pending">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#041524] px-4 py-3 text-sm text-slate-100"
            >
              <option value="all">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name || "Unnamed Employee"}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#041524] px-4 py-3 text-sm text-slate-100"
            >
              <option value="all">All Dates</option>
              <option value="today">Created Today</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-400">
              Showing{" "}
              <span className="font-semibold text-white">
                {loading ? "..." : filteredTasks.length}
              </span>{" "}
              tasks
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setEmployeeFilter("all");
                setDateFilter("all");
                setSelectedReport("all");
              }}
              className="text-sm font-semibold text-cyan-300 hover:text-cyan-100"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <p className="p-10 text-center text-sm text-slate-400">
            Loading task report...
          </p>
        ) : filteredTasks.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">
            No tasks match the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#0b2033] text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-4">Task</th>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Project</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Deadline</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.08]">
                {filteredTasks.map((task) => {
                  const employee = employees.find(
                    (item) => item.id === task.assigned_to
                  );

                  const project = projects.find(
                    (item) => item.id === task.project_id
                  );

                  const isOverdue =
                    task.due_date &&
                    task.due_date < today &&
                    task.status !== "completed";

                  return (
                    <tr key={task.id} className="hover:bg-[#0b2033]">
                      <td className="px-5 py-4 font-semibold text-white">
                        {task.title}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {employee?.full_name || "Unassigned"}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {project?.name || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            task.status === "completed"
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                              : task.status === "in_progress"
                                ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
                                : task.status === "blocked"
                                  ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
                                  : "border-slate-500/30 bg-slate-500/10 text-slate-300"
                          }`}
                        >
                          {STATUS_LABELS[task.status] ?? task.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 capitalize text-slate-300">
                        {task.priority || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            isOverdue
                              ? "font-semibold text-rose-300"
                              : "text-slate-300"
                          }
                        >
                          {formatDate(task.due_date)}
                          {isOverdue ? " · Overdue" : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* SELECTED REPORT DETAILS */}
{selectedReport !== null && (
  <section
    id="report-details"
    className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10/50 p-5 sm:p-6"
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
          Selected Report
        </p>

        <h2 className="mt-1 text-xl font-bold text-white">
          {selectedReport === "all"
            ? "All Tasks"
            : selectedReport === "overdue"
              ? "Overdue Tasks"
              : selectedReport === "pending"
                ? "To Do Tasks"
                : selectedReport === "in_progress"
                  ? "In Progress Tasks"
                  : selectedReport === "completed"
                    ? "Completed Tasks"
                    : "Blocked Tasks"}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {loading
            ? "Loading..."
            : `${filteredTasks.length} matching task(s) found`}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setSelectedReport(null);
          setStatusFilter("all");
        }}
        className="rounded-lg border border-white/10 bg-[#071726] px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-[#0b2033]"
      >
        Close Details
      </button>
    </div>

    {!loading && filteredTasks.length === 0 ? (
      <p className="mt-5 rounded-xl bg-[#071726] p-5 text-center text-sm text-slate-400">
        Is report mein abhi koi task available nahi hai.
      </p>
    ) : !loading ? (
      <div className="mt-5 space-y-3">
        {filteredTasks.map((task) => {
          const employee = employees.find(
            (item) => item.id === task.assigned_to
          );

          const project = projects.find(
            (item) => item.id === task.project_id
          );

          return (
            <article
              key={task.id}
              className="rounded-xl border border-white/10 bg-[#071726] p-4"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h3 className="font-semibold text-white">
                    {task.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Employee: {employee?.full_name || "Unassigned"}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Project: {project?.name || "—"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {STATUS_LABELS[task.status] || task.status}
                  </span>

                  {task.due_date &&
                    task.due_date < today &&
                    task.status !== "completed" && (
                      <span className="rounded-full bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-300">
                        Overdue
                      </span>
                    )}
                </div>
              </div>

              {task.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">
                  {task.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-4 border-t border-white/[0.08] pt-3 text-xs text-slate-400">
                <span>Priority: {task.priority || "—"}</span>
                <span>Deadline: {formatDate(task.due_date)}</span>
              </div>
            </article>
          );
        })}
      </div>
    ) : null}
  </section>
)}
    </div>
  );
}