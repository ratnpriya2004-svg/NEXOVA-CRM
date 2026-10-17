import React from "react";


const Header = ({
  employeeName = "Employee",
  activeTab = "Overview",
  onOpenProfile,
}) => {

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const pageDescriptions = {
    Overview: "Here's what's happening with your work today.",
    "My Tasks": "Manage your assigned tasks and stay on track.",
    "My Progress":
      "Track your progress and celebrate your achievements.",
  };

  const initials = employeeName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  const handleProfileClick = () => {
  if (onOpenProfile) {
    onOpenProfile();
  }
};
  return (
    <header className="w-full border-b border-[#263750] pb-5 sm:pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        {/* LEFT SECTION */}
        <div className="min-w-0">
          {/* Breadcrumb */}
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
            <span>Workspace</span>

            <span className="text-slate-600">/</span>

            <span className="text-blue-400">{activeTab}</span>
          </div>

          {/* Page Title */}
          <h1 className="break-words font-['IBM_Plex_Serif',serif] text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {activeTab}
          </h1>

          {/* Page Description */}
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-400">
            {pageDescriptions[activeTab] ||
              "Stay organized and keep your work moving forward."}
          </p>
        </div>

        {/* RIGHT SECTION */}
        <div className="grid w-full grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:w-auto lg:shrink-0 lg:gap-4">

          {/* DATE CARD */}
          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#263750] bg-[#111F35] px-3 py-2.5 transition-colors duration-200 hover:bg-[#152640] sm:px-3.5">
            {/* Calendar Icon */}
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-blue-400/10 bg-blue-500/10 text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="2"
                />

                <path
                  d="M16 3v4M8 3v4M3 10h18"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Date Information */}
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Today
              </p>

              <p className="mt-0.5 whitespace-nowrap text-xs font-semibold text-slate-200 sm:text-sm">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* CLICKABLE EMPLOYEE PROFILE */}
          <button
            type="button"
            onClick={handleProfileClick}
            aria-label={`View ${employeeName}'s profile`}
            title="View Profile"
            className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-[#263750] bg-[#111F35] px-3 py-2 text-left transition-all duration-200 hover:border-blue-400/40 hover:bg-[#152640] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080F1C] sm:gap-3 sm:px-3.5"
          >
            {/* Avatar */}
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-400/20 bg-blue-500/15 text-sm font-semibold text-blue-400 transition-colors duration-200 group-hover:bg-blue-500/25">
              {initials || "E"}

              {/* Online Indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#111F35] bg-emerald-400" />
            </div>

            {/* Employee Information */}
            <div className="min-w-0 flex-1">
              <p className="max-w-full truncate text-sm font-semibold text-white">
                {employeeName}
              </p>

              <p className="mt-0.5 text-xs text-slate-400 transition-colors group-hover:text-blue-400">
                View Profile
              </p>
            </div>

            {/* Arrow Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="ml-auto h-4 w-4 shrink-0 text-slate-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-blue-400"
              aria-hidden="true"
            >
              <path
                d="m9 18 6-6-6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;