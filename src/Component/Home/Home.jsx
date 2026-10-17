import React from "react";
import ShaderShowcase from "./ShaderShowcase";

const features = [
  {
    icon: "▦",
    title: "Project Management",
    description:
      "Organize projects, set priorities, and manage your team's work from one place.",
  },
  {
    icon: "✓",
    title: "Task Management",
    description:
      "Assign tasks, manage deadlines, and track progress without losing sight of priorities.",
  },
  {
    icon: "♙",
    title: "Employee Tracking",
    description:
      "Keep responsibilities clear and help every team member understand their work.",
  },
  {
    icon: "↗",
    title: "Reports & Progress",
    description:
      "Get a clearer picture of project activity and monitor your team's progress.",
  },
];

export default function Home({ onLogin }) {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* 21st.dev Shader Hero */}
      <ShaderShowcase onLogin={onLogin} />

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-10 border-t border-white/10 bg-[#08090d] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-cyan-400">
              Everything your team needs
            </p>

            <h2 className="mt-4 font-serif text-3xl font-medium sm:text-4xl md:text-5xl">
              One workspace.
              <span className="text-cyan-400">
                {" "}Endless possibilities.
              </span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-gray-400 sm:text-base sm:leading-8">
              From project planning to task completion, NEXOVA X helps your
              team stay organized, focused, and connected.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.05]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-xl text-cyan-300 transition group-hover:bg-cyan-400/20">
                  {feature.icon}
                </div>

                <p className="mt-5 text-xs tracking-widest text-gray-600">
                  0{index + 1}
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About / CTA */}
      <section
        id="about"
        className="bg-[#08090d] px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12"
      >
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-950/40 via-[#101116] to-orange-950/20 px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="text-sm text-cyan-400">
            Bring your team together
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl font-serif text-3xl sm:text-4xl md:text-5xl">
            Ready to take control of your workflow?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-400 sm:text-base">
            Your projects, tasks, and team — all connected in one smarter
            workspace.
          </p>

          <button
            type="button"
            onClick={onLogin}
            className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-cyan-100 active:scale-95"
          >
            Login to NEXOVA X ↗
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#08090d] px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="font-semibold tracking-wide">
            NEXOVA <span className="text-cyan-400">X</span>
          </p>

          <p className="text-center text-xs text-gray-500 sm:text-sm">
            © {new Date().getFullYear()} NEXOVA X. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}