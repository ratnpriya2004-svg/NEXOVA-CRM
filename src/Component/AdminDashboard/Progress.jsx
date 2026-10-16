import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const STATUS_OPTIONS = [
  { label: "To Do", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Blocked", value: "blocked" },
];

const STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  blocked: "bg-red-100 text-red-700",
};

function formatStatus(status) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.label ??
    status?.replace(/_/g, " ") ??
    "Unknown"
  );
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  return (name || "Employee")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Progress() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [taskResult, employeeResult, projectResult] =
        await Promise.all([
          supabase
            .from("tasks")
            .select(
              "id, title, description, project_id, assigned_to, status, priority, due_date, completed_at, created_at"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("profiles")
            .select("id, full_name, role")
            .eq("role", "employee")
            .order("full_name", { ascending: true }),

          supabase.from("projects").select("id, name"),
        ]);

      if (taskResult.error) throw taskResult.error;
      if (employeeResult.error) throw employeeResult.error;
      if (projectResult.error) throw projectResult.error;

      setTasks(taskResult.data ?? []);
      setEmployees(employeeResult.data ?? []);
      setProjects(projectResult.data ?? []);
    } catch (err) {
      console.error("Progress dashboard error:", err);
      setError(err.message || "Unable to load progress data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const today = new Date().toLocaleDateString("en-CA");

  const counts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const inProgress = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const blocked = tasks.filter(
      (task) => task.status === "blocked"
    ).length;
    const pending = tasks.filter(
      (task) => task.status === "pending"
    ).length;
    const overdue = tasks.filter(
      (task) =>
        task.due_date &&
        task.due_date < today &&
        task.status !== "completed"
    ).length;

    return {
      total,
      completed,
      inProgress,
      blocked,
      pending,
      overdue,
    };
  }, [tasks, today]);

  const employeeProgress = useMemo(() => {
    return employees.map((employee) => {
      const assignedTasks = tasks.filter(
        (task) => task.assigned_to === employee.id
      );

      const total = assignedTasks.length;
      const completed = assignedTasks.filter(
        (task) => task.status === "completed"
      ).length;
      const inProgress = assignedTasks.filter(
        (task) => task.status === "in_progress"
      ).length;
      const blocked = assignedTasks.filter(
        (task) => task.status === "blocked"
      ).length;
      const pending = assignedTasks.filter(
        (task) => task.status === "pending"
      ).length;

      const percentage =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        ...employee,
        tasks: assignedTasks,
        total,
        completed,
        inProgress,
        blocked,
        pending,
        percentage,
      };
    });
  }, [employees, tasks]);

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
        (task.description ?? "").toLowerCase().includes(query) ||
        (employee?.full_name ?? "").toLowerCase().includes(query) ||
        (project?.name ?? "").toLowerCase().includes(query);

      const matchesStatus =
        activeFilter === "all" || task.status === activeFilter;

      const matchesEmployee =
        selectedEmployee === "all" ||
        task.assigned_to === selectedEmployee;

      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [
    tasks,
    employees,
    projects,
    search,
    activeFilter,
    selectedEmployee,
  ]);

  const summaryCards = [
    {
      title: "Total Tasks",
      value: counts.total,
      filter: "all",
      color: "text-blue-600",
      icon: "▤",
    },
    {
      title: "To Do",
      value: counts.pending,
      filter: "pending",
      color: "text-slate-700",
      icon: "◷",
    },
    {
      title: "In Progress",
      value: counts.inProgress,
      filter: "in_progress",
      color: "text-amber-600",
      icon: "↗",
    },
    {
      title: "Completed",
      value: counts.completed,
      filter: "completed",
      color: "text-emerald-600",
      icon: "✓",
    },
    {
      title: "Blocked",
      value: counts.blocked,
      filter: "blocked",
      color: "text-red-600",
      icon: "!",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            NEXOVA X / ADMIN
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Track Progress
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor tasks, employee performance and project deadlines.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProgress}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>↻</span>
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Could not load progress data.</p>
          <p className="mt-1 break-words">{error}</p>

          <button
            type="button"
            onClick={fetchProgress}
            className="mt-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActiveFilter(item.filter)}
            className={`rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
              activeFilter === item.filter
                ? "border-blue-500 ring-2 ring-blue-100"
                : "border-slate-200 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">
                {item.title}
              </p>

              <span className={`text-xl ${item.color}`}>
                {item.icon}
              </span>
            </div>

            <p className={`mt-4 text-3xl font-bold ${item.color}`}>
              {loading ? "..." : item.value}
            </p>

            <p className="mt-2 text-xs font-medium text-blue-600">
              {activeFilter === item.filter
                ? "Selected ✓"
                : "View tasks →"}
            </p>
          </button>
        ))}
      </section>

      {/* EMPLOYEE PROGRESS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Employee-wise Progress
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Completion percentage is calculated from each employee's assigned tasks.
          </p>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading employee progress...
          </p>
        ) : employeeProgress.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-8 text-center">
            <p className="font-semibold text-slate-700">
              No employees found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add employees to see their progress here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {employeeProgress.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => {
                  setSelectedEmployee((current) =>
                    current === employee.id ? "all" : employee.id
                  );
                }}
                className={`w-full rounded-xl border p-4 text-left transition hover:border-blue-300 ${
                  selectedEmployee === employee.id
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-100"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {getInitials(employee.full_name)}
                    </div>

                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">
                        {employee.full_name || "Unnamed Employee"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {employee.total} assigned task
                        {employee.total === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xl font-bold text-blue-600">
                      {employee.percentage}%
                    </p>

                    <p className="text-xs text-slate-500">
                      Completion
                    </p>
                  </div>
                </div>

                <div
                  className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={`${employee.full_name || "Employee"} completion`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={employee.percentage}
                >
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${employee.percentage}%` }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    Completed: {employee.completed}
                  </span>

                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                    In Progress: {employee.inProgress}
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                    To Do: {employee.pending}
                  </span>

                  <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">
                    Blocked: {employee.blocked}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* TASK DETAILS */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Task Progress Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search tasks or filter by status and employee.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
                setSelectedEmployee("all");
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task, employee or project..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={selectedEmployee}
              onChange={(event) =>
                setSelectedEmployee(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Employees</option>

              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name || "Unnamed Employee"}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {loading ? "..." : filteredTasks.length}
              </span>{" "}
              task{filteredTasks.length === 1 ? "" : "s"}
            </p>

            {activeFilter !== "all" && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Status: {formatStatus(activeFilter)}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-700">
              No tasks found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try another filter or create a task first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Task</th>
                  <th className="px-5 py-4 font-semibold">Employee</th>
                  <th className="px-5 py-4 font-semibold">Project</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Deadline</th>
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
                    <tr
                      key={task.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-xs px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {task.title}
                        </p>

                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {task.description}
                          </p>
                        )}

                        {isOverdue && (
                          <span className="mt-2 inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                            Overdue
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {employee?.full_name || "Unassigned"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {project?.name || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="capitalize text-slate-600">
                          {task.priority || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                            STATUS_STYLES[task.status] ??
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {formatStatus(task.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(task.due_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* OVERDUE TASKS */}
      <section className="rounded-2xl border border-red-100 bg-red-50/50 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Overdue Tasks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tasks past their deadline that are not completed.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full bg-red-100 px-3 py-1.5 text-sm font-bold text-red-700">
            {loading ? "..." : counts.overdue} overdue
          </span>
        </div>

        {!loading && counts.overdue === 0 && (
          <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
            Great! There are no overdue tasks.
          </p>
        )}

        {!loading && counts.overdue > 0 && (
          <div className="mt-4 space-y-2">
            {tasks
              .filter(
                (task) =>
                  task.due_date &&
                  task.due_date < today &&
                  task.status !== "completed"
              )
              .map((task) => {
                const employee = employees.find(
                  (item) => item.id === task.assigned_to
                );

                return (
                  <div
                    key={task.id}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-red-100 bg-white p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {task.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Assigned to: {employee?.full_name || "Unassigned"}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-sm font-semibold text-red-600">
                        Due: {formatDate(task.due_date)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatStatus(task.status)}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}