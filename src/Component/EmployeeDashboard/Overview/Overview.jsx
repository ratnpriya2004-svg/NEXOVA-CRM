import React, { useState } from "react";

const Overview = ({ employeeName = "Employee", tasks = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Today's date
  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // Normalize task status
  const getStatus = (task) =>
    task.status?.toLowerCase() || "pending";

  // Check overdue tasks
  const isOverdue = (task) => {
    if (!task.due_date || getStatus(task) === "completed") {
      return false;
    }

    return String(task.due_date).slice(0, 10) < todayString;
  };

  // Task statistics
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => getStatus(task) === "completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => getStatus(task) === "pending"
  ).length;

  const inProgressTasks = tasks.filter((task) =>
    ["in_progress", "in progress"].includes(getStatus(task))
  ).length;

  const blockedTasks = tasks.filter(
    (task) => getStatus(task) === "blocked"
  ).length;

  const overdueTasks = tasks.filter(isOverdue).length;

  const completionPercentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  // Summary cards
  const summaryCards = [
    {
      label: "Total Assigned",
      count: totalTasks,
      description: "Tasks assigned to you",
      icon: "▤",
      filter: "all",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-400/40",
    },
    {
      label: "Pending",
      count: pendingTasks,
      description: "Waiting to be started",
      icon: "◷",
      filter: "pending",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-400/40",
    },
    {
      label: "In Progress",
      count: inProgressTasks,
      description: "Currently working on",
      icon: "↗",
      filter: "in_progress",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-400/40",
    },
    {
      label: "Completed",
      count: completedTasks,
      description: "Successfully completed",
      icon: "✓",
      filter: "completed",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-400/40",
    },
    {
      label: "Blocked",
      count: blockedTasks,
      description: "Need your attention",
      icon: "!",
      filter: "blocked",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-400/40",
    },
    {
      label: "Overdue",
      count: overdueTasks,
      description: "Past their due date",
      icon: "⌛",
      filter: "overdue",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-400/40",
    },
  ];

  // Handle summary card click
  const handleCardClick = (filter) => {
    setSelectedFilter(filter);

    // Send selected filter to TaskList.jsx
    window.dispatchEvent(
      new CustomEvent("employee-task-filter", {
        detail: {
          status: filter,
        },
      })
    );

    // Scroll down to task list
    window.setTimeout(() => {
      const taskList = document.getElementById("employee-task-list");

      if (taskList) {
        taskList.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  return (
    <section className="flex w-full min-w-0 flex-col gap-6 text-slate-100">

      {/* WELCOME CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-[#263750] bg-[#111F35] p-5 shadow-lg shadow-black/10 sm:p-7 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#1683ff]/10 blur-3xl sm:h-64 sm:w-64"
        />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-400">
            <span className="h-2 w-2 rounded-full bg-[#1683ff]" />
            Employee Workspace
          </span>

          <h2 className="mt-4 break-words font-['IBM_Plex_Serif',serif] text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-[34px]">
            Welcome back, {employeeName}!
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            Track your assignments, deadlines, and progress, all in one place.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-[#263750] bg-[#0D1728] px-4 py-3">
              <p className="text-xl font-bold text-white">
                {totalTasks}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Assigned Tasks
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
              <p className="text-xl font-bold text-emerald-400">
                {completionPercentage}%
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TASK OVERVIEW HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-['IBM_Plex_Serif',serif] text-xl font-semibold text-white sm:text-2xl">
            Task Overview
          </h3>

          <p className="mt-1.5 text-sm text-slate-400">
            Click a card to view its tasks below.
          </p>
        </div>

        <span className="rounded-lg border border-[#263750] bg-[#111F35] px-3 py-2 text-xs text-slate-300">
          {totalTasks} {totalTasks === 1 ? "Task" : "Tasks"}
        </span>
      </div>

      {/* CLICKABLE SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const isSelected = selectedFilter === card.filter;

          return (
            <button
              key={card.filter}
              type="button"
              onClick={() => handleCardClick(card.filter)}
              aria-pressed={isSelected}
              aria-label={`${card.label}: ${card.count} tasks. Click to view.`}
              className={`group relative min-w-0 overflow-hidden rounded-2xl border bg-[#111F35] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:bg-[#152640] focus:outline-none focus:ring-2 focus:ring-[#1683ff]/60 ${
                isSelected
                  ? `${card.border} ring-1 ring-[#1683ff]/20`
                  : "border-[#263750] hover:border-[#1683ff]/40"
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <span className="absolute right-0 top-0 rounded-bl-lg bg-[#1683ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                  Selected
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-slate-400">
                    {card.label}
                  </p>

                  <h4 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {card.count}
                  </h4>
                </div>

                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${card.bg} ${card.color}`}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {card.icon}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#263750] pt-3">
                <span className="text-xs leading-5 text-slate-400">
                  {card.description}
                </span>

                <span
                  className={`shrink-0 text-sm transition-transform group-hover:translate-x-1 ${card.color}`}
                  aria-hidden="true"
                >
                  →
                </span>
              </div>

              <p className="mt-3 text-[10px] text-slate-500">
                Click to view tasks
              </p>
            </button>
          );
        })}
      </div>

      {/* OVERALL PROGRESS */}
      <div className="rounded-2xl border border-[#263750] bg-[#111F35] p-5 shadow-md shadow-black/10 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-['IBM_Plex_Serif',serif] text-lg font-semibold text-white sm:text-xl">
              Overall Progress
            </h3>

            <p className="mt-1.5 text-sm leading-6 text-slate-400">
              Your completed work compared with all assigned tasks.
            </p>
          </div>

          <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Completion
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-400">
              {completionPercentage}%
            </p>
          </div>
        </div>

        <div
          className="mt-6 h-3 w-full overflow-hidden rounded-full bg-[#263750]"
          role="progressbar"
          aria-label="Task completion percentage"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1683ff] to-emerald-400 transition-all duration-700"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {completedTasks} completed
          </span>

          <span className="text-xs font-medium text-slate-300">
            {totalTasks - completedTasks} remaining
          </span>
        </div>

        {/* STATUS BREAKDOWN */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#263750] pt-5 sm:grid-cols-4">
          {[
            {
              label: "Pending",
              count: pendingTasks,
              color: "bg-amber-400",
            },
            {
              label: "In Progress",
              count: inProgressTasks,
              color: "bg-violet-400",
            },
            {
              label: "Completed",
              count: completedTasks,
              color: "bg-emerald-400",
            },
            {
              label: "Blocked",
              count: blockedTasks,
              color: "bg-red-400",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-[#263750] bg-[#0D192B] p-3"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`}
              />

              <div className="min-w-0">
                <p className="truncate text-xs text-slate-400">
                  {item.label}
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {item.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EMPTY STATE */}
      {totalTasks === 0 && (
        <div className="rounded-2xl border border-dashed border-[#344760] bg-[#111F35] px-5 py-10 text-center sm:py-12">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-2xl text-[#1683ff]">
            ▤
          </div>

          <h3 className="mt-4 font-['IBM_Plex_Serif',serif] text-lg font-semibold text-white">
            No tasks assigned yet
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            Tasks assigned to your account by the admin will appear here.
          </p>
        </div>
      )}
    </section>
  );
};

export default Overview;