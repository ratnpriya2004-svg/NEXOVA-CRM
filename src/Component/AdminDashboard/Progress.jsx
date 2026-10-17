import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const STATUS_OPTIONS = [
  { label: "To Do", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Blocked", value: "blocked" },
];

const STATUS_STYLES = {
  pending: "border border-white/10 bg-white/[0.04] text-slate-300",
  in_progress: "border border-blue-400/20 bg-blue-400/10 text-blue-200",
  completed: "border border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  blocked: "border border-violet-400/20 bg-violet-400/10 text-violet-200",
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

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);

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

  // Match the Admin Dashboard's Weekly Activity chart: tasks created each day.
  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const mondayOffset = (now.getDay() + 6) % 7;
    startOfWeek.setDate(now.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        const key = date.toDateString();

        return {
          day,
          tasks: tasks.filter(
            (task) => task.created_at && new Date(task.created_at).toDateString() === key
          ).length,
        };
      }
    );
  }, [tasks]);

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

  const selectedEmployeeTasks = useMemo(() => {
    if (!selectedEmployeeDetail) return [];

    return tasks
      .filter((task) => task.assigned_to === selectedEmployeeDetail.id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [selectedEmployeeDetail, tasks]);

  const selectedEmployeeStats = useMemo(() => {
    const total = selectedEmployeeTasks.length;
    const completed = selectedEmployeeTasks.filter(
      (task) => task.status === "completed"
    ).length;
    const inProgress = selectedEmployeeTasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const pending = selectedEmployeeTasks.filter(
      (task) => task.status === "pending"
    ).length;
    const blocked = selectedEmployeeTasks.filter(
      (task) => task.status === "blocked"
    ).length;

    return {
      total,
      completed,
      inProgress,
      pending,
      blocked,
      percentage: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [selectedEmployeeTasks]);

  const openEmployeeDetails = (employee) => {
    if (!employee) return;
    setSelectedEmployeeDetail(employee);
    setSelectedEmployee(employee.id);
  };

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

  return (
    <div className="space-y-6 pb-8 font-sans text-slate-100">
      {/* PAGE HEADER */}
      <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#071726] p-6 shadow-xl shadow-black/10 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
            NEXOVA X / ADMIN
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Track Progress
          </h1>

          <p className="mt-2 text-xs text-slate-500">
            Monitor tasks, employee performance and project deadlines.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProgress}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600/80 bg-[#0a2237]/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>↻</span>
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
        >
          <p className="font-semibold">Could not load progress data.</p>
          <p className="mt-1 break-words">{error}</p>

          <button
            type="button"
            onClick={fetchProgress}
            className="mt-3 inline-flex items-center justify-center rounded-xl border border-rose-400/30 bg-rose-400/[0.06] px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:border-rose-300/50 hover:bg-rose-400/10"
          >
            Try again
          </button>
        </div>
      )}

      {/* WEEKLY ACTIVITY — MATCHES ADMIN DASHBOARD */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071726] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-white">Weekly Activity</h2>
          <p className="mt-1 text-xs text-slate-500">Tasks created this week</p>
        </div>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading weekly activity...</p>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#71849a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#71849a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#071726", border: "1px solid #ffffff20", borderRadius: 12, color: "#fff" }} />
                <Bar dataKey="tasks" name="Tasks" fill="#9b7bff" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* EMPLOYEE PROGRESS */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071726] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-white">
            Employee-wise Progress
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Completion percentage is calculated from each employee's assigned tasks.
          </p>
        </div>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">
            Loading employee progress...
          </p>
        ) : employeeProgress.length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-8 text-center">
            <p className="font-semibold text-slate-200">
              No employees found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Add employees to see their progress here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {employeeProgress.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => openEmployeeDetails(employee)}
                className={`w-full rounded-2xl border p-4 text-left transition duration-200 hover:border-cyan-300/40 hover:bg-cyan-300/[0.03] ${
                  selectedEmployee === employee.id
                    ? "border-cyan-300/50 bg-cyan-300/[0.08] ring-1 ring-cyan-300/15"
                    : "border-slate-700/70 bg-[#071b2e]"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-sm font-semibold text-cyan-200">
                      {getInitials(employee.full_name)}
                    </div>

                    <div className="min-w-0">
                      <p className="break-words font-semibold text-white">
                        {employee.full_name || "Unnamed Employee"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {employee.total} assigned task
                        {employee.total === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xl font-bold text-cyan-300">
                      {employee.percentage}%
                    </p>

                    <p className="text-xs text-slate-400">
                      Completion
                    </p>
                  </div>
                </div>

                <div
                  className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800"
                  role="progressbar"
                  aria-label={`${employee.full_name || "Employee"} completion`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={employee.percentage}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all duration-500"
                    style={{ width: `${employee.percentage}%` }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-medium text-emerald-200">
                    Completed: {employee.completed}
                  </span>

                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 font-medium text-amber-200">
                    In Progress: {employee.inProgress}
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-slate-300">
                    To Do: {employee.pending}
                  </span>

                  <span className="rounded-full bg-rose-400/10 px-2.5 py-1 font-medium text-rose-200">
                    Blocked: {employee.blocked}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* TASK DETAILS */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#071726] shadow-xl shadow-black/10">
        <div className="border-b border-white/[0.08] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-white">
                Task Progress Details
              </h2>

              <p className="mt-1 text-xs text-slate-500">
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-600/80 bg-[#0a2237]/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200"
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
              className="w-full rounded-xl border border-white/10 bg-[#0a1929] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
            />

            <select
              value={selectedEmployee}
              onChange={(event) =>
                setSelectedEmployee(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0a1929] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10"
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
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-white">
                {loading ? "..." : filteredTasks.length}
              </span>{" "}
              task{filteredTasks.length === 1 ? "" : "s"}
            </p>

            {activeFilter !== "all" && (
              <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[11px] font-medium text-cyan-200">
                Status: {formatStatus(activeFilter)}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-200">
              No tasks found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Try another filter or create a task first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-white/[0.035] text-[10px] uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Task</th>
                  <th className="px-5 py-4 font-semibold">Employee</th>
                  <th className="px-5 py-4 font-semibold">Project</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Deadline</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.07]">
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
                      onClick={() => openEmployeeDetails(employee)}
                      className={`${employee ? "cursor-pointer" : ""} transition hover:bg-white/[0.035]`}
                      title={employee ? `View ${employee.full_name || "employee"} progress` : undefined}
                    >
                      <td className="max-w-xs px-5 py-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEmployeeDetails(employee);
                          }}
                          disabled={!employee}
                          className="text-left font-semibold text-white transition hover:text-cyan-200 disabled:cursor-default"
                          title={employee ? "View assigned employee progress" : "This task is unassigned"}
                        >
                          {task.title}
                        </button>

                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                            {task.description}
                          </p>
                        )}

                        {isOverdue && (
                          <span className="mt-2 inline-flex rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-1 text-xs font-semibold text-rose-200">
                            Overdue
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {employee ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEmployeeDetails(employee);
                            }}
                            className="text-left transition hover:text-cyan-200 hover:underline"
                          >
                            {employee.full_name || "Unnamed Employee"}
                          </button>
                        ) : (
                          "Unassigned"
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {project?.name || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="capitalize text-slate-300">
                          {task.priority || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                            STATUS_STYLES[task.status] ??
                            "bg-slate-800 text-slate-200"
                          }`}
                        >
                          {formatStatus(task.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-300">
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
      <section className="rounded-2xl border border-rose-400/20 bg-[#071726] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Overdue Tasks
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Tasks past their deadline that are not completed.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200">
            {loading ? "..." : counts.overdue} overdue
          </span>
        </div>

        {!loading && counts.overdue === 0 && (
          <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-sm text-slate-300">
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
                    onClick={() => openEmployeeDetails(employee)}
                    role={employee ? "button" : undefined}
                    tabIndex={employee ? 0 : undefined}
                    onKeyDown={(event) => {
                      if (employee && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        openEmployeeDetails(employee);
                      }
                    }}
                    className={`flex flex-col justify-between gap-2 rounded-xl border border-rose-400/15 bg-white/[0.025] p-4 sm:flex-row sm:items-center ${employee ? "cursor-pointer transition hover:border-rose-300/40" : ""}`}
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {task.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Assigned to: {employee?.full_name || "Unassigned"}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-sm font-semibold text-rose-300">
                        Due: {formatDate(task.due_date)}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatStatus(task.status)}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* EMPLOYEE DETAIL SIDE PANEL */}
      {selectedEmployeeDetail && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedEmployeeDetail(null);
            }
          }}
          role="presentation"
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedEmployeeDetail.full_name || "Employee"} task progress`}
            className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#071726] shadow-2xl shadow-black/40 animate-in slide-in-from-right duration-200 sm:max-w-xl"
          >
            {/* Drawer header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5 sm:p-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-200">
                  {getInitials(selectedEmployeeDetail.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Employee Overview
                  </p>
                  <h2 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">
                    {selectedEmployeeDetail.full_name || "Unnamed Employee"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Task history and performance
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployeeDetail(null)}
                aria-label="Close employee details"
                title="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                  <path d="m18 6-12 12M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Scrollable drawer body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {/* Completion ring + totals */}
              <section className="rounded-2xl border border-white/[0.08] bg-[#0a1b2b] p-4 sm:p-5">
                <div className="flex flex-col items-center gap-4 min-[420px]:flex-row">
                  <div className="relative h-32 w-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Completed", value: selectedEmployeeStats.completed },
                            { name: "Remaining", value: Math.max(selectedEmployeeStats.total - selectedEmployeeStats.completed, selectedEmployeeStats.total === 0 ? 1 : 0) },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={43}
                          outerRadius={56}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={2}
                          stroke="none"
                        >
                          <Cell fill="#22d3ee" />
                          <Cell fill="#26384a" />
                        </Pie>
                        <Tooltip contentStyle={{ background: "#071726", border: "1px solid #ffffff20", borderRadius: 10, color: "#fff" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {selectedEmployeeStats.percentage}%
                      </span>
                      <span className="text-[10px] text-slate-400">completed</span>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                      <p className="text-xs text-slate-400">Total Assigned</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{selectedEmployeeStats.total}</p>
                    </div>
                    <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] p-3">
                      <p className="text-xs text-slate-400">Completed</p>
                      <p className="mt-1 text-2xl font-semibold text-cyan-200">{selectedEmployeeStats.completed}</p>
                    </div>
                    <div className="rounded-xl border border-blue-400/15 bg-blue-400/[0.05] p-3">
                      <p className="text-xs text-slate-400">In Progress</p>
                      <p className="mt-1 text-xl font-semibold text-blue-200">{selectedEmployeeStats.inProgress}</p>
                    </div>
                    <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3">
                      <p className="text-xs text-slate-400">Pending / Blocked</p>
                      <p className="mt-1 text-xl font-semibold text-amber-200">{selectedEmployeeStats.pending + selectedEmployeeStats.blocked}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Task list */}
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">All Assigned Tasks</h3>
                    <p className="mt-1 text-xs text-slate-500">Newest tasks first, with dates and status.</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                    {selectedEmployeeTasks.length} tasks
                  </span>
                </div>

                {selectedEmployeeTasks.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 text-center">
                    <p className="font-medium text-slate-200">No tasks assigned yet</p>
                    <p className="mt-1 text-xs text-slate-500">Tasks assigned to this employee will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEmployeeTasks.map((task) => {
                      const project = projects.find((item) => item.id === task.project_id);
                      const isOverdue = task.due_date && task.due_date < today && task.status !== "completed";

                      return (
                        <article key={task.id} className="rounded-xl border border-white/[0.08] bg-[#0a1b2b] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="break-words font-semibold text-white">{task.title || "Untitled task"}</h4>
                              {task.description && (
                                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">{task.description}</p>
                              )}
                              <p className="mt-2 text-xs text-slate-500">Project: {project?.name || "—"}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[task.status] || "border border-white/10 bg-white/[0.04] text-slate-300"}`}>
                              {formatStatus(task.status)}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/[0.07] pt-3 min-[420px]:grid-cols-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">Assigned / Created</p>
                              <p className="mt-1 break-words text-xs text-slate-200">{formatDateTime(task.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">Deadline</p>
                              <p className={`mt-1 break-words text-xs ${isOverdue ? "text-rose-300" : "text-slate-200"}`}>{formatDate(task.due_date)}{isOverdue ? " · Overdue" : ""}</p>
                            </div>
                            <div className="min-[420px]:col-span-2">
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">Completed At</p>
                              <p className="mt-1 break-words text-xs text-slate-200">{task.status === "completed" ? formatDateTime(task.completed_at) : "Not completed yet"}</p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}