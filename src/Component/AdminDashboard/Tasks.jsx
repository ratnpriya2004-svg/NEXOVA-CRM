import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const EMPTY_FORM = {
  title: "",
  description: "",
  project_id: "",
  assigned_to: "",
  priority: "medium",
  due_date: "",
};

const EMPTY_ASSIGNMENT = {
  assigned_to: "",
  priority: "medium",
  due_date: "",
};

const PRIORITY_OPTIONS = ["low", "medium", "high"];

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

const STATUS_STYLES = {
  pending: "bg-[#17324b] text-slate-100 border-slate-600",
  in_progress: "bg-[#123b5b] text-cyan-200 border-cyan-300/30",
  completed: "bg-green-50 text-emerald-300 border-green-200",
  blocked: "bg-red-50 text-rose-300 border-red-200",
};

const PRIORITY_STYLES = {
  low: "bg-slate-100 text-slate-200",
  medium: "bg-[#17324b] text-slate-100",
  high: "bg-red-50 text-rose-300",
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingTask, setEditingTask] = useState(null);

  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT);
  const [assigningTask, setAssigningTask] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // --------------------------------------------------
  // LOAD TASKS, EMPLOYEES AND PROJECTS
  // --------------------------------------------------

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    setError("");

    try {
      const [
        { data: taskData, error: taskError },
        { data: employeeData, error: employeeError },
        { data: projectData, error: projectError },
      ] = await Promise.all([
        supabase
          .from("tasks")
          .select(`
            id,
            title,
            description,
            project_id,
            assigned_to,
            status,
            priority,
            due_date,
            created_by,
            created_at,
            completed_at,
            completion_note,
            blocked_reason
          `)
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("role", "employee")
          .order("full_name"),

        supabase
          .from("projects")
          .select("id, name")
          .order("name"),
      ]);

      if (taskError) throw taskError;
      if (employeeError) throw employeeError;
      if (projectError) throw projectError;

      setTasks(taskData ?? []);
      setEmployees(employeeData ?? []);
      setProjects(projectData ?? []);
    } catch (err) {
      console.error("Task management load error:", err);
      setError(err.message || "Unable to load task management data.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  function employeeName(id) {
    return (
      employees.find((employee) => employee.id === id)?.full_name ||
      "Unassigned"
    );
  }

  function projectName(id) {
    return (
      projects.find((project) => project.id === id)?.name ||
      "Unknown project"
    );
  }

  function prettyLabel(value) {
    if (!value) return "—";

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function closeTaskForm() {
    setFormOpen(false);
    setEditingTask(null);
    setForm(EMPTY_FORM);
  }

  function closeAssignModal() {
    setAssignModalOpen(false);
    setAssigningTask(null);
    setAssignmentForm(EMPTY_ASSIGNMENT);
  }

  // --------------------------------------------------
  // CREATE TASK / EDIT TASK DETAILS
  // Admin cannot select or update task status here.
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    const title = form.title.trim();

    if (!title) {
      setError("Task title is required.");
      return;
    }

    if (!form.project_id) {
      setError("Please select a project.");
      return;
    }

    if (!form.assigned_to) {
      setError("Please assign this task to an employee.");
      return;
    }

    if (!PRIORITY_OPTIONS.includes(form.priority)) {
      setError("Please select a valid priority.");
      return;
    }

    setSaving(true);

    try {
      if (editingTask) {
        // Existing task: use restricted RPC.
        // This RPC does not accept status or completion fields.
        const { error: rpcError } = await supabase.rpc(
          "admin_update_task_details",
          {
            p_task_id: editingTask.id,
            p_title: title,
            p_description: form.description.trim() || null,
            p_project_id: form.project_id,
            p_assigned_to: form.assigned_to,
            p_priority: form.priority,
            p_due_date: form.due_date || null,
          }
        );

        if (rpcError) throw rpcError;

        setNotice(
          "Task details updated. Employee progress was not changed."
        );
      } else {
        // New tasks always start as pending.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          throw new Error("Your session expired. Please log in again.");
        }

        const { error: insertError } = await supabase
          .from("tasks")
          .insert({
            title,
            description: form.description.trim() || null,
            project_id: form.project_id,
            assigned_to: form.assigned_to,
            priority: form.priority,
            due_date: form.due_date || null,
            status: "pending",
            created_by: user.id,
          });

        if (insertError) throw insertError;

        setNotice("Task created and assigned successfully.");
      }

      closeTaskForm();
      await loadData(false);
    } catch (err) {
      console.error("Task save error:", err);

      setError(
        err.message ||
          "Unable to save task. Please check Supabase permissions."
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // OPEN EDIT FORM
  // --------------------------------------------------

  function handleEdit(task) {
    setEditingTask(task);

    setForm({
      title: task.title ?? "",
      description: task.description ?? "",
      project_id: task.project_id ?? "",
      assigned_to: task.assigned_to ?? "",
      priority: task.priority ?? "medium",
      due_date: task.due_date
        ? String(task.due_date).slice(0, 10)
        : "",
    });

    setError("");
    setNotice("");
    setFormOpen(true);
  }

  // --------------------------------------------------
  // ASSIGN / REASSIGN TASK
  // Status remains untouched.
  // --------------------------------------------------

  function openAssignModal(task) {
    setAssigningTask(task);

    setAssignmentForm({
      assigned_to: task.assigned_to ?? "",
      priority: task.priority ?? "medium",
      due_date: task.due_date
        ? String(task.due_date).slice(0, 10)
        : "",
    });

    setError("");
    setNotice("");
    setAssignModalOpen(true);
  }

  async function handleAssignTask(event) {
    event.preventDefault();

    if (!assigningTask) return;

    setError("");
    setNotice("");

    if (!assignmentForm.assigned_to) {
      setError("Please select an employee.");
      return;
    }

    if (!PRIORITY_OPTIONS.includes(assignmentForm.priority)) {
      setError("Please select a valid priority.");
      return;
    }

    setSaving(true);

    try {
      const { error: rpcError } = await supabase.rpc(
        "admin_update_task_details",
        {
          p_task_id: assigningTask.id,
          p_title: assigningTask.title,
          p_description: assigningTask.description || null,
          p_project_id: assigningTask.project_id,
          p_assigned_to: assignmentForm.assigned_to,
          p_priority: assignmentForm.priority,
          p_due_date: assignmentForm.due_date || null,
        }
      );

      if (rpcError) throw rpcError;

      const assignedEmployee = employeeName(assignmentForm.assigned_to);

      closeAssignModal();

      setNotice(
        `"${assigningTask.title}" assigned to ${assignedEmployee}.`
      );

      await loadData(false);
    } catch (err) {
      console.error("Task assignment error:", err);

      setError(
        err.message ||
          "Unable to assign task. Please check the database function."
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // DELETE TASK
  // --------------------------------------------------

  async function handleDelete(task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setSaving(true);

    try {
      const { data, error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id)
        .select("id");

      if (deleteError) throw deleteError;

      if (!data?.length) {
        throw new Error(
          "Task was not deleted. Please check the admin DELETE policy."
        );
      }

      setNotice("Task deleted successfully.");

      await loadData(false);
    } catch (err) {
      console.error("Task delete error:", err);
      setError(err.message || "Unable to delete task.");
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // SEARCH AND FILTER
  // --------------------------------------------------

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus =
        activeFilter === "all" || task.status === activeFilter;

      const searchableText = [
        task.title,
        task.description,
        employeeName(task.assigned_to),
        projectName(task.project_id),
        task.status,
        task.priority,
        task.completion_note,
        task.blocked_reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(query);
    });
  }, [tasks, employees, projects, search, activeFilter]);

  // --------------------------------------------------
  // SUMMARY CARDS
  // --------------------------------------------------

  const summaryCards = [
    {
      label: "Total Tasks",
      value: tasks.length,
      filter: "all",
      color: "blue",
    },
    {
      label: "Pending",
      value: tasks.filter((task) => task.status === "pending").length,
      filter: "pending",
      color: "amber",
    },
    {
      label: "In Progress",
      value: tasks.filter((task) => task.status === "in_progress").length,
      filter: "in_progress",
      color: "violet",
    },
    {
      label: "Completed",
      value: tasks.filter((task) => task.status === "completed").length,
      filter: "completed",
      color: "green",
    },
    {
      label: "Blocked",
      value: tasks.filter((task) => task.status === "blocked").length,
      filter: "blocked",
      color: "red",
    },
  ];

  const summaryColorStyles = {
    blue: "border-cyan-300/20 bg-[#071b2e]",
    amber: "border-cyan-300/20 bg-[#071b2e]",
    violet: "border-cyan-300/20 bg-[#071b2e]",
    green: "border-cyan-300/20 bg-[#071b2e]",
    red: "border-cyan-300/20 bg-[#071b2e]",
  };

  // --------------------------------------------------
  // LIVE TASK ANALYTICS (uses the actual Supabase task data)
  // --------------------------------------------------

  const monthlyAnalytics = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (6 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthTasks = tasks.filter(
        (task) => (task.created_at || "").slice(0, 7) === key
      );
      const completed = tasks.filter((task) => {
        const completionDate = task.completed_at || (task.status === "completed" ? task.updated_at : null);
        return completionDate && String(completionDate).slice(0, 7) === key;
      }).length;

      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        created: monthTasks.length,
        completed,
      };
    });
  }, [tasks]);

  const taskStatusAnalytics = useMemo(() => [
    { name: "Completed", value: tasks.filter((task) => task.status === "completed").length, color: "#b7ff4a" },
    { name: "In Progress", value: tasks.filter((task) => task.status === "in_progress").length, color: "#9b7bff" },
    { name: "Pending", value: tasks.filter((task) => task.status === "pending").length, color: "#35d8ef" },
    { name: "Blocked", value: tasks.filter((task) => task.status === "blocked").length, color: "#ff6b7a" },
  ], [tasks]);

  const weeklyAnalytics = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        day,
        tasks: tasks.filter((task) => task.created_at && new Date(task.created_at).toDateString() === date.toDateString()).length,
      };
    });
  }, [tasks]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <section className="min-h-full space-y-6 pb-8 font-[Inter,ui-sans-serif,system-ui] text-slate-100">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-[#09253b] via-[#071b2e] to-[#101b3b] p-6 shadow-xl shadow-black/10 sm:flex-row sm:items-center flex flex-col justify-between gap-5">
        <div className="relative">
          <p className="mb-3 inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            Work Management
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Task Management
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Assign work and monitor employee progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600/80 bg-[#0a2237]/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          {notice}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {summaryCards.map((item) => (
          <button
            key={item.filter}
            type="button"
            onClick={() => {
              setActiveFilter(item.filter);
              if (item.filter === "all") setSearch("");
            }}
            className={`group relative overflow-hidden rounded-2xl border p-5 text-left shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-xl hover:shadow-cyan-950/30 ${
              summaryColorStyles[item.color]
            } ${
              activeFilter === item.filter
                ? "ring-1 ring-cyan-300/30 border-cyan-300/50"
                : ""
            }`}
          >
            <p className="text-sm font-medium text-slate-400">
              {item.label}
            </p>

            <p className="mt-3 text-4xl font-bold tracking-tight text-white">
              {loading ? "…" : item.value}
            </p>

            <p className="mt-2 text-xs font-semibold text-cyan-300">
              {activeFilter === item.filter ? "Selected" : "View tasks →"}
            </p>
          </button>
        ))}
      </div>

      {/* CREATE TASK PANEL */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-700/70 bg-[#071b2e] p-5 shadow-xl shadow-black/10 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-white">
            Manage Team Tasks
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Create tasks, set deadlines and assign employees.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setForm(EMPTY_FORM);
            setError("");
            setNotice("");
            setFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-bold text-[#041524] shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:shadow-cyan-400/25"
        >
          + Create Task
        </button>
      </div>


      {/* TASK ANALYTICS */}
      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.65fr_1fr]">
        <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#071726] p-5 shadow-xl shadow-black/10 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Task analytics</h3>
              <p className="mt-1 text-xs text-slate-500">Tasks created and completed by month</p>
            </div>
            <span className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-slate-400">Last 7 months</span>
          </div>
          <div className="h-[240px] w-full sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAnalytics} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tasksCreatedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#35d8ef" stopOpacity={0.3}/><stop offset="95%" stopColor="#35d8ef" stopOpacity={0}/></linearGradient>
                  <linearGradient id="tasksCompletedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b7ff4a" stopOpacity={0.22}/><stop offset="95%" stopColor="#b7ff4a" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff10" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill: "#71849a", fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{ fill: "#71849a", fontSize: 11 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: "#071726", border: "1px solid #ffffff20", borderRadius: 12, color: "#fff" }}/>
                <Area type="monotone" dataKey="created" name="Created" stroke="#35d8ef" strokeWidth={2.5} fill="url(#tasksCreatedFill)"/>
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#b7ff4a" strokeWidth={2.5} fill="url(#tasksCompletedFill)"/>
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#071726] p-5 shadow-xl shadow-black/10 sm:p-6">
          <div className="mb-3">
            <h3 className="font-semibold text-white">Task status</h3>
            <p className="mt-1 text-xs text-slate-500">Current distribution across all tasks</p>
          </div>
          <div className="h-[210px] w-full sm:h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskStatusAnalytics} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4} stroke="none">
                  {taskStatusAnalytics.map((entry) => <Cell key={entry.name} fill={entry.color}/>) }
                </Pie>
                <Tooltip contentStyle={{ background: "#071726", border: "1px solid #ffffff20", borderRadius: 12, color: "#fff" }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {taskStatusAnalytics.map((item) => (
              <button key={item.name} type="button" onClick={() => setActiveFilter(({ Completed: "completed", "In Progress": "in_progress", Pending: "pending", Blocked: "blocked" })[item.name])} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-white/[0.04]">
                <span className="flex items-center gap-2 text-slate-400"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }}/>{item.name}</span>
                <span className="font-semibold text-white">{loading ? "—" : item.value}</span>
              </button>
            ))}
          </div>
        </div>
      </section>



      {/* CREATE / EDIT MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020b14]/80 p-4 backdrop-blur-sm">
          <div className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-[#071b2e] p-6 text-slate-100 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingTask ? "Edit Task Details" : "Create New Task"}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  {editingTask
                    ? "Task progress is managed by the assigned employee."
                    : "New tasks start with Pending status."}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeTaskForm}
                className="rounded-lg px-3 py-2 text-2xl text-slate-400 hover:bg-white/10 disabled:opacity-50"
                aria-label="Close task form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* TITLE */}
                <div>
                  <label
                    htmlFor="task-title"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Task Title *
                  </label>

                  <input
                    id="task-title"
                    required
                    maxLength={200}
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    placeholder="Enter task title"
                    className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  />
                </div>

                {/* PROJECT */}
                <div>
                  <label
                    htmlFor="task-project"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Project *
                  </label>

                  <select
                    id="task-project"
                    required
                    value={form.project_id}
                    onChange={(event) =>
                      setForm({ ...form, project_id: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  >
                    <option value="">Select project</option>

                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* EMPLOYEE */}
                <div>
                  <label
                    htmlFor="task-employee"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Assign Employee *
                  </label>

                  <select
                    id="task-employee"
                    required
                    value={form.assigned_to}
                    onChange={(event) =>
                      setForm({ ...form, assigned_to: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  >
                    <option value="">Select employee</option>

                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name || "Unnamed Employee"}
                      </option>
                    ))}
                  </select>

                  {employees.length === 0 && !loading && (
                    <p className="mt-2 text-xs text-rose-300">
                      No employees found. Check employee profiles and permissions.
                    </p>
                  )}
                </div>

                {/* DEADLINE */}
                <div>
                  <label
                    htmlFor="task-due-date"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Due Date
                  </label>

                  <input
                    id="task-due-date"
                    type="date"
                    value={form.due_date}
                    onChange={(event) =>
                      setForm({ ...form, due_date: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  />
                </div>

                {/* PRIORITY */}
                <div>
                  <label
                    htmlFor="task-priority"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Priority
                  </label>

                  <select
                    id="task-priority"
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {prettyLabel(priority)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* READ-ONLY STATUS DISPLAY WHEN EDITING */}
                {editingTask && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-200">
                      Current Employee Progress
                    </label>

                    <div className="flex min-h-[50px] items-center">
                      <span
                        className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                          STATUS_STYLES[editingTask.status] ||
                          "border-slate-700 bg-[#0a2740] text-slate-200"
                        }`}
                      >
                        {STATUS_LABELS[editingTask.status] ||
                          prettyLabel(editingTask.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Only the assigned employee can update progress.
                    </p>
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label
                  htmlFor="task-description"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Description
                </label>

                <textarea
                  id="task-description"
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Describe the work to be done..."
                  className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              {/* EXISTING EMPLOYEE UPDATE */}
              {editingTask?.completion_note && (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <p className="text-sm font-semibold text-emerald-200">
                    Employee Completion Note
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-100">
                    {editingTask.completion_note}
                  </p>
                </div>
              )}

              {editingTask?.blocked_reason && (
                <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-4">
                  <p className="text-sm font-semibold text-rose-200">
                    Employee Blocked Reason
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-rose-100">
                    {editingTask.blocked_reason}
                  </p>
                </div>
              )}

              {/* FORM ACTIONS */}
              <div className="flex justify-end gap-3 border-t border-slate-700/70 pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeTaskForm}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 font-semibold text-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-bold text-[#041524] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Please wait..."
                    : editingTask
                      ? "Save Details"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN / REASSIGN MODAL */}
      {assignModalOpen && assigningTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020b14]/80 p-4 backdrop-blur-sm">
          <div className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-[#071b2e] p-6 text-slate-100 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Assign Task
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Change the assignee, priority or deadline.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeAssignModal}
                className="rounded-lg px-3 py-2 text-2xl text-slate-400 hover:bg-white/10 disabled:opacity-50"
                aria-label="Close assignment form"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-700 bg-[#0a2740] p-4">
              <p className="font-semibold text-white">
                {assigningTask.title}
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Current progress:{" "}
                <span className="font-semibold">
                  {STATUS_LABELS[assigningTask.status] ||
                    prettyLabel(assigningTask.status)}
                </span>
              </p>
            </div>

            <form onSubmit={handleAssignTask} className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="assign-employee"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Assign to Employee *
                </label>

                <select
                  id="assign-employee"
                  required
                  value={assignmentForm.assigned_to}
                  onChange={(event) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      assigned_to: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                >
                  <option value="">Select employee</option>

                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name || "Unnamed Employee"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="assign-priority"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Priority
                  </label>

                  <select
                    id="assign-priority"
                    value={assignmentForm.priority}
                    onChange={(event) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        priority: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {prettyLabel(priority)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="assign-deadline"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Due Date
                  </label>

                  <input
                    id="assign-deadline"
                    type="date"
                    value={assignmentForm.due_date}
                    onChange={(event) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        due_date: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-700/70 pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeAssignModal}
                  className="rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || employees.length === 0}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-bold text-[#041524] transition hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK LIST */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[#071b2e] shadow-xl shadow-black/10">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-700/70 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-white">
              All Tasks
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Status shown here comes from employee updates.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task, project, employee..."
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
            />
            <button
              type="button"
              onClick={() => { setSearch(""); setActiveFilter("all"); }}
              className="shrink-0 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              All Tasks
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-white">
              No tasks found
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Try another filter or create a new task.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0a2740] text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4">Task</th>
                  <th className="px-5 py-4">Project</th>
                  <th className="px-5 py-4">Assigned To</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Employee Progress</th>
                  <th className="px-5 py-4">Due Date</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/90">
                {filteredTasks.map((task) => {
                  const isOverdue =
                    task.due_date &&
                    task.due_date < new Date().toISOString().slice(0, 10) &&
                    task.status !== "completed";

                  return (
                    <tr
                      key={task.id}
                      className="transition hover:bg-[#0a2740]"
                    >
                      {/* TASK */}
                      <td className="max-w-xs px-5 py-4">
                        <p className="font-semibold text-white">
                          {task.title}
                        </p>

                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* PROJECT */}
                      <td className="px-5 py-4 text-sm text-slate-300">
                        {projectName(task.project_id)}
                      </td>

                      {/* EMPLOYEE */}
                      <td className="px-5 py-4 text-sm text-slate-300">
                        {employeeName(task.assigned_to)}
                      </td>

                      {/* PRIORITY */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                            PRIORITY_STYLES[task.priority] ||
                            "bg-slate-100 text-slate-200"
                          }`}
                        >
                          {prettyLabel(task.priority)}
                        </span>
                      </td>

                      {/* READ-ONLY STATUS */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
                            STATUS_STYLES[task.status] ||
                            "border-slate-700 bg-[#0a2740] text-slate-200"
                          }`}
                        >
                          {STATUS_LABELS[task.status] ||
                            prettyLabel(task.status)}
                        </span>

                        {task.completion_note && (
                          <p className="mt-2 max-w-xs text-xs text-emerald-300">
                            Note: {task.completion_note}
                          </p>
                        )}

                        {task.blocked_reason && (
                          <p className="mt-2 max-w-xs text-xs text-rose-300">
                            Blocked: {task.blocked_reason}
                          </p>
                        )}
                      </td>

                      {/* DEADLINE */}
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={
                            isOverdue
                              ? "font-semibold text-rose-300"
                              : "text-slate-300"
                          }
                        >
                          {formatDate(task.due_date)}
                        </span>

                        {isOverdue && (
                          <p className="mt-1 text-xs font-semibold text-rose-300">
                            Overdue
                          </p>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openAssignModal(task)}
                            disabled={saving}
                            className="rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200 disabled:opacity-50"
                          >
                            Assign
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(task)}
                            disabled={saving}
                            className="rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(task)}
                            disabled={saving}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE FOOTER */}
        {!loading && filteredTasks.length > 0 && (
          <div className="border-t border-slate-700/70 bg-[#0a2740] px-5 py-3 text-sm text-slate-400">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        )}
      </div>
    </section>
  );
}