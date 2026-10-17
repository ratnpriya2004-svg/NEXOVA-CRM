import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import Sidebar from "./Sidebar/Sidebar";
import Header from "./Header/Header";
import Overview from "./Overview/Overview";
import TaskSummary from "./TaskSummary/TaskSummary";
import TaskList from "./TaskList/TaskList";
import Progress from "./Progress/Progress";

const STATUS_LABELS = {
  pending: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

const formatDate = (value) => {
  if (!value) return "Not set";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const EmployeeDashboard = ({
  employeeName,
  onLogout,
  onOpenProfile,
}) => {
  
  const [activeTab, setActiveTab] = useState("Overview");

  const [tasks, setTasks] = useState([]);
  const [userId, setUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingTask, setEditingTask] = useState(null);

  const [updateForm, setUpdateForm] = useState({
    status: "pending",
    completion_note: "",
    blocked_reason: "",
  });

  // LOAD TASKS ASSIGNED TO THE LOGGED-IN EMPLOYEE
  const loadTasks = useCallback(
    async ({ quiet = false, id = userId } = {}) => {
      if (!id) {
        setLoading(false);
        return;
      }

      if (quiet) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const { data, error: queryError } = await supabase
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
            created_at,
            completed_at,
            completion_note,
            blocked_reason,
            projects(name)
          `)
          .eq("assigned_to", id)
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;

        setTasks(data ?? []);
      } catch (err) {
        console.error("Task loading error:", err);

        setError(
          err.message ||
            "Unable to load assigned tasks."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  // VERIFY THE CURRENT LOGIN SESSION
  useEffect(() => {
    let mounted = true;

    const initialise = async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          setError("Your session has expired. Please log in again.");
          setLoading(false);
          return;
        }

        if (!mounted) return;

        setUserId(user.id);

        await loadTasks({
          id: user.id,
        });
      } catch (err) {
        if (!mounted) return;

        setError(err.message || "Unable to verify your login.");
        setLoading(false);
      }
    };

    initialise();

    return () => {
      mounted = false;
    };
  }, [loadTasks]);

  // REFRESH WHEN THE ADMIN CHANGES TASK ASSIGNMENTS
  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`employee-tasks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${userId}`,
        },
        () => {
          loadTasks({
            quiet: true,
            id: userId,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadTasks]);

  // TASK COUNTS
  const counts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return {
      total: tasks.length,

      pending: tasks.filter(
        (task) => task.status === "pending"
      ).length,

      inProgress: tasks.filter(
        (task) => task.status === "in_progress"
      ).length,

      completed: tasks.filter(
        (task) => task.status === "completed"
      ).length,

      blocked: tasks.filter(
        (task) => task.status === "blocked"
      ).length,

      overdue: tasks.filter(
        (task) =>
          task.due_date &&
          task.due_date < today &&
          task.status !== "completed"
      ).length,
    };
  }, [tasks]);

  // SEARCH AND STATUS FILTER
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === "all" ||
        task.status === statusFilter;

      const searchableValues = [
        task.title,
        task.description,
        task.projects?.name,
        task.priority,
        STATUS_LABELS[task.status],
      ];

      const matchesSearch = searchableValues.some(
        (value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query)
      );

      return matchesStatus && matchesSearch;
    });
  }, [tasks, search, statusFilter]);

  // OPEN TASK UPDATE FORM
  const openUpdate = (task) => {
    setEditingTask(task);

    setUpdateForm({
      status: task.status || "pending",
      completion_note: task.completion_note || "",
      blocked_reason: task.blocked_reason || "",
    });

    setError("");
    setNotice("");
  };

  // SAVE TASK UPDATE THROUGH THE SECURE DATABASE FUNCTION
  const handleUpdateTask = async (event) => {
    event.preventDefault();

    if (!editingTask || !userId) return;

    if (
      updateForm.status === "blocked" &&
      !updateForm.blocked_reason.trim()
    ) {
      setError("Please provide a reason for blocking this task.");
      return;
    }

    if (
      updateForm.status === "completed" &&
      !updateForm.completion_note.trim()
    ) {
      setError("Please add a completion note before completing the task.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { data, error: updateError } = await supabase.rpc(
        "employee_update_task",
        {
          p_task_id: editingTask.id,
          p_status: updateForm.status,
          p_completion_note:
            updateForm.completion_note.trim() || null,
          p_blocked_reason:
            updateForm.status === "blocked"
              ? updateForm.blocked_reason.trim()
              : null,
        }
      );

      if (updateError) throw updateError;

      if (!data?.id) {
        throw new Error(
          "Task was not updated. Please check the database setup."
        );
      }

      setEditingTask(null);

      setNotice(
        `"${data.title}" updated to ${
          STATUS_LABELS[data.status] || data.status
        }.`
      );

      await loadTasks({
        quiet: true,
        id: userId,
      });
    } catch (err) {
      console.error("Task update error:", err);

      setError(err.message || "Unable to update task.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewAllTasks = () => {
    setActiveTab("My Tasks");
  };

  // PAGE CONTENT
  const renderContent = () => {
    if (activeTab === "My Tasks") {
      return (
        <>
          <section className="rounded-2xl border border-[#263750] bg-[#111F35] p-4 shadow-sm shadow-black/20 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your tasks..."
                className="w-full rounded-xl border border-[#30415A] bg-[#0D192B] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/10"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-[#30415A] bg-[#0D192B] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#1683FF]"
              >
                <option value="all">All statuses</option>

                {Object.entries(STATUS_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                onClick={() => loadTasks({ quiet: true })}
                disabled={refreshing}
                className="rounded-xl border border-[#1683FF]/30 px-4 py-2.5 text-sm font-semibold text-blue-400 hover:bg-[#1683FF]/10 disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </section>

          <TaskList
            tasks={filteredTasks}
            onUpdateStatus={openUpdate}
            showAll
          />
        </>
      );
    }

    if (activeTab === "My Progress") {
      return <Progress tasks={tasks} />;
    }

    return (
      <>
        <Overview
          employeeName={employeeName}
          tasks={tasks}
        />

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
          >
            {notice}
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
          <TaskList
            tasks={tasks}
            onViewAll={handleViewAllTasks}
            onUpdateStatus={openUpdate}
          />

          <div className="flex min-w-0 flex-col gap-5">
            <TaskSummary tasks={tasks} />

            <Progress tasks={tasks} />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#080F1C] text-slate-100 md:flex-row">
      <Sidebar
        employeeName={employeeName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
      />

      <main className="min-h-screen min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 xl:px-9 xl:py-8">
        <div className="mx-auto w-full max-w-[1600px]">
          <Header
            employeeName={employeeName}
            activeTab={activeTab}
            onOpenProfile={onOpenProfile}
          />

          <div className="flex flex-col gap-5 pt-5 sm:gap-7 sm:pt-7">
            {error && !editingTask && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-[#263750] bg-[#111F35] p-10 text-center text-sm text-slate-400 shadow-xl shadow-black/20">
                Loading your assigned tasks...
              </div>
            ) : error && tasks.length === 0 ? (
              <div className="rounded-2xl border border-red-400/20 bg-[#111F35] p-8 text-center">
                <p className="text-sm text-slate-300">
                  Your tasks could not be loaded.
                </p>

                <button
                  type="button"
                  onClick={() => loadTasks()}
                  className="mt-4 rounded-lg bg-[#1683FF] px-4 py-2 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {notice && activeTab !== "Overview" && (
                  <div
                    role="status"
                    className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
                  >
                    {notice}
                  </div>
                )}

                {renderContent()}

                {activeTab === "Overview" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <span>
                      {counts.total} assigned · {counts.pending} to do ·{" "}
                      {counts.inProgress} in progress · {counts.completed} completed ·{" "}
                      {counts.blocked} blocked · {counts.overdue} overdue
                    </span>

                    <button
                      type="button"
                      onClick={() => loadTasks({ quiet: true })}
                      disabled={refreshing}
                      className="rounded-lg border border-[#30415A] bg-[#111F35] px-3 py-2 font-semibold text-slate-300 hover:bg-[#172B46] disabled:opacity-60"
                    >
                      {refreshing ? "Refreshing..." : "Refresh tasks"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setEditingTask(null);
            }
          }}
        >
          <form
            onSubmit={handleUpdateTask}
            className="my-auto w-full max-w-xl rounded-2xl border border-[#30415A] bg-[#111F35] p-5 shadow-2xl shadow-black/40 sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#1683FF]">
                  Task update
                </p>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  {editingTask.title}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {editingTask.projects?.name || "Assigned task"} · Due{" "}
                  {formatDate(editingTask.due_date)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingTask(null)}
                disabled={saving}
                className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-[#263750]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-300">
                Task status
              </span>

              <select
                value={updateForm.status}
                onChange={(event) =>
                  setUpdateForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#30415A] bg-[#0D192B] px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-[#1683FF]"
              >
                <option value="pending">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>

            {updateForm.status === "completed" && (
              <label className="mb-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-300">
                  Completion note *
                </span>

                <textarea
                  required
                  rows={3}
                  value={updateForm.completion_note}
                  onChange={(event) =>
                    setUpdateForm((current) => ({
                      ...current,
                      completion_note: event.target.value,
                    }))
                  }
                  placeholder="Summarize what you completed..."
                  className="w-full resize-y rounded-xl border border-[#30415A] bg-[#0D192B] px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[#1683FF]"
                />
              </label>
            )}

            {updateForm.status === "blocked" && (
              <label className="mb-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-300">
                  Blocked reason *
                </span>

                <textarea
                  required
                  rows={3}
                  value={updateForm.blocked_reason}
                  onChange={(event) =>
                    setUpdateForm((current) => ({
                      ...current,
                      blocked_reason: event.target.value,
                    }))
                  }
                  placeholder="Describe the blocker or help you need..."
                  className="w-full resize-y rounded-xl border border-[#30415A] bg-[#0D192B] px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[#1683FF]"
                />
              </label>
            )}

            {updateForm.status !== "completed" &&
              updateForm.status !== "blocked" && (
                <label className="mb-4 block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-300">
                    Work note (optional)
                  </span>

                  <textarea
                    rows={2}
                    value={updateForm.completion_note}
                    onChange={(event) =>
                      setUpdateForm((current) => ({
                        ...current,
                        completion_note: event.target.value,
                      }))
                    }
                    placeholder="Add an update for your admin..."
                    className="w-full resize-y rounded-xl border border-[#30415A] bg-[#0D192B] px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[#1683FF]"
                  />
                </label>
              )}

            <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                disabled={saving}
                className="rounded-xl border border-[#30415A] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-[#172B46]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#1683FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save task update"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;