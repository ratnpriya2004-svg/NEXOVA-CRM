import React from "react";

const TaskList = ({
  tasks = [],
  onViewAll,
  onUpdateStatus,
  showAll = false,
}) => {
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-[#eaf8f0] text-[#219565]";

      case "in progress":
      case "in_progress":
        return "bg-[#f0edff] text-[#8065d8]";

      case "blocked":
        return "bg-[#fff0ef] text-[#dc5c54]";

      case "on_hold":
      case "on hold":
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-[#fff5e7] text-[#d28a28]";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-[#fff0ef] text-[#dc5c54]";

      case "medium":
        return "bg-[#fff5e6] text-[#d38b27]";

      default:
        return "bg-[#eaf8f0] text-[#279565]";
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return null;

    const date = new Date(
      `${String(dateValue).slice(0, 10)}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

  const visibleTasks = showAll ? tasks : tasks.slice(0, 4);

  return (
    <section className="box-border w-full rounded-2xl border border-[#e9edf3] bg-white p-[18px] sm:p-6">
      {/* HEADER */}
      <div className="mb-[22px] flex items-start justify-between gap-3 sm:gap-[15px]">
        <div>
          <h3 className="font-['IBM_Plex_Serif',serif] text-xl font-semibold text-[#202a3b]">
            My Tasks
          </h3>

          <p className="mt-[7px] text-xs leading-relaxed text-[#8992a2]">
            Keep an eye on your assigned work.
          </p>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#e0ebfa] bg-[#f5f9ff] px-3 py-[9px] text-[11px] font-semibold text-[#1683ff] transition-colors duration-200 hover:bg-[#eaf3ff]"
          >
            View all <span className="text-sm">↗</span>
          </button>
        )}
      </div>

      {/* TASK LIST */}
      {visibleTasks.length > 0 ? (
        <div className="flex flex-col">
          {visibleTasks.map((task, index) => {
            const isCompleted =
              task.status?.toLowerCase() === "completed";

            const dueDate = task.due_date;
            const isOverdue =
              dueDate &&
              dueDate.slice(0, 10) <
                new Date().toLocaleDateString("en-CA") &&
              !isCompleted;

            return (
              <article
                key={task.id ?? `${task.title}-${index}`}
                className={`flex flex-col items-start gap-[13px] border-b border-[#eef1f5] py-[18px] first:pt-0 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-[18px] ${
                  index === visibleTasks.length - 1 ? "pb-0" : ""
                }`}
              >
                {/* TASK INFORMATION */}
                <div className="flex min-w-0 items-start gap-3 sm:gap-[14px]">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[#e6edf7] bg-[#f5f8fd] text-[11px] font-semibold text-[#8492a7]">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0">
                    <h4 className="mb-[7px] mt-px break-words text-[13px] font-semibold text-[#273247] [overflow-wrap:anywhere]">
                      {task.title}
                    </h4>

                    <p className="break-words text-[11px] leading-[1.7] text-[#8993a4] [overflow-wrap:anywhere]">
                      {task.description || "No description available."}
                    </p>

                    {task.projects?.name && (
                      <p className="mt-1 text-[10px] text-[#7d8798]">
                        Project: {task.projects.name}
                      </p>
                    )}

                    <div className="mt-[11px] flex flex-wrap items-center gap-[9px]">
                      <span
                        className={`rounded-[5px] px-2 py-[5px] text-[9px] font-semibold ${getPriorityStyle(
                          task.priority
                        )}`}
                      >
                        {task.priority || "Low"} priority
                      </span>

                      {dueDate && (
                        <span
                          className={`text-[10px] ${
                            isOverdue
                              ? "font-semibold text-red-600"
                              : "text-[#929bad]"
                          }`}
                        >
                          {isOverdue ? "Overdue: " : "Due: "}
                          {formatDate(dueDate)}
                        </span>
                      )}
                    </div>

                    {task.status?.toLowerCase() === "blocked" &&
                      task.blocked_reason && (
                        <p className="mt-2 break-words text-[11px] text-red-600">
                          Reason: {task.blocked_reason}
                        </p>
                      )}

                    {isCompleted && task.completion_note && (
                      <p className="mt-2 break-words text-[11px] text-emerald-700">
                        Completion note: {task.completion_note}
                      </p>
                    )}
                  </div>
                </div>

                {/* TASK ACTIONS */}
                <div className="flex shrink-0 flex-wrap items-center gap-[9px] pl-[50px] sm:flex-col sm:items-end sm:pl-0">
                  <span
                    className={`inline-flex items-center gap-[6px] whitespace-nowrap rounded-md px-[9px] py-[7px] text-[10px] font-semibold before:h-[6px] before:w-[6px] before:shrink-0 before:rounded-full before:bg-current before:content-[''] ${getStatusStyle(
                      task.status
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>

                  {onUpdateStatus && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(task)}
                      className="rounded-md border border-[#dceaff] bg-white px-[10px] py-[6px] text-[10px] font-semibold text-[#1683ff] transition-colors hover:bg-[#f0f6ff]"
                      aria-label={`Update status of ${task.title}`}
                    >
                      Update
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center px-[15px] py-[35px] text-center">
          <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#f0f6ff] text-[23px] text-[#1683ff]">
            ▤
          </div>

          <h4 className="mb-[6px] mt-[15px] text-sm font-semibold text-[#273247]">
            No tasks yet
          </h4>

          <p className="text-xs text-[#8993a4]">
            Your assigned tasks will appear here.
          </p>
        </div>
      )}

      {/* VIEW ALL */}
      {!showAll && tasks.length > 4 && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-[15px] flex w-full items-center justify-center gap-[9px] rounded-[9px] border border-[#e8edf4] bg-[#fafcff] p-3 text-[11px] font-semibold text-[#64738a] transition-colors hover:border-[#cfe2ff] hover:text-[#1683ff]"
        >
          View all {tasks.length} tasks <span>→</span>
        </button>
      )}
    </section>
  );
};

export default TaskList;