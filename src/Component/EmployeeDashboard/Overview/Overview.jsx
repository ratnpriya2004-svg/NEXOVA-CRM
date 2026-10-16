import React from "react";

const Overview = ({ employeeName = "Employee", tasks = [] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === "completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === "pending"
  ).length;

  const inProgressTasks = tasks.filter((task) =>
    ["in_progress", "in progress"].includes(
      task.status?.toLowerCase()
    )
  ).length;

  const blockedTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === "blocked"
  ).length;

  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date || task.status?.toLowerCase() === "completed") {
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

  const summaryCards = [
    {
      label: "Total Assigned",
      count: totalTasks,
      description: "Tasks assigned to you",
      icon: "▤",
      color: "text-blue-600",
      background: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Pending",
      count: pendingTasks,
      description: "Waiting to be started",
      icon: "◷",
      color: "text-amber-600",
      background: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "In Progress",
      count: inProgressTasks,
      description: "Currently in progress",
      icon: "↗",
      color: "text-violet-600",
      background: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      label: "Completed",
      count: completedTasks,
      description: "Successfully completed",
      icon: "✓",
      color: "text-emerald-600",
      background: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Blocked",
      count: blockedTasks,
      description: "Need attention",
      icon: "!",
      color: "text-red-600",
      background: "bg-red-50",
      border: "border-red-100",
    },
    {
      label: "Overdue",
      count: overdueTasks,
      description: "Past their due date",
      icon: "⌛",
      color: "text-orange-600",
      background: "bg-orange-50",
      border: "border-orange-100",
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      {/* WELCOME */}
      <div className="rounded-2xl border border-[#e4edfb] bg-gradient-to-r from-white to-[#f0f6ff] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#1683ff]">
          Employee Workspace
        </p>

        <h2 className="mt-3 break-words font-['IBM_Plex_Serif',serif] text-2xl font-semibold text-[#172033] sm:text-3xl">
          Welcome back, {employeeName}!
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#788397]">
          Here is your current workload. Keep track of your assigned
          tasks, deadlines, and progress from one place.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-[#dceaff] bg-white px-3 py-2 text-xs font-semibold text-[#1683ff]">
            {totalTasks} Assigned Tasks
          </span>

          <span className="rounded-lg border border-[#d9f3e5] bg-white px-3 py-2 text-xs font-semibold text-[#219565]">
            {completionPercentage}% Completed
          </span>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className={`rounded-2xl border ${card.border} bg-white p-5 transition-shadow duration-200 hover:shadow-md`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#7d8798]">
                  {card.label}
                </p>

                <h3 className="mt-3 text-3xl font-semibold text-[#172033]">
                  {card.count}
                </h3>
              </div>

              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${card.background} text-xl font-semibold ${card.color}`}
              >
                {card.icon}
              </div>
            </div>

            <p className="mt-4 text-xs text-[#8993a4]">
              {card.description}
            </p>
          </article>
        ))}
      </div>

      {/* COMPLETION PROGRESS */}
      <div className="rounded-2xl border border-[#e9edf3] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-['IBM_Plex_Serif',serif] text-lg font-semibold text-[#202a3b]">
              Overall Progress
            </h3>

            <p className="mt-1 text-xs text-[#8992a2]">
              Your completed work compared with all assigned tasks.
            </p>
          </div>

          <span className="text-2xl font-semibold text-[#1683ff]">
            {completionPercentage}%
          </span>
        </div>

        <div
          className="mt-5 h-3 w-full overflow-hidden rounded-full bg-[#e8eef7]"
          role="progressbar"
          aria-label="Task completion percentage"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1683ff] to-[#58a5ff] transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[#8992a2]">
          <span>{completedTasks} completed</span>
          <span>{totalTasks - completedTasks} remaining</span>
        </div>
      </div>

      {/* EMPTY STATE */}
      {totalTasks === 0 && (
        <div className="rounded-2xl border border-dashed border-[#d9e3f1] bg-white px-5 py-10 text-center">
          <div className="text-3xl text-[#1683ff]">▤</div>

          <h3 className="mt-3 text-base font-semibold text-[#273247]">
            No tasks assigned yet
          </h3>

          <p className="mt-2 text-sm text-[#8993a4]">
            Tasks assigned to your account by the admin will appear here.
          </p>
        </div>
      )}
    </section>
  );
};

export default Overview;