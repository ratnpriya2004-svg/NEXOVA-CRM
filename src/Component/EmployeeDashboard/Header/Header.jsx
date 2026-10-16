import React from "react";

const Header = ({ employeeName = "Employee", activeTab = "Overview" }) => {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="box-border flex w-full items-center justify-between gap-6 border-b border-[#E9EDF3] pb-[26px] pt-2 max-[1000px]:items-start max-[600px]:flex-col max-[600px]:items-stretch max-[600px]:gap-[18px] max-[600px]:pb-5">
      {/* LEFT SECTION */}
      <div className="min-w-0">
        <p className="mb-[10px] text-xs font-medium tracking-[0.2px] text-[#7D8798]">
          Workspace <span className="mx-2 text-[#C2C8D2]">/</span>
          {activeTab}
        </p>

        <h1 className="m-0 font-['IBM_Plex_Serif',serif] text-[30px] font-semibold leading-[1.3] tracking-[-0.7px] text-[#151B2C] max-[600px]:text-[26px]">
          {activeTab}
        </h1>

        <p className="mt-[7px] text-[13px] leading-[1.6] text-[#7C8596]">
          Here's what's happening with your work today.
        </p>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex shrink-0 items-center justify-end gap-5 max-[1000px]:gap-3 max-[600px]:justify-between">
        {/* DATE */}
        <div className="flex items-center gap-[9px] whitespace-nowrap text-xs text-[#626D80] max-[1000px]:hidden">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-[#E0EFFF] bg-[#EEF6FF] text-[17px] text-[#1683FF]">
            ▦
          </span>

          <span>{formattedDate}</span>
        </div>

        {/* DIVIDER */}
        <div className="h-[38px] w-px bg-[#E8EBF0] max-[1000px]:hidden" />

        {/* EMPLOYEE INFO */}
        <div className="ml-0 flex items-center gap-[10px] max-[600px]:ml-auto">
          <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border border-[#DCECFF] bg-[#EAF3FF] font-['IBM_Plex_Serif',serif] text-[19px] font-semibold text-[#1683FF]">
            {employeeName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="m-0 text-xs font-semibold text-[#222B3B]">
              {employeeName}
            </h3>

            <p className="mt-[5px] text-[11px] text-[#8A93A3]">
              Team Member
            </p>
          </div>

          <span className="ml-[3px] h-[7px] w-[7px] rounded-full bg-green-500 shadow-[0_0_0_3px_#E9F9EF]" />
        </div>
      </div>
    </header>
  );
};

export default Header;