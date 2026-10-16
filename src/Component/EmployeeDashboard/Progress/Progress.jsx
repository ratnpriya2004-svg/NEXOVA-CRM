import React from "react";

const Progress = ({ tasks = [] }) => {
  const totalTasks = tasks.length;

  const countStatus = (status) =>
    tasks.filter(
      (task) => task.status?.toLowerCase() === status
    ).length;

  const completedTasks = countStatus("completed");
  const pendingTasks = countStatus("pending");
  const blockedTasks = countStatus("blocked");

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

  const statusItems = [
    {
      label: "Completed",
      count: completedTasks,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
    },
    {
      label: "In Progress",
      count: inProgressTasks,
      color: "bg-violet-500",
      textColor: "text-violet-600",
    },
    {
      label: "Pending",
      count: pendingTasks,
      color: "bg-amber-500",
      textColor: "text-amber-600",
    },
    {
      label: "Blocked",
      count: blockedTasks,
      color: "bg-red-500",
      textColor: "text-red-600",
    },
    {
      label: "Overdue",
      count: overdueTasks,
      color: "bg-orange-500",
      textColor: "text-orange-600",
    },
  ];

  return (
    <section className="flex flex-col gap-5">
      {/* PAGE HEADER */}
      <div>
        <h2 className="font-['IBM_Plex_Serif',serif] text-2xl font-semibold text-[#202a3b]">
          My Progress
        </h2>

        <p className="mt-2 text-sm text-[#8992a2]">
          Track your completed work, active tasks, and deadlines.
        </p>
      </div>

      {/* COMPLETION OVERVIEW */}
      <div className="rounded-2xl border border-[#e9edf3] bg-white p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-medium text-[#8992a2]">
              Overall Completion
            </p>

            <h3 className="mt-2 text-4xl font-semibold text-[#172033]">
              {completionPercentage}%
            </h3>

            <p className="mt-2 text-sm text-[#8992a2]">
              {completedTasks} of {totalTasks} assigned tasks completed
            </p>
          </div>

          <div className="grid h-24 w-24 shrink-0 place-items-center self-center rounded-full border-[7px] border-[#eaf3ff] sm:self-auto">
            <div className="text-center">
              <span className="text-xl font-bold text-[#1683ff]">
                {completionPercentage}%
              </span>

              <p className="text-[9px] text-[#8992a2]">Complete</p>
            </div>
          </div>
        </div>

        <div
          className="mt-6 h-3 overflow-hidden rounded-full bg-[#e8eef7]"
          role="progressbar"
          aria-label="Overall task completion"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1683ff] to-[#58a5ff] transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* TASK STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Tasks",
            count: totalTasks,
            color: "text-blue-600",
            background: "bg-blue-50",
          },
          {
            label: "Completed",
            count: completedTasks,
            color: "text-emerald-600",
            background: "bg-emerald-50",
          },
          {
            label: "In Progress",
            count: inProgressTasks,
            color: "text-violet-600",
            background: "bg-violet-50",
          },
          {
            label: "Pending",
            count: pendingTasks,
            color: "text-amber-600",
            background: "bg-amber-50",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-[#e9edf3] bg-white p-5"
          >
            <div
              className={`grid h-10 w-10 place-items-center rounded-xl ${item.background} ${item.color}`}
            >
              <span className="text-lg font-bold">▤</span>
            </div>

            <p className="mt-4 text-xs text-[#8992a2]">
              {item.label}
            </p>

            <h3 className="mt-1 text-2xl font-semibold text-[#202a3b]">
              {item.count}
            </h3>
          </article>
        ))}
      </div>

      {/* STATUS BREAKDOWN */}
      <div className="rounded-2xl border border-[#e9edf3] bg-white p-5 sm:p-6">
        <h3 className="font-['IBM_Plex_Serif',serif] text-lg font-semibold text-[#202a3b]">
          Task Status Breakdown
        </h3>

        <p className="mt-1 text-xs text-[#8992a2]">
          Current status of your assigned tasks.
        </p>

        <div className="mt-5 flex flex-col gap-5">
          {statusItems.map((item) => {
            const percentage =
              totalTasks > 0
                ? Math.round((item.count / totalTasks) * 100)
                : 0;

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#566176]">
                    {item.label}
                  </span>

                  <span className={`text-sm font-semibold ${item.textColor}`}>
                    {item.count}
                    <span className="ml-2 text-xs font-normal text-[#8992a2]">
                      {percentage}%
                    </span>
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#edf1f7]">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COMPLETED TASK HISTORY */}
      <div className="rounded-2xl border border-[#e9edf3] bg-white p-5 sm:p-6">
        <h3 className="font-['IBM_Plex_Serif',serif] text-lg font-semibold text-[#202a3b]">
          Completed Tasks
        </h3>

        <p className="mt-1 text-xs text-[#8992a2]">
          Your completed work and completion notes.
        </p>

        {tasks.filter(
          (task) => task.status?.toLowerCase() === "completed"
        ).length > 0 ? (
          <div className="mt-4 flex flex-col">
            {tasks
              .filter(
                (task) => task.status?.toLowerCase() === "completed"
              )
              .sort(
                (a, b) =>
                  new Date(b.completed_at || b.created_at) -
                  new Date(a.completed_at || a.created_at)
              )
              .map((task) => (
                <article
                  key={task.id}
                  className="border-b border-[#eef1f5] py-4 last:border-b-0"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <h4 className="break-words text-sm font-semibold text-[#273247]">
                        {task.title}
                      </h4>

                      {task.projects?.name && (
                        <p className="mt-1 text-xs text-[#8992a2]">
                          Project: {task.projects.name}
                        </p>
                      )}
                    </div>

                    <span className="w-fit shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                      Completed
                    </span>
                  </div>

                  {task.completion_note && (
                    <p className="mt-3 break-words rounded-lg bg-[#f8fafc] p-3 text-xs leading-5 text-[#687488]">
                      {task.completion_note}
                    </p>
                  )}

                  {task.completed_at && (
                    <p className="mt-2 text-[10px] text-[#8992a2]">
                      Completed on:{" "}
                      {new Date(task.completed_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  )}
                </article>
              ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-[#566176]">
              No completed tasks yet
            </p>

            <p className="mt-2 text-xs text-[#8992a2]">
              Your completed tasks will appear here.
            </p>
          </div>
        )}
      </div>

      {/* ATTENTION REQUIRED */}
      {(blockedTasks > 0 || overdueTasks > 0) && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <h3 className="text-sm font-semibold text-red-700">
            Tasks needing attention
          </h3>

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-red-700">
            {blockedTasks > 0 && (
              <span>
                {blockedTasks} blocked{" "}
                {blockedTasks === 1 ? "task" : "tasks"}
              </span>
            )}

            {overdueTasks > 0 && (
              <span>
                {overdueTasks} overdue{" "}
                {overdueTasks === 1 ? "task" : "tasks"}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs leading-5 text-red-600">
            Review these tasks and update their status or communicate the
            reason for any blockers to your admin.
          </p>
        </div>
      )}

      {/* EMPTY STATE */}
      {totalTasks === 0 && (
        <div className="rounded-2xl border border-dashed border-[#d9e3f1] bg-white px-5 py-8 text-center">
          <p className="text-sm font-semibold text-[#273247]">
            No progress data available yet
          </p>

          <p className="mt-2 text-xs text-[#8992a2]">
            Once the admin assigns tasks to you, your progress will appear here.
          </p>
        </div>
      )}
    </section>
  );
};

export default Progress;