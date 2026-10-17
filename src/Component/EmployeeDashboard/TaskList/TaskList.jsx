import React, { useEffect, useState } from "react";

const TaskList = ({
  tasks = [],
  onViewAll,
  onUpdateStatus,
  showAll = false,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const handleTaskFilter = (event) => {
      setActiveFilter(event.detail?.status || "all");

      // Scroll after React has applied the filter.
      requestAnimationFrame(() => {
        document.getElementById("employee-task-list")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    };

    window.addEventListener("employee-task-filter", handleTaskFilter);

    return () => {
      window.removeEventListener("employee-task-filter", handleTaskFilter);
    };
  }, []);

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";

      case "in progress":
      case "in_progress":
        return "border-violet-400/20 bg-violet-400/10 text-violet-300";

      case "blocked":
        return "border-red-400/20 bg-red-400/10 text-red-400";

      case "on_hold":
      case "on hold":
        return "border-slate-500/20 bg-slate-500/10 text-slate-400";

      default:
        return "border-amber-400/20 bg-amber-400/10 text-amber-400";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "border-red-400/20 bg-red-400/10 text-red-400";

      case "medium":
        return "border-amber-400/20 bg-amber-400/10 text-amber-400";

      default:
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "To Do",
      in_progress: "In Progress",
      completed: "Completed",
      blocked: "Blocked",
      on_hold: "On Hold",
    };

    return labels[status?.toLowerCase()] || status || "Pending";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return null;

    const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "Not available";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);
    return date.toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getDateOnly = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue).slice(0, 10);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getTaskInitials = (title) => {
    if (!title) return "TS";

    return title
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const getTaskAccent = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-400";

      case "in_progress":
      case "in progress":
        return "bg-violet-400";

      case "blocked":
        return "bg-red-400";

      default:
        return "bg-[#1683ff]";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const status = task.status?.toLowerCase() || "pending";

    switch (activeFilter) {
      case "pending":
        return status === "pending";

      case "in_progress":
        return ["in_progress", "in progress"].includes(status);

      case "completed":
        return status === "completed";

      case "blocked":
        return status === "blocked";

      case "overdue":
        return Boolean(
          task.due_date &&
          getDateOnly(task.due_date) < getDateOnly(new Date()) &&
          status !== "completed"
        );

      case "all":
      default:
        return true;
    }
  });

  const visibleTasks = showAll
    ? filteredTasks
    : filteredTasks.slice(0, 4);

  const completedCount = tasks.filter(
    (task) => task.status?.toLowerCase() === "completed"
  ).length;

  const pendingCount = tasks.filter(
    (task) => task.status?.toLowerCase() === "pending"
  ).length;

  const inProgressCount = tasks.filter(
    (task) =>
      task.status?.toLowerCase() === "in_progress" ||
      task.status?.toLowerCase() === "in progress"
  ).length;

  const overdueCount = tasks.filter((task) => {
    const status = task.status?.toLowerCase();

    return (
      task.due_date &&
      getDateOnly(task.due_date) < getDateOnly(new Date()) &&
      status !== "completed"
    );
  }).length;

  return (
    <section id="employee-task-list" className="box-border w-full min-w-0 scroll-mt-6 overflow-hidden rounded-2xl border border-[#263750] bg-[#0D1728] shadow-lg shadow-black/10">
      {/* HEADER */}
      <div className="flex flex-col gap-5 border-b border-[#263750] p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1683ff] shadow-[0_0_10px_rgba(22,131,255,0.7)]" />

              <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#1683ff]">
                Workspace
              </span>
            </div>

            <h3 className="font-['IBM_Plex_Serif',serif] text-xl font-semibold text-white sm:text-2xl">
              My Tasks
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Keep track of your assignments and daily progress.
            </p>

            {activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  window.dispatchEvent(
                    new CustomEvent("employee-task-filter", {
                      detail: { status: "all" },
                    })
                  );
                }}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#1683ff]/30 bg-[#1683ff]/10 px-3 py-2 text-xs font-medium text-[#5da8ff] transition-colors hover:bg-[#1683ff]/20"
              >
                Showing: {activeFilter === "in_progress"
                  ? "In Progress"
                  : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                <span aria-hidden="true">✕</span>
                <span>Clear filter</span>
              </button>
            )}
          </div>

          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#1683ff]/30 bg-[#1683ff]/10 px-3 py-2.5 text-xs font-semibold text-[#5da8ff] transition-all duration-200 hover:border-[#1683ff]/60 hover:bg-[#1683ff]/20"
            >
              View all
              <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>

        {/* TASK OVERVIEW */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#263750] bg-[#111F35] p-3">
            <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
              Total Tasks
            </p>
            <p className="mt-2 text-xl font-bold text-white">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-3">
            <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
              Completed
            </p>
            <p className="mt-2 text-xl font-bold text-emerald-400">
              {completedCount}
            </p>
          </div>

          <div className="rounded-xl border border-violet-400/10 bg-violet-400/[0.04] p-3">
            <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
              In Progress
            </p>
            <p className="mt-2 text-xl font-bold text-violet-300">
              {inProgressCount}
            </p>
          </div>

          <div className="rounded-xl border border-red-400/10 bg-red-400/[0.04] p-3">
            <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
              Overdue
            </p>
            <p className="mt-2 text-xl font-bold text-red-400">
              {overdueCount}
            </p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        {tasks.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Overall completion
              </span>

              <span className="text-xs font-semibold text-white">
                {Math.round((completedCount / tasks.length) * 100)}%
              </span>
            </div>

            <div
              className="h-2 overflow-hidden rounded-full bg-[#263750]"
              role="progressbar"
              aria-label="Task completion progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(
                (completedCount / tasks.length) * 100
              )}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1683ff] to-emerald-400 transition-all duration-500"
                style={{
                  width: `${(completedCount / tasks.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* TASK LIST */}
      {visibleTasks.length > 0 ? (
        <div className="p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <h4 className="text-xs font-semibold text-slate-200 sm:text-sm">
              {activeFilter === "all"
                ? (showAll ? "All Assigned Tasks" : "Recent Tasks")
                : `${activeFilter === "in_progress"
                    ? "In Progress"
                    : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Tasks`}
            </h4>

            <span className="text-[10px] text-slate-500 sm:text-xs">
              Showing {visibleTasks.length} of {filteredTasks.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {visibleTasks.map((task, index) => {
              const status = task.status?.toLowerCase();
              const isCompleted = status === "completed";
              const isBlocked = status === "blocked";

              const isOverdue =
                task.due_date &&
                getDateOnly(task.due_date) < getDateOnly(new Date()) &&
                !isCompleted;

              return (
                <article
                  key={task.id ?? `${task.title}-${index}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTask(task)}
                  onKeyDown={(event) => {
                    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      setSelectedTask(task);
                    }
                  }}
                  aria-label={`View details for ${task.title || "task"}`}
                  className="group relative min-w-0 cursor-pointer overflow-hidden rounded-xl border border-[#263750] bg-[#111F35] transition-all duration-200 hover:border-[#1683ff]/50 hover:bg-[#13233C] focus:outline-none focus:ring-2 focus:ring-[#1683ff]/40"
                >
                  {/* STATUS ACCENT */}
                  <div
                    className={`absolute bottom-0 left-0 top-0 w-[3px] ${getTaskAccent(
                      task.status
                    )}`}
                  />

                  <div className="flex min-w-0 flex-col gap-4 p-4 pl-5 sm:p-5 sm:pl-6 md:flex-row md:items-start md:justify-between">
                    {/* TASK DETAILS */}
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#1683ff]/20 bg-[#1683ff]/10 text-xs font-bold text-[#5da8ff]">
                        {getTaskInitials(task.title)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="break-words text-sm font-semibold leading-relaxed text-slate-100 [overflow-wrap:anywhere] sm:text-[15px]">
                            {task.title || "Untitled Task"}
                          </h4>

                          {isOverdue && (
                            <span className="rounded-md border border-red-400/20 bg-red-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-red-400">
                              Overdue
                            </span>
                          )}
                        </div>

                        <p className="mt-2 break-words text-xs leading-6 text-slate-400 [overflow-wrap:anywhere]">
                          {task.description || "No description available."}
                        </p>

                        {task.projects?.name && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span className="text-[#5da8ff]">↗</span>
                            <span>Project:</span>
                            <span className="break-words font-medium text-slate-300">
                              {task.projects.name}
                            </span>
                          </div>
                        )}

                        {/* PRIORITY + DEADLINE */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-semibold ${getPriorityStyle(
                              task.priority
                            )}`}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-current"
                              aria-hidden="true"
                            />

                            {(task.priority || "Low").toUpperCase()}
                          </span>

                          {task.due_date && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] ${
                                isOverdue
                                  ? "border-red-400/20 bg-red-400/10 font-semibold text-red-400"
                                  : "border-[#263750] bg-[#0D1728] text-slate-400"
                              }`}
                            >
                              <span aria-hidden="true">◷</span>
                              {isOverdue ? "Due: " : "Deadline: "}
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>

                        {/* BLOCKED REASON */}
                        {isBlocked && task.blocked_reason && (
                          <div className="mt-4 rounded-lg border border-red-400/15 bg-red-400/[0.06] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                              Blocked reason
                            </p>

                            <p className="mt-1 break-words text-xs leading-5 text-slate-300">
                              {task.blocked_reason}
                            </p>
                          </div>
                        )}

                        {/* COMPLETION NOTE */}
                        {isCompleted && task.completion_note && (
                          <div className="mt-4 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.05] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                              ✓ Completion note
                            </p>

                            <p className="mt-1 break-words text-xs leading-5 text-slate-300">
                              {task.completion_note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TASK ACTIONS */}
                    <div className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-3 border-t border-[#263750] pt-3 md:min-w-[130px] md:flex-col md:items-end md:justify-start md:border-t-0 md:pt-0">
                      <span
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-semibold ${getStatusStyle(
                          task.status
                        )}`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-current"
                          aria-hidden="true"
                        />
                        {getStatusLabel(task.status)}
                      </span>

                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); setSelectedTask(task); }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#263750] bg-[#0D1728] px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-[#1683ff]/40 hover:text-[#5da8ff]"
                      >
                        View details <span aria-hidden="true">↗</span>
                      </button>

                      {onUpdateStatus && !isCompleted && (
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); onUpdateStatus(task); }}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1683ff]/30 bg-[#1683ff]/10 px-3.5 py-2 text-xs font-semibold text-[#5da8ff] transition-all duration-200 hover:border-[#1683ff]/60 hover:bg-[#1683ff]/20 focus:outline-none focus:ring-2 focus:ring-[#1683ff]/40"
                          aria-label={`Update status of ${task.title}`}
                        >
                          Update status
                          <span aria-hidden="true">→</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!showAll && filteredTasks.length > 4 && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#263750] bg-[#111F35] p-3.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:border-[#1683ff]/40 hover:bg-[#1683ff]/10 hover:text-[#5da8ff]"
            >
              View all {filteredTasks.length} tasks
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="flex flex-col items-center px-5 py-12 text-center sm:py-16">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#1683ff]/20 bg-[#1683ff]/10 text-2xl text-[#5da8ff]">
            ▤
          </div>

          <h4 className="mt-5 text-sm font-semibold text-white sm:text-base">
            {activeFilter !== "all"
              ? `No ${activeFilter === "in_progress" ? "in progress" : activeFilter} tasks found`
              : showAll
                ? "No tasks available"
                : "No tasks yet"}
          </h4>

          <p className="mt-2 max-w-xs text-xs leading-6 text-slate-400">
            Your assigned tasks will appear here once they are added to your
            workspace.
          </p>

          {pendingCount > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              You have {pendingCount} pending tasks.
            </p>
          )}
        </div>
      )}

      {selectedTask && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTask(null); }}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#263750] bg-[#0D1728] shadow-2xl shadow-black/40"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#263750] bg-[#0D1728]/95 p-5 backdrop-blur sm:p-6">
              <div className="min-w-0">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#1683ff]">Task details</p>
                <h2 id="task-detail-title" className="break-words font-['IBM_Plex_Serif',serif] text-xl font-semibold text-white sm:text-2xl">{selectedTask.title || "Untitled Task"}</h2>
                <p className="mt-2 text-xs text-slate-400">Review the complete task information below.</p>
              </div>
              <button type="button" onClick={() => setSelectedTask(null)} aria-label="Close task details" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#263750] bg-[#111F35] text-lg text-slate-300 hover:border-[#1683ff]/50 hover:text-white">×</button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-lg border px-3 py-2 text-xs font-semibold ${getStatusStyle(selectedTask.status)}`}>{getStatusLabel(selectedTask.status)}</span>
                <span className={`inline-flex items-center rounded-lg border px-3 py-2 text-xs font-semibold ${getPriorityStyle(selectedTask.priority)}`}>{(selectedTask.priority || "Low").toUpperCase()} PRIORITY</span>
                {selectedTask.due_date && getDateOnly(selectedTask.due_date) < getDateOnly(new Date()) && selectedTask.status?.toLowerCase() !== "completed" && <span className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-400">OVERDUE</span>}
              </div>

              <div className="rounded-xl border border-[#263750] bg-[#111F35] p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Task description</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">{selectedTask.description || "No description provided."}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#263750] bg-[#111F35] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project</p><p className="mt-2 break-words text-sm font-medium text-slate-100">{selectedTask.projects?.name || "Not assigned to a project"}</p></div>
                <div className="rounded-xl border border-[#263750] bg-[#111F35] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Due date</p><p className="mt-2 text-sm font-medium text-slate-100">{formatDate(selectedTask.due_date) || "No due date set"}</p></div>
                <div className="rounded-xl border border-[#263750] bg-[#111F35] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Created on</p><p className="mt-2 text-sm font-medium text-slate-100">{formatDateTime(selectedTask.created_at)}</p></div>
                <div className="rounded-xl border border-[#263750] bg-[#111F35] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed on</p><p className="mt-2 text-sm font-medium text-slate-100">{selectedTask.completed_at ? formatDateTime(selectedTask.completed_at) : "Not completed yet"}</p></div>
              </div>

              {selectedTask.status?.toLowerCase() === "blocked" && <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4"><p className="text-xs font-bold uppercase tracking-wider text-red-400">Blocked reason</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{selectedTask.blocked_reason || "No reason added."}</p></div>}
              {selectedTask.status?.toLowerCase() === "completed" && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Completion note / work done</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{selectedTask.completion_note || "No completion note added."}</p></div>}

              <div className="flex flex-col-reverse gap-3 border-t border-[#263750] pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setSelectedTask(null)} className="min-h-11 rounded-xl border border-[#263750] bg-[#111F35] px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white">Close</button>
                {onUpdateStatus && selectedTask.status?.toLowerCase() !== "completed" && <button type="button" onClick={() => { const task = selectedTask; setSelectedTask(null); onUpdateStatus(task); }} className="min-h-11 rounded-xl bg-[#1683ff] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500">Update task status →</button>}
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

export default TaskList;