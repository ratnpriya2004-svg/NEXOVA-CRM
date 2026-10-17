import React, { useEffect, useState } from "react";
import "./App.css";

import Login from "./Component/Login/Login.jsx";
import EmployeeDashboard from "./Component/EmployeeDashboard/EmployeeDashboard.jsx";
import AdminDashboard from "./Component/AdminDashboard/AdminDashboard.jsx";
import EmployeeProfile from "./Component/EmployeeDashboard/EmployeeProfile.jsx";
import { supabase } from "./lib/supabase";
import Home from "./Component/Home/Home.jsx";

const TAB_LOGIN_KEY = "nexova_authenticated_tab";

function App() {
  const [currentPage, setCurrentPage] = useState("loading");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [error, setError] = useState("");
  const [previousPage, setPreviousPage] = useState("employee-dashboard");

  const openDashboard = (profile) => {
    setUserName(profile.full_name || "User");
    setUserRole(profile.role);
    setCurrentPage(
      profile.role === "admin" ? "admin-dashboard" : "employee-dashboard"
    );
  };

  const loadProfile = async (userId) => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      !["admin", "employee"].includes(profile.role)
    ) {
      return { profile: null, error: profileError };
    }

    return { profile, error: null };
  };

  useEffect(() => {
    let active = true;

    const restoreTabSession = async () => {
      try {
        // Keep the dashboard on refresh in the same tab, but require login
        // when the website is opened in a fresh tab/browser session.
        const hadLoginInThisTab = sessionStorage.getItem(TAB_LOGIN_KEY) === "1";

        if (!hadLoginInThisTab) {
          await supabase.auth.signOut({ scope: "local" });
          if (active) setCurrentPage("home");
          return;
        }

        const { data: { session }, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          sessionStorage.removeItem(TAB_LOGIN_KEY);
          if (active) setCurrentPage("home");
          return;
        }

        const { profile } = await loadProfile(session.user.id);
        if (!profile) {
          sessionStorage.removeItem(TAB_LOGIN_KEY);
          await supabase.auth.signOut({ scope: "local" });
          if (active) setCurrentPage("login");
          return;
        }

        if (active) openDashboard(profile);
      } catch (restoreError) {
        console.error("Could not restore login session:", restoreError);
        sessionStorage.removeItem(TAB_LOGIN_KEY);
        if (active) setCurrentPage("login");
      }
    };

    restoreTabSession();
    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async ({ email, password }) => {
    setError("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    if (!data.user) {
      setError("Unable to verify your account.");
      return;
    }

    const { profile } = await loadProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      sessionStorage.removeItem(TAB_LOGIN_KEY);
      setError("Your account role could not be verified. Please contact the administrator.");
      return;
    }

    sessionStorage.setItem(TAB_LOGIN_KEY, "1");
    openDashboard(profile);
  };

  const handleLogout = async () => {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    sessionStorage.removeItem(TAB_LOGIN_KEY);
    setUserName("");
    setUserRole("");
    setError("");
    setCurrentPage("login");
  };

    const handleOpenLogin = () => {
  setError("");
  setCurrentPage("login");
};

const handleOpenProfile = () => {
  setPreviousPage(currentPage);
  setCurrentPage("employee-profile");
};

const handleBackToDashboard = () => {
  setCurrentPage(previousPage);
};

  if (currentPage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading your workspace...
      </div>
    );
  }

  if (currentPage === "admin-dashboard") {
    return <AdminDashboard adminName={userName} onLogout={handleLogout} />;
  }

  if (currentPage === "employee-dashboard") {
  return (
    <EmployeeDashboard
      employeeName={userName}
      onLogout={handleLogout}
      onOpenProfile={handleOpenProfile}
    />
  );
}

if (currentPage === "employee-profile") {
  return (
    <EmployeeProfile
      employeeName={userName}
      onBack={handleBackToDashboard}
      onLogout={handleLogout}
    />
  );
}

  if (currentPage === "login") {
  return (
    <div className="min-h-screen">
      <Login role="admin" onLogin={handleLogin} />

      {error && (
        <p
          role="alert"
          className="mx-auto mt-4 max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
      type="button"
      onClick={() => {
        setError("");
        setCurrentPage("home");
      }}
      aria-label="Close login"
      className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-black"
    >
      <span className="text-2xl leading-none">&times;</span>
    </button>
    </div>
  );
}

return <Home onLogin={handleOpenLogin} />;

}

export default App;
