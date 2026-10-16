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

  const today = new Date().toLocaleDateString("en-CA");

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

            const isOverdue =
        Boolean(
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
            new Date(Date.now() - 7 * 86400000)
              .toLocaleDateString("en-CA"));

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
    { title: "Total Tasks", value: counts.total, color: "text-blue-600" },
    {
      title: "Completed",
      value: counts.completed,
      color: "text-emerald-600",
    },
    { title: "To Do", value: counts.pending, color: "text-slate-700" },
    {
      title: "In Progress",
      value: counts.inProgress,
      color: "text-amber-600",
    },
    { title: "Blocked", value: counts.blocked, color: "text-red-600" },
    { title: "Overdue", value: counts.overdue, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            NEXOVA X / ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Reports
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Task summaries, employee performance and deadlines.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          ↻ {loading ? "Refreshing..." : "Refresh Reports"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
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
      color: "text-blue-600",
    },
    {
      title: "Completed",
      value: counts.completed,
      filter: "completed",
      color: "text-emerald-600",
    },
    {
      title: "To Do",
      value: counts.pending,
      filter: "pending",
      color: "text-slate-700",
    },
    {
      title: "In Progress",
      value: counts.inProgress,
      filter: "in_progress",
      color: "text-amber-600",
    },
    {
      title: "Blocked",
      value: counts.blocked,
      filter: "blocked",
      color: "text-red-600",
    },
    {
      title: "Overdue",
      value: counts.overdue,
      filter: "overdue",
      color: "text-rose-600",
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

      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        statusFilter === item.filter
          ? "border-blue-500 ring-2 ring-blue-100"
          : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <p className="text-sm font-medium text-slate-500">
        {item.title}
      </p>

      <p className={`mt-3 text-3xl font-bold ${item.color}`}>
        {loading ? "..." : item.value}
      </p>

      <p className="mt-2 text-xs font-semibold text-blue-600">
        {statusFilter === item.filter
          ? "Currently selected ✓"
          : "View report →"}
      </p>
    </button>
  ))}
</section>

      {/* EMPLOYEE REPORT */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Employee-wise Performance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Task completion summary for every employee.
            </p>
          </div>

          <button
            type="button"
            onClick={exportEmployeeReport}
            disabled={loading || employeeReports.length === 0}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            ↓ Export Employee CSV
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading employee reports...
          </p>
        ) : employeeReports.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No employees found.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">In Progress</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Progress</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {employeeReports.map((item) => (
                  <tr key={item.employee.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {item.employee.full_name || "Unnamed Employee"}
                    </td>
                    <td className="px-4 py-4">{item.total}</td>
                    <td className="px-4 py-4 text-emerald-700">
                      {item.completed}
                    </td>
                    <td className="px-4 py-4 text-amber-700">
                      {item.inProgress}
                    </td>
                    <td className="px-4 py-4">{item.pending}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Task Report
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Filter tasks and export the report to CSV.
              </p>
            </div>

            <button
              type="button"
              onClick={exportTaskReport}
              disabled={loading || filteredTasks.length === 0}
              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
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
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="all">All Dates</option>
              <option value="today">Created Today</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
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
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Loading task report...
          </p>
        ) : filteredTasks.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            No tasks match the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Task</th>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Project</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Deadline</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
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
                    <tr key={task.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {task.title}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {employee?.full_name || "Unassigned"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {project?.name || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {STATUS_LABELS[task.status] ?? task.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 capitalize text-slate-600">
                        {task.priority || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            isOverdue
                              ? "font-semibold text-red-600"
                              : "text-slate-600"
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
    className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6"
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Selected Report
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
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

        <p className="mt-1 text-sm text-slate-500">
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
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        Close Details
      </button>
    </div>

    {!loading && filteredTasks.length === 0 ? (
      <p className="mt-5 rounded-xl bg-white p-5 text-center text-sm text-slate-500">
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
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {task.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Employee: {employee?.full_name || "Unassigned"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Project: {project?.name || "—"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {STATUS_LABELS[task.status] || task.status}
                  </span>

                  {task.due_date &&
                    task.due_date < today &&
                    task.status !== "completed" && (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        Overdue
                      </span>
                    )}
                </div>
              </div>

              {task.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                  {task.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
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