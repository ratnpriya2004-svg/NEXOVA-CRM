import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
};

const PRIORITY_STYLES = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
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
    blue: "border-blue-200 bg-blue-50",
    amber: "border-amber-200 bg-amber-50",
    violet: "border-violet-200 bg-violet-50",
    green: "border-green-200 bg-green-50",
    red: "border-red-200 bg-red-50",
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Work Management
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Task Management
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Assign work and monitor employee progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          disabled={loading || saving}
          className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
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
            onClick={() => setActiveFilter(item.filter)}
            className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              summaryColorStyles[item.color]
            } ${
              activeFilter === item.filter
                ? "ring-2 ring-blue-400"
                : ""
            }`}
          >
            <p className="text-sm font-medium text-slate-600">
              {item.label}
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? "…" : item.value}
            </p>

            <p className="mt-2 text-xs font-semibold text-blue-700">
              {activeFilter === item.filter ? "Selected" : "View tasks →"}
            </p>
          </button>
        ))}
      </div>

      {/* CREATE TASK PANEL */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Manage Team Tasks
          </h3>

          <p className="mt-1 text-sm text-slate-500">
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
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          + Create Task
        </button>
      </div>

      {/* CREATE / EDIT MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingTask ? "Edit Task Details" : "Create New Task"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {editingTask
                    ? "Task progress is managed by the assigned employee."
                    : "New tasks start with Pending status."}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeTaskForm}
                className="rounded-lg px-3 py-2 text-2xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
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
                    className="mb-2 block text-sm font-semibold text-slate-700"
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                {/* PROJECT */}
                <div>
                  <label
                    htmlFor="task-project"
                    className="mb-2 block text-sm font-semibold text-slate-700"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
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
                    className="mb-2 block text-sm font-semibold text-slate-700"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="">Select employee</option>

                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name || "Unnamed Employee"}
                      </option>
                    ))}
                  </select>

                  {employees.length === 0 && !loading && (
                    <p className="mt-2 text-xs text-red-600">
                      No employees found. Check employee profiles and permissions.
                    </p>
                  )}
                </div>

                {/* DEADLINE */}
                <div>
                  <label
                    htmlFor="task-due-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                {/* PRIORITY */}
                <div>
                  <label
                    htmlFor="task-priority"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Priority
                  </label>

                  <select
                    id="task-priority"
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
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
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Current Employee Progress
                    </label>

                    <div className="flex min-h-[50px] items-center">
                      <span
                        className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                          STATUS_STYLES[editingTask.status] ||
                          "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {STATUS_LABELS[editingTask.status] ||
                          prettyLabel(editingTask.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Only the assigned employee can update progress.
                    </p>
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label
                  htmlFor="task-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* EXISTING EMPLOYEE UPDATE */}
              {editingTask?.completion_note && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800">
                    Employee Completion Note
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-green-900">
                    {editingTask.completion_note}
                  </p>
                </div>
              )}

              {editingTask?.blocked_reason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">
                    Employee Blocked Reason
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-red-900">
                    {editingTask.blocked_reason}
                  </p>
                </div>
              )}

              {/* FORM ACTIONS */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeTaskForm}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Assign Task
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Change the assignee, priority or deadline.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeAssignModal}
                className="rounded-lg px-3 py-2 text-2xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close assignment form"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">
                {assigningTask.title}
              </p>

              <p className="mt-2 text-sm text-slate-600">
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
                  className="mb-2 block text-sm font-semibold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
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
                    className="mb-2 block text-sm font-semibold text-slate-700"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
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
                    className="mb-2 block text-sm font-semibold text-slate-700"
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeAssignModal}
                  className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || employees.length === 0}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK LIST */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              All Tasks
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Status shown here comes from employee updates.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search task, project, employee..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 sm:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No tasks found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try another filter or create a new task.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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

              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const isOverdue =
                    task.due_date &&
                    task.due_date < new Date().toISOString().slice(0, 10) &&
                    task.status !== "completed";

                  return (
                    <tr
                      key={task.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* TASK */}
                      <td className="max-w-xs px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {task.title}
                        </p>

                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* PROJECT */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {projectName(task.project_id)}
                      </td>

                      {/* EMPLOYEE */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {employeeName(task.assigned_to)}
                      </td>

                      {/* PRIORITY */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                            PRIORITY_STYLES[task.priority] ||
                            "bg-slate-100 text-slate-700"
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
                            "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          {STATUS_LABELS[task.status] ||
                            prettyLabel(task.status)}
                        </span>

                        {task.completion_note && (
                          <p className="mt-2 max-w-xs text-xs text-green-700">
                            Note: {task.completion_note}
                          </p>
                        )}

                        {task.blocked_reason && (
                          <p className="mt-2 max-w-xs text-xs text-red-700">
                            Blocked: {task.blocked_reason}
                          </p>
                        )}
                      </td>

                      {/* DEADLINE */}
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={
                            isOverdue
                              ? "font-semibold text-red-600"
                              : "text-slate-600"
                          }
                        >
                          {formatDate(task.due_date)}
                        </span>

                        {isOverdue && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
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
                            className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                          >
                            Assign
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(task)}
                            disabled={saving}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(task)}
                            disabled={saving}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
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
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-500">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        )}
      </div>
    </section>
  );
}