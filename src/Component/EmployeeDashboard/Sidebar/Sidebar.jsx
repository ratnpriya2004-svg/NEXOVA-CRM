import React from "react";

const Sidebar = ({
  employeeName = "Employee",
  activeTab = "Overview",
  setActiveTab,
  onLogout,
}) => {
  const navigationItems = [
    { name: "Overview", icon: "◫" },
    { name: "My Tasks", icon: "☷" },
    { name: "My Progress", icon: "↗" },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-[250px] shrink-0 flex-col border-r border-gray-200 bg-white px-[17px] py-6 text-[#111318] max-[760px]:relative max-[760px]:h-auto max-[760px]:w-full max-[760px]:border-r-0 max-[760px]:border-b max-[760px]:p-[15px]">
      {/* BRAND */}
      <div className="flex items-center gap-[11px] border-b border-gray-200 px-1 pb-[25px]">
        <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[10px] bg-[#1683FF] font-sans text-[25px] font-extrabold text-white">
          N
        </div>

        <div>
          <h2 className="m-0 text-[19px] font-bold tracking-[-0.6px]">
            NEXOVA <span className="text-[#1683FF]">X</span>
          </h2>

          <p className="mt-1 font-sans text-[8px] font-bold tracking-[0.9px] text-[#858B97]">
            PROJECT & TASK TRACKER
          </p>
        </div>
      </div>

      {/* EMPLOYEE PROFILE */}
      <div className="my-[22px] mb-[29px] flex items-center gap-[10px] rounded-[9px] border border-[#EFF0F4] bg-[#F8F9FB] px-[9px] py-3 max-[760px]:my-[13px]">
        <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#E5EFFF] font-sans text-base font-bold text-[#1683FF]">
          {employeeName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate text-[13px] font-semibold">
            {employeeName}
          </h3>

          <p className="mt-1 text-[11px] text-[#858B97]">
            Team Member
          </p>
        </div>

        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
      </div>

      {/* NAVIGATION */}
      <div className="mb-3 ml-[10px] font-sans text-[10px] font-bold tracking-[1.2px] text-[#969BA6] max-[760px]:hidden">
        WORKSPACE
      </div>

      <nav className="flex flex-col gap-[6px] max-[760px]:flex-row max-[760px]:overflow-x-auto">
        {navigationItems.map((item) => {
          const isActive = activeTab === item.name;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveTab(item.name)}
              className={`relative flex min-h-[45px] w-full cursor-pointer items-center gap-3 rounded-[7px] border px-3 text-left text-[13px] transition-colors duration-200 max-[760px]:min-h-10 max-[760px]:w-auto max-[760px]:shrink-0 max-[760px]:justify-center max-[760px]:gap-[6px] max-[760px]:px-[10px] max-[760px]:text-[11px] ${
                isActive
                  ? "border-[#E1EDFF] bg-[#EDF4FF] font-semibold text-[#1683FF]"
                  : "border-transparent bg-transparent text-[#646B78] hover:bg-[#F5F8FF] hover:text-[#1683FF]"
              }`}
            >
              <span className="grid w-[22px] shrink-0 place-items-center font-sans text-lg">
                {item.icon}
              </span>

              <span>{item.name}</span>

              {isActive && (
                <span className="absolute -right-px top-[10px] h-[23px] w-[3px] rounded-l-[5px] bg-[#1683FF] max-[760px]:hidden" />
              )}
            </button>
          );
        })}
      </nav>

      {/* BOTTOM SECTION */}
      <div className="mt-auto max-[760px]:mt-[9px]">
        <div className="rounded-[9px] border border-[#E8EFFF] bg-gradient-to-br from-[#F5F8FF] to-white p-4 max-[760px]:hidden">
          <span className="mb-[11px] grid h-[29px] w-[29px] place-items-center rounded-lg bg-[#E5EFFF] text-[17px] text-[#1683FF]">
            ✦
          </span>

          <h4 className="m-0 text-sm font-semibold">
            Stay on track.
          </h4>

          <p className="mt-[7px] font-sans text-[11px] leading-[1.6] text-[#777D89]">
            Small steps make big progress.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex w-full cursor-pointer items-center gap-[10px] rounded-[7px] border border-transparent bg-transparent p-3 text-left text-[13px] text-[#646B78] transition-colors duration-200 hover:border-red-100 hover:bg-red-50 hover:text-red-600 max-[760px]:mt-1 max-[760px]:justify-center max-[760px]:p-2"
        >
          <span className="font-sans text-[19px]">↪</span>
          Sign out
        </button>

        <p className="mt-[15px] text-center font-sans text-[10px] tracking-[0.6px] text-[#A1A5AE] max-[760px]:hidden">
          NEXOVA X · 2026
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;