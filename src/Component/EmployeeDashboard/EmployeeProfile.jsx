import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const EmployeeProfile = ({ employeeName = "Employee", onBack }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadEmployeeProfile = async () => {
      try {
        setLoading(true);
        setError("");

        // Get the currently logged-in employee
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("Unable to find the logged-in user.");
        }

        // Fetch employee details from Supabase
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (active) {
          setProfile({
            full_name: data?.full_name || employeeName,
            email: user.email || "Not available",
            employee_id:
              data?.employee_id ||
              data?.employee_code ||
              data?.id ||
              user.id,
            role: data?.role || "Employee",
          });
        }
      } catch (err) {
        console.error("Error loading employee profile:", err);

        if (active) {
          setError(
            err.message || "Unable to load profile information."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadEmployeeProfile();

    return () => {
      active = false;
    };
  }, [employeeName]);

  const displayName = profile?.full_name || employeeName;

  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  const profileFields = [
    {
      label: "Full Name",
      value: profile?.full_name,
      icon: "👤",
    },
    {
      label: "Email Address",
      value: profile?.email,
      icon: "✉️",
    },
    {
      label: "Employee ID",
      value: profile?.employee_id,
      icon: "🪪",
    },
    {
      label: "Role",
      value: profile?.role,
      icon: "💼",
    },
  ];

  return (
    <main className="min-h-screen bg-[#080F1C] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-4xl">

        {/* PAGE HEADER */}
        <header className="flex items-start justify-between gap-4 border-b border-[#263750] pb-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
              <span>Workspace</span>
              <span className="text-slate-600">/</span>
              <span className="text-blue-400">My Profile</span>
            </div>

            <h1 className="font-['IBM_Plex_Serif',serif] text-2xl font-semibold tracking-tight sm:text-3xl">
              My Profile
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              View your personal and employee account information.
            </p>
          </div>

          {/* CANCEL BUTTON */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Close profile"
            title="Close Profile"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#263750] bg-[#111F35] text-slate-400 transition hover:border-blue-400/40 hover:bg-[#152640] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M18 6 6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        {/* PROFILE CONTENT */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#263750] bg-[#111F35] sm:mt-8">

          {/* PROFILE BANNER */}
          <div className="border-b border-[#263750] bg-gradient-to-r from-blue-500/10 via-transparent to-transparent p-5 sm:p-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-2xl font-semibold text-blue-400 sm:h-24 sm:w-24 sm:text-3xl">
                {initials || "E"}
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <h2 className="break-words text-xl font-semibold sm:text-2xl">
                  {displayName}
                </h2>

                <p className="mt-1 break-all text-sm text-slate-400">
                  {profile?.email || "Loading email..."}
                </p>

                {profile && (
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium capitalize text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {profile.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACCOUNT DETAILS */}
          <div className="p-5 sm:p-8">
            <div className="mb-5">
              <h3 className="text-base font-semibold sm:text-lg">
                Account Information
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Your registered employee details.
              </p>
            </div>

            {loading ? (
              <div
                className="flex items-center justify-center gap-3 py-12 text-sm text-slate-400"
                role="status"
              >
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
                Loading your profile...
              </div>
            ) : error ? (
              <div
                className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
                role="alert"
              >
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {profileFields.map((field) => (
                  <div
                    key={field.label}
                    className="min-w-0 rounded-xl border border-[#263750] bg-[#080F1C] p-4 transition-colors hover:border-blue-400/30 sm:p-5"
                  >
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">{field.icon}</span>

                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        {field.label}
                      </p>
                    </div>

                    <p className="mt-3 break-words text-sm font-medium text-slate-100 sm:text-base">
                      {field.value || "Not available"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* PASSWORD INFORMATION */}
            <div className="mt-6 rounded-xl border border-[#263750] bg-[#080F1C] p-4 sm:p-5">
              <div className="flex items-start gap-3">
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
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                    />
                    <path
                      d="M8 10V7a4 4 0 0 1 8 0v3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">
                    Password
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Your password is kept secure and cannot be viewed here.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Your account information is retrieved from your authenticated account.
        </p>

      </div>
    </main>
  );
};

export default EmployeeProfile;