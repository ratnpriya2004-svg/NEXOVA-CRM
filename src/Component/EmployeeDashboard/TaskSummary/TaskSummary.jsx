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

  // Compare calendar dates without time-related errors.
  const getDateOnly = (value) => {
    if (!value) return null;

    const date = new Date(
      `${String(value).slice(0, 10)}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) return null;

    return date.getTime();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((task) => {
    if (
      !task.due_date ||
      task.status?.toLowerCase() === "completed"
    ) {
      return false;
    }

    const dueDate = getDateOnly(task.due_date);

    return dueDate !== null && dueDate < today.getTime();
  }).length;

  const completionPercentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const summaryItems = [
    {
      label: "Completed",
      count: completedTasks,
      dotColor: "bg-emerald-400",
      textColor: "text-emerald-400",
      trackColor: "bg-emerald-400",
      borderColor: "border-emerald-400/10",
    },
    {
      label: "In Progress",
      count: inProgressTasks,
      dotColor: "bg-violet-400",
      textColor: "text-violet-300",
      trackColor: "bg-violet-400",
      borderColor: "border-violet-400/10",
    },
    {
      label: "Pending",
      count: pendingTasks,
      dotColor: "bg-amber-400",
      textColor: "text-amber-400",
      trackColor: "bg-amber-400",
      borderColor: "border-amber-400/10",
    },
    {
      label: "Blocked",
      count: blockedTasks,
      dotColor: "bg-red-400",
      textColor: "text-red-400",
      trackColor: "bg-red-400",
      borderColor: "border-red-400/10",
    },
    {
      label: "Overdue",
      count: overdueTasks,
      dotColor: "bg-orange-400",
      textColor: "text-orange-400",
      trackColor: "bg-orange-400",
      borderColor: "border-orange-400/10",
    },
  ];

  return (
    <section className="box-border w-full min-w-0 overflow-hidden rounded-2xl border border-[#263750] bg-[#0D1728] shadow-lg shadow-black/10">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 border-b border-[#263750] p-5 sm:p-6">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1683ff] shadow-[0_0_10px_rgba(22,131,255,0.6)]" />

            <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#1683ff]">
              Analytics
            </span>
          </div>

          <h3 className="font-['IBM_Plex_Serif',serif] text-xl font-semibold text-white sm:text-2xl">
            Task Summary
          </h3>

          <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
            Track your work and monitor your daily progress.
          </p>
        </div>

        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#1683ff]/20 bg-[#1683ff]/10 text-xl text-[#5da8ff]">
          ▤
        </div>
      </div>

      <div className="p-4 sm:p-6">

        {/* OVERALL COMPLETION */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1683ff]/20 bg-gradient-to-br from-[#142744] to-[#101C30] p-5 sm:p-6">

          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#1683ff]/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Overall Completion
                </p>

                <h2 className="mt-3 font-['IBM_Plex_Serif',serif] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {completionPercentage}
                  <span className="ml-1 text-2xl text-[#5da8ff]">
                    %
                  </span>
                </h2>

                <p className="mt-3 text-xs text-slate-400">
                  {completedTasks} of {totalTasks} tasks completed
                </p>
              </div>

              <div className="grid h-12 w-12 place-items-center rounded-xl border border-[#1683ff]/20 bg-[#1683ff]/10 text-xl text-[#5da8ff] sm:h-14 sm:w-14 sm:text-2xl">
                ↗
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div
              className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-[#263750]"
              role="progressbar"
              aria-valuenow={completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall task completion"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1683ff] to-emerald-400 transition-all duration-700 ease-out"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-500">
                Task completion rate
              </span>

              <span className="text-[10px] font-semibold text-[#5da8ff]">
                {completionPercentage === 100
                  ? "All tasks completed!"
                  : `${totalTasks - completedTasks} tasks remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* STATUS BREAKDOWN */}
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-100">
              Status Breakdown
            </h4>

            <span className="rounded-lg border border-[#263750] bg-[#111F35] px-2.5 py-1.5 text-[10px] text-slate-400">
              {totalTasks} Total
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {summaryItems.map((item) => {
              const percentage =
                totalTasks > 0
                  ? Math.round((item.count / totalTasks) * 100)
                  : 0;

              return (
                <div
                  key={item.label}
                  className={`rounded-xl border ${item.borderColor} bg-[#111F35] p-4 transition-colors duration-200 hover:bg-[#14223A]`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`h-9 w-1 shrink-0 rounded-full ${item.trackColor}`}
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${item.dotColor}`}
                          />

                          <span className="text-xs font-medium text-slate-300">
                            {item.label}
                          </span>
                        </div>

                        <p className="mt-1 text-[10px] text-slate-500">
                          {percentage}% of total tasks
                        </p>
                      </div>
                    </div>

                    <strong
                      className={`shrink-0 text-xl font-bold ${item.textColor}`}
                    >
                      {String(item.count).padStart(2, "0")}
                    </strong>
                  </div>

                  {/* INDIVIDUAL STATUS BAR */}
                  <div className="ml-4 mt-3 h-1.5 overflow-hidden rounded-full bg-[#263750]">
                    <div
                      className={`h-full rounded-full ${item.trackColor} transition-all duration-500`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* EMPTY STATE */}
        {totalTasks === 0 && (
          <div className="mt-5 rounded-xl border border-dashed border-[#34445D] bg-[#111F35]/60 px-4 py-6 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-[#1683ff]/20 bg-[#1683ff]/10 text-xl text-[#5da8ff]">
              ▤
            </div>

            <h4 className="mt-3 text-sm font-semibold text-white">
              No tasks assigned yet
            </h4>

            <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-400">
              Your task statistics will appear here when tasks are assigned
              to your workspace.
            </p>
          </div>
        )}

        {/* FOOTER */}
        {totalTasks > 0 && (
          <div className="mt-5 flex items-center gap-2 border-t border-[#263750] pt-4">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <p className="text-[10px] leading-relaxed text-slate-400 sm:text-xs">
              Your task summary updates automatically when the supplied task
              data changes.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TaskSummary;