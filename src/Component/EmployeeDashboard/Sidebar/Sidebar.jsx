import React from "react";

const menuItems = [
  { name: "Overview", icon: "◫" },
  { name: "My Tasks", icon: "☷" },
  { name: "My Progress", icon: "↗" },
];

export default function Sidebar({
  employeeName = "Employee",
  activeTab = "Overview",
  setActiveTab,
  onLogout,
  loggingOut = false,
}) {
  const initial =
    employeeName?.trim()?.charAt(0)?.toUpperCase() || "E";

  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#101827] p-4 text-white md:sticky md:top-0 md:h-screen md:w-[250px] md:p-6">

      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-xl font-bold">
          N
        </div>

        <div>
          <h2 className="text-lg font-bold">
            NEXOVA <span className="text-blue-400">X</span>
          </h2>

          <p className="mt-1 text-[9px] tracking-widest text-slate-400">
            PROJECT & TASK TRACKER
          </p>
        </div>
      </div>

      {/* Employee Profile */}
      <div className="my-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/20 font-semibold text-blue-300">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {employeeName}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Team Member
          </p>
        </div>

        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>

      <p className="mb-3 text-[10px] font-bold tracking-widest text-slate-500">
        WORKSPACE
      </p>

      {/* Navigation Buttons */}
      <nav className="flex gap-2 overflow-x-auto md:flex-col">
        {menuItems.map((item) => {
          const active = activeTab === item.name;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveTab(item.name)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-sm font-medium transition ${
                active
                  ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Helpful Card */}
      <div className="mt-6 hidden rounded-xl border border-white/10 bg-white/5 p-4 md:mt-auto md:block">
        <div className="text-xl text-blue-400">✦</div>

        <h4 className="mt-3 text-sm font-semibold">
          Stay on track.
        </h4>

        <p className="mt-2 text-xs leading-5 text-slate-400">
          Small steps make big progress.
        </p>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        disabled={!onLogout || loggingOut}
        className="mt-4 flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-lg">↪</span>

        {loggingOut ? "Signing out..." : "Sign Out"}
      </button>

      <p className="mt-4 hidden text-center text-[10px] text-slate-600 md:block">
        NEXOVA X · 2026
      </p>
    </aside>
  );
}