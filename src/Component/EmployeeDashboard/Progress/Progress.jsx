import React, { useState, useRef } from "react";

const Progress = ({ tasks = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const taskListRef = useRef(null);

  const totalTasks = tasks.length;

  const countStatus = (status) =>
    tasks.filter((task) => task.status?.toLowerCase() === status).length;

  const completedTasks = countStatus("completed");
  const pendingTasks = countStatus("pending");
  const blockedTasks = countStatus("blocked");

  const inProgressTasks = tasks.filter((task) =>
    ["in_progress", "in progress"].includes(task.status?.toLowerCase())
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  const statusItems = [
    {
      label: "Completed",
      count: completedTasks,
      color: "#34D399",
      bar: "bg-emerald-400",
      text: "text-emerald-400",
    },
    {
      label: "In Progress",
      count: inProgressTasks,
      color: "#1683ff",
      bar: "bg-blue-500",
      text: "text-blue-400",
    },
    {
      label: "Pending",
      count: pendingTasks,
      color: "#FBBF24",
      bar: "bg-amber-400",
      text: "text-amber-400",
    },
    {
      label: "Blocked",
      count: blockedTasks,
      color: "#F87171",
      bar: "bg-red-400",
      text: "text-red-400",
    },
    {
      label: "Overdue",
      count: overdueTasks,
      color: "#FB923C",
      bar: "bg-orange-400",
      text: "text-orange-400",
    },
  ];

  const statistics = [
    {
      label: "Total Tasks",
      count: totalTasks,
      color: "text-blue-400",
    },
    {
      label: "Completed",
      count: completedTasks,
      color: "text-emerald-400",
    },
    {
      label: "In Progress",
      count: inProgressTasks,
      color: "text-blue-400",
    },
    {
      label: "Pending",
      count: pendingTasks,
      color: "text-amber-400",
    },
  ];

  const completedTaskHistory = tasks
    .filter((task) => task.status?.toLowerCase() === "completed")
    .sort(
      (a, b) =>
        new Date(b.completed_at || b.created_at) -
        new Date(a.completed_at || a.created_at)
    );

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "Not available";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // FILTER TASKS
  const filteredTasks = tasks.filter((task) => {
    const status = task.status?.toLowerCase();

    switch (selectedFilter) {
      case "Completed":
        return status === "completed";

      case "In Progress":
        return ["in_progress", "in progress"].includes(status);

      case "Pending":
        return status === "pending";

      case "Blocked":
        return status === "blocked";

      case "Overdue": {
        if (!task.due_date || status === "completed") return false;

        const dueDate = new Date(
          `${String(task.due_date).slice(0, 10)}T00:00:00`
        );

        return !Number.isNaN(dueDate.getTime()) && dueDate < today;
      }

      default:
        return true;
    }
  });

  // CLICK CARD AND SCROLL TO TASKS
  const handleFilterClick = (filter) => {
    setSelectedFilter(filter);

    window.setTimeout(() => {
      taskListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // MONTHLY TASK ACTIVITY
  const activityData = (() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      months.push({
        label: date.toLocaleDateString("en-IN", { month: "short" }),
        year: date.getFullYear(),
        month: date.getMonth(),
        count: 0,
      });
    }

    tasks.forEach((task) => {
      if (!task.created_at) return;

      const date = new Date(task.created_at);

      if (Number.isNaN(date.getTime())) return;

      const month = months.find(
        (item) =>
          item.month === date.getMonth() &&
          item.year === date.getFullYear()
      );

      if (month) month.count += 1;
    });

    return months;
  })();

  const chartWidth = 560;
  const chartHeight = 230;

  const padding = {
    top: 18,
    right: 18,
    bottom: 34,
    left: 32,
  };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const maxActivity = Math.max(
    ...activityData.map((item) => item.count),
    4
  );

  const niceMax = Math.ceil(maxActivity / 4) * 4 || 4;

  const points = activityData.map((item, index) => ({
    ...item,
    x:
      padding.left +
      (index / Math.max(activityData.length - 1, 1)) * plotWidth,
    y: padding.top + plotHeight - (item.count / niceMax) * plotHeight,
  }));

  const linePath = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const middleX = (previous.x + point.x) / 2;

    return (
      path +
      ` C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`
    );
  }, "");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${
          padding.top + plotHeight
        } L ${points[0].x} ${padding.top + plotHeight} Z`
      : "";

  return (
    <section className="w-full min-w-0 space-y-6 bg-[#080F1C] text-slate-100">
     
      {/* OVERALL COMPLETION */}
      <div className="rounded-2xl border border-[#263750] bg-[#111F35] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Overall Completion</p>

            <h3 className="mt-2 text-4xl font-semibold text-white">
              {completionPercentage}%
            </h3>

            <p className="mt-2 text-xs text-slate-400">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Remaining Tasks</p>

            <p className="mt-1 text-2xl font-semibold text-blue-400">
              {Math.max(0, totalTasks - completedTasks)}
            </p>
          </div>
        </div>

        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-[#263750]"
          role="progressbar"
          aria-label="Overall task completion"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[#1683ff] transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* CLICKABLE STATISTICS */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statistics.map((item) => {
          const filter =
            item.label === "Total Tasks" ? "All" : item.label;

          const isSelected = selectedFilter === filter;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleFilterClick(filter)}
              aria-pressed={isSelected}
              className={`min-w-0 rounded-xl border p-4 text-left transition-all duration-200 sm:p-5 ${
                isSelected
                  ? "border-blue-500 bg-[#172B46]"
                  : "border-[#263750] bg-[#111F35] hover:border-blue-500/50 hover:bg-[#152640]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400 sm:text-sm">
                  {item.label}
                </p>

                <span className="text-sm text-slate-500">↗</span>
              </div>

              <h3 className={`mt-3 text-2xl font-semibold ${item.color}`}>
                {item.count}
              </h3>

              <p className="mt-2 text-[11px] text-slate-500">
                {isSelected ? "Selected" : "Click to view"}
              </p>
            </button>
          );
        })}
      </div>

      {/* GRAPHS */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* LINE GRAPH */}
        <div className="min-w-0 rounded-2xl border border-[#263750] bg-[#111F35] p-4 sm:p-6">
          <h3 className="font-['IBM_Plex_Serif',serif] text-lg font-semibold text-white">
            Task Activity
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Tasks created over the last six months.
          </p>

          <div className="mt-5 w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-auto w-full"
              role="img"
              aria-label="Monthly task creation graph"
            >
              <defs>
                <linearGradient
                  id="progressAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#1683ff" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#1683ff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {Array.from({ length: 5 }, (_, index) => {
                const value = (niceMax * index) / 4;
                const y = padding.top + plotHeight - (index / 4) * plotHeight;

                return (
                  <g key={index}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#293B54"
                      strokeDasharray="3 5"
                    />

                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="11"
                      fill="#8493A8"
                    >
                      {Math.round(value)}
                    </text>
                  </g>
                );
              })}

              <path d={areaPath} fill="url(#progressAreaGradient)" />

              <path
                d={linePath}
                fill="none"
                stroke="#1683ff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((point) => (
                <g key={`${point.label}-${point.year}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#111F35"
                    stroke="#1683ff"
                    strokeWidth="2"
                  />

                  <text
                    x={point.x}
                    y={chartHeight - 9}
                    fill="#94A3B8"
                    fontSize="11"
                    textAnchor="middle"
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* BAR GRAPH */}
        <div className="min-w-0 rounded-2xl border border-[#263750] bg-[#111F35] p-5 sm:p-6">
          <h3 className="font-['IBM_Plex_Serif',serif] text-lg font-semibold text-white">
            Task Status
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Current distribution of assigned tasks.
          </p>

          <div className="mt-6 space-y-5">
            {statusItems.map((item) => {
              const percentage =
                totalTasks > 0
                  ? Math.round((item.count / totalTasks) * 100)
                  : 0;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-300">
                      {item.label}
                    </span>

                    <span className="text-xs text-slate-400">
                      <span className={`font-semibold ${item.text}`}>
                        {item.count}
                      </span>

                      <span className="ml-2">{percentage}%</span>
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#263750]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.bar}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FILTERED TASK DETAILS */}
      <div
        ref={taskListRef}
        className="scroll-mt-6 rounded-2xl border border-[#263750] bg-[#111F35] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-['IBM_Plex_Serif',serif] text-lg font-semibold text-white">
              {selectedFilter === "All"
                ? "All Assigned Tasks"
                : `${selectedFilter} Tasks`}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              View task details and completion information.
            </p>
          </div>

          <span className="rounded-lg border border-[#263750] bg-[#0D192B] px-3 py-2 text-xs text-slate-300">
            {filteredTasks.length} Tasks
          </span>
        </div>

        {/* FILTER BUTTONS */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "All",
            "Completed",
            "In Progress",
            "Pending",
            "Blocked",
            "Overdue",
          ].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => handleFilterClick(filter)}
              aria-pressed={selectedFilter === filter}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                selectedFilter === filter
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-[#30415A] bg-[#0D192B] text-slate-400 hover:border-blue-500/50 hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* TASK LIST */}
        <div className="mt-5">
          {filteredTasks.length > 0 ? (
            <div className="divide-y divide-[#263750]">
              {filteredTasks.map((task) => {
                const status = task.status?.toLowerCase();

                const statusLabel =
                  status === "completed"
                    ? "Completed"
                    : ["in_progress", "in progress"].includes(status)
                      ? "In Progress"
                      : status === "blocked"
                        ? "Blocked"
                        : status === "pending"
                          ? "Pending"
                          : task.status || "Unknown";

                const statusStyle =
                  status === "completed"
                    ? "bg-emerald-400/10 text-emerald-400"
                    : ["in_progress", "in progress"].includes(status)
                      ? "bg-blue-400/10 text-blue-400"
                      : status === "blocked"
                        ? "bg-red-400/10 text-red-400"
                        : status === "pending"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-slate-400/10 text-slate-300";

                return (
                  <article key={task.id} className="py-5 first:pt-1 last:pb-1">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <h4 className="break-words text-sm font-semibold text-white">
                          {task.title || "Untitled Task"}
                        </h4>

                        {task.projects?.name && (
                          <p className="mt-1 text-xs text-slate-400">
                            Project: {task.projects.name}
                          </p>
                        )}
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${statusStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-lg border border-[#263750] bg-[#0D192B] p-3">
                        <p className="text-[11px] text-slate-500">Priority</p>

                        <p className="mt-1 break-words text-xs font-medium text-slate-200">
                          {task.priority || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#263750] bg-[#0D192B] p-3">
                        <p className="text-[11px] text-slate-500">Due Date</p>

                        <p className="mt-1 text-xs font-medium text-slate-200">
                          {task.due_date
                            ? formatDate(task.due_date)
                            : "No deadline"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#263750] bg-[#0D192B] p-3">
                        <p className="text-[11px] text-slate-500">
                          Created On
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-200">
                          {formatDate(task.created_at)}
                        </p>
                      </div>
                    </div>

                    {task.description && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-slate-400">
                          Description
                        </p>

                        <p className="mt-1 break-words text-sm leading-6 text-slate-300">
                          {task.description}
                        </p>
                      </div>
                    )}

                    {task.completion_note && (
                      <div className="mt-3 rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-3">
                        <p className="text-xs font-medium text-emerald-400">
                          Completion Note
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-slate-300">
                          {task.completion_note}
                        </p>
                      </div>
                    )}

                    {task.blocked_reason && (
                      <div className="mt-3 rounded-lg border border-red-400/15 bg-red-400/5 p-3">
                        <p className="text-xs font-medium text-red-400">
                          Blocked Reason
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-slate-300">
                          {task.blocked_reason}
                        </p>
                      </div>
                    )}

                    {task.completed_at && status === "completed" && (
                      <p className="mt-3 text-[11px] text-slate-500">
                        Completed on: {formatDate(task.completed_at)}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <h4 className="text-sm font-semibold text-white">
                {selectedFilter === "All"
                  ? "No tasks assigned yet"
                  : `No ${selectedFilter.toLowerCase()} tasks`}
              </h4>

              <p className="mt-2 text-xs text-slate-400">
                Tasks matching this selection will appear here.
              </p>

              {selectedFilter !== "All" && (
                <button
                  type="button"
                  onClick={() => handleFilterClick("All")}
                  className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
                >
                  View All Tasks
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ATTENTION REQUIRED */}
      {(blockedTasks > 0 || overdueTasks > 0) && (
        <div className="rounded-xl border border-red-400/20 bg-[#111F35] p-5">
          <h3 className="text-sm font-semibold text-red-400">
            Tasks Needing Attention
          </h3>

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {blockedTasks > 0 && (
              <span className="rounded-lg bg-red-400/10 px-3 py-2 text-red-300">
                {blockedTasks} blocked{" "}
                {blockedTasks === 1 ? "task" : "tasks"}
              </span>
            )}

            {overdueTasks > 0 && (
              <span className="rounded-lg bg-orange-400/10 px-3 py-2 text-orange-300">
                {overdueTasks} overdue{" "}
                {overdueTasks === 1 ? "task" : "tasks"}
              </span>
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            Review these tasks and communicate any blockers to your admin.
          </p>
        </div>
      )}
    </section>
  );
};

export default Progress;