import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function Login({
  onLogin,
  role = "employee",
  onRegister,
  onBack,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!onLogin) {
      setError("Login is not configured yet.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onLogin({
        email: email.trim(),
        password,
        role,
      });
    } catch (err) {
      setError(err?.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative isolate flex h-[100dvh] min-h-0 overflow-hidden bg-[#050608] font-sans text-white selection:bg-cyan-400/30">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-32 top-[-180px] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.10] blur-[130px]" />

      <div className="pointer-events-none absolute -bottom-40 right-[-100px] h-[420px] w-[420px] rounded-full bg-blue-600/[0.10] blur-[140px]" />

      {/* LEFT PANEL */}
      <section className="relative hidden h-full min-h-0 w-1/2 flex-col justify-between overflow-hidden border-r border-white/[0.08] px-8 py-6 lg:flex xl:px-12 xl:py-7">
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08]">
            <Zap size={21} className="text-cyan-300" />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-[0.17em]">
              NEXOVA<span className="text-cyan-300"> X</span>
            </h1>

            <p className="mt-0.5 text-[9px] uppercase tracking-[0.28em] text-white/40">
              Workspace
            </p>
          </div>
        </motion.div>

        {/* Short hero content */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 my-3 max-w-lg"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />

            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
              Your workspace, simplified
            </span>
          </div>

          <h2 className="text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">
            Work smarter.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Stay ahead.
            </span>
          </h2>

          <p className="mt-4 max-w-sm text-sm leading-6 text-white/50">
            One workspace to manage tasks, teams, and progress.
          </p>
        </motion.div>

        {/* Compact workspace preview */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 mt-5 max-w-lg rounded-2xl border border-white/[0.10] bg-white/[0.035] p-4 backdrop-blur-xl xl:mt-6 xl:p-5"
        >
          {/* Preview header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/90">
                Project overview
              </p>

              <p className="mt-1 text-[10px] text-white/40">
                Your team at a glance
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
              <ShieldCheck size={17} />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Projects", value: "12" },
              { label: "Tasks", value: "48" },
              { label: "Progress", value: "86%" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.07] bg-black/20 p-3"
              >
                <p className="text-lg font-semibold tracking-tight">
                  {item.value}
                </p>

                <p className="mt-1 text-[10px] text-white/40">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] text-white/50">
                Team productivity
              </span>

              <span className="text-[10px] font-medium text-cyan-300">
                86%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "86%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Minimal footer */}
        <div className="relative z-10 mt-5 flex items-center justify-between gap-3 text-[10px] text-white/35">
          <span>© {new Date().getFullYear()} NEXOVA X</span>

          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Workspace online
          </span>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="relative flex h-full min-h-0 w-full flex-col justify-center overflow-y-auto px-5 py-5 sm:px-10 lg:w-1/2 lg:px-8 lg:py-5 xl:px-12 2xl:px-16">
        {/* Mobile branding */}
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08]">
              <Zap size={19} className="text-cyan-300" />
            </div>

            <h1 className="text-sm font-bold tracking-[0.15em]">
              NEXOVA<span className="text-cyan-300"> X</span>
            </h1>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs text-white/50 transition hover:text-white"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-md shrink-0"
        >
          {/* Form heading */}
          <div className="mb-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07]">
              <LockKeyhole size={22} className="text-cyan-300" />
            </div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Secure workspace access
            </p>

            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back<span className="text-cyan-300">.</span>
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Sign in to continue to your workspace.
            </p>
          </div>

          {/* Login card */}
          <div className="rounded-2xl border border-white/[0.10] bg-white/[0.035] p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-6">
            {/* Role badge */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">
                  {role === "admin" ? "Admin Login" : "Employee Login"}
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Enter your account details
                </p>
              </div>

              <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                {role === "admin" ? "Admin" : "Employee"}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-xs font-medium text-white/70"
                >
                  Email address
                </label>

                <div className="group flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3.5 transition focus-within:border-cyan-300/50 focus-within:ring-2 focus-within:ring-cyan-300/10">
                  <Mail
                    size={17}
                    className="shrink-0 text-white/35 transition group-focus-within:text-cyan-300"
                  />

                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="username"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="login-password"
                    className="text-xs font-medium text-white/70"
                  >
                    Password
                  </label>
                </div>

                <div className="group flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3.5 transition focus-within:border-cyan-300/50 focus-within:ring-2 focus-within:ring-cyan-300/10">
                  <LockKeyhole
                    size={17}
                    className="shrink-0 text-white/35 transition group-focus-within:text-cyan-300"
                  />

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="shrink-0 text-white/35 transition hover:text-cyan-300"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3.5 py-3 text-xs leading-5 text-red-300"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 text-sm font-semibold text-[#041016] shadow-lg shadow-cyan-500/10 transition duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#041016]/30 border-t-[#041016]" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to workspace

                    <ArrowUpRight
                      size={17}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Registration */}
            {onRegister && role !== "admin" && (
              <div className="mt-5 border-t border-white/[0.08] pt-4 text-center">
                <p className="text-xs text-white/45">
                  New to the workspace?{" "}
                  <button
                    type="button"
                    onClick={onRegister}
                    className="font-medium text-cyan-300 transition hover:text-cyan-200"
                  >
                    Create account
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Security note */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/35">
            <ShieldCheck size={13} className="text-emerald-400/80" />
            Your workspace is protected and secure.
          </div>

          {/* Mobile footer */}
          <p className="mt-5 text-center text-[10px] text-white/30 lg:hidden">
            © {new Date().getFullYear()} NEXOVA X
          </p>
        </motion.div>
      </section>
    </main>
  );
}