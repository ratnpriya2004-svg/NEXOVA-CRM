import React from "react";

const TaskSummary = ({ tasks = [] }) => {
  const totalTasks = tasks.length;

  const getCount = (status) =>
    tasks.filter(
      (task) => task.status?.toLowerCase() === status
    ).length;

  const completedTasks = getCount("completed");
  const pendingTasks = getCount("pending");
  const blockedTasks = getCount("blocked");

  const inProgressTasks = tasks.filter((task) =>
    ["in_progress", "in progress"].includes(
      task.status?.toLowerCase()
    )
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((task) => {
    if (
      !task.due_date ||
      task.status?.toLowerCase() === "completed"
    ) {
      return false;
    }

    const dueDate = new Date(
      `${String(task.due_date).slice(0, 10)}T00:00:00`
    );

    return !Number.isNaN(dueDate.getTime()) && dueDate < today;
  }).length;

  const completionPercentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const summaryItems = [
    {
      label: "Completed",
      count: completedTasks,
      color: "bg-[#22b573]",
      textColor: "text-[#219565]",
    },
    {
      label: "In Progress",
      count: inProgressTasks,
      color: "bg-[#8a70e8]",
      textColor: "text-[#8065d8]",
    },
    {
      label: "Pending",
      count: pendingTasks,
      color: "bg-[#efa43b]",
      textColor: "text-[#d28a28]",
    },
    {
      label: "Blocked",
      count: blockedTasks,
      color: "bg-[#e85d5d]",
      textColor: "text-[#dc5c54]",
    },
    {
      label: "Overdue",
      count: overdueTasks,
      color: "bg-[#f97316]",
      textColor: "text-[#ea580c]",
    },
  ];

  return (
    <section className="box-border w-full rounded-2xl border border-[#e9edf3] bg-white p-[19px] sm:p-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-['IBM_Plex_Serif',serif] text-[19px] font-semibold text-[#202a3b]">
            Task Summary
          </h3>

          <p className="mt-[7px] text-xs leading-relaxed text-[#8992a2]">
            Track your work at a glance.
          </p>
        </div>

        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] border border-[#e1edff] bg-[#eff6ff] text-[19px] text-[#1683ff]">
          ▤
        </span>
      </div>

      {/* OVERALL COMPLETION */}
      <div className="mt-7 rounded-xl border border-[#edf1f6] bg-[#fafcff] p-[15px] sm:p-[19px]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-[11px] text-[#7d899b]">
              Overall completion
            </span>

            <h2 className="mt-2 font-['IBM_Plex_Serif',serif] text-[28px] font-semibold leading-[1.2] text-[#172033] sm:text-[32px]">
              {completionPercentage}%
            </h2>
          </div>

          <span className="pb-1 text-right text-[10px] text-[#8a94a5]">
            {completedTasks} of {totalTasks} tasks
          </span>
        </div>

        <div
          className="mt-[19px] h-[7px] w-full overflow-hidden rounded-[20px] bg-[#e8eef7]"
          role="progressbar"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall task completion"
        >
          <span
            className="block h-full rounded-[20px] bg-gradient-to-r from-[#1683ff] to-[#58a5ff] transition-all duration-300 ease-in-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* TASK STATUS BREAKDOWN */}
      <div className="mt-[18px] flex flex-col">
        {summaryItems.map((item) => (
          <div
            className="flex items-center justify-between gap-3 border-b border-[#f0f2f6] px-[2px] py-[15px] last:border-b-0"
            key={item.label}
          >
            <div className="flex items-center gap-[10px] text-xs text-[#687488]">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${item.color}`}
              />

              <span>{item.label}</span>
            </div>

            <strong
              className={`text-[13px] font-semibold ${item.textColor}`}
            >
              {String(item.count).padStart(2, "0")}
            </strong>
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {totalTasks === 0 && (
        <p className="mt-3 text-[11px] leading-[1.7] text-[#8b95a5]">
          No tasks assigned yet. Your summary will appear here.
        </p>
      )}
    </section>
  );
};

export default TaskSummary;