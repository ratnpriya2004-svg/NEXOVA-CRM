import React from "react";

const features = [
  { number: "01", icon: "▦", title: "Project Management", description: "Plan projects, organize priorities, and keep every milestone moving in the right direction." },
  { number: "02", icon: "✓", title: "Task Management", description: "Assign work, manage deadlines, and see what needs attention without the busywork." },
  { number: "03", icon: "♙", title: "Team Workspace", description: "Keep responsibilities clear and give every teammate a shared place to focus." },
  { number: "04", icon: "↗", title: "Progress & Reports", description: "Understand project activity at a glance and make better decisions with team progress." },
];

const highlights = [
  { value: "One", label: "connected workspace" },
  { value: "Clear", label: "team visibility" },
  { value: "Less", label: "busywork, more focus" },
];

export default function Home({ onLogin }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070b14] text-white">
      <section className="relative isolate overflow-hidden">
        {/* Lightweight CSS background instead of WebGL shaders to reduce lag */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_20%,rgba(22,131,255,0.22),transparent_38%),radial-gradient(ellipse_at_82%_40%,rgba(6,182,212,0.13),transparent_32%),linear-gradient(135deg,#070b14_0%,#0a1425_52%,#080b13_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3" aria-label="NEXOVA X home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-xl font-black shadow-lg shadow-blue-500/20">N</span>
            <span className="text-lg font-bold tracking-wide">NEXOVA <span className="text-cyan-400">X</span></span>
          </button>
          <nav className="hidden items-center gap-8 md:flex">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-sm text-white transition hover:text-cyan-300">Home</button>
            <a href="#features" className="text-sm text-slate-300 transition hover:text-cyan-300">Features</a>
            <a href="#about" className="text-sm text-slate-300 transition hover:text-cyan-300">About</a>
          </nav>
          <button type="button" onClick={onLogin} className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110">Get Started <span aria-hidden="true">↗</span></button>
        </header>

        <div className="mx-auto grid min-h-[680px] w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:min-h-[720px] lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pb-24">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-xs font-medium tracking-wide text-cyan-200 sm:text-sm"><span className="h-2 w-2 rounded-full bg-cyan-400" />YOUR TEAM'S SMARTER WORKSPACE</div>
            <p className="mb-3 text-lg font-light italic text-blue-300 sm:text-2xl">Work with clarity.</p>
            <h1 className="text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl xl:text-[82px]">Bring your work<span className="mt-2 block bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text pb-2 text-transparent">into focus.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">Projects, tasks, and team progress — all connected in one distraction-free workspace built to help your team move forward.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onLogin} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-950/50 transition hover:brightness-110">Enter Your Workspace <span aria-hidden="true">↗</span></button>
              <a href="#features" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:bg-white/[0.08]">Explore Features</a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400"><span>✓ Project planning</span><span>✓ Task tracking</span><span>✓ Team visibility</span></div>
          </div>

          {/* Static dashboard preview: no shader canvas or continuous animation */}
          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[2rem] bg-blue-500/15 blur-3xl" />
            <div className="relative rounded-[1.7rem] border border-white/15 bg-[#0b1322]/95 p-4 shadow-2xl shadow-black/50 sm:p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-xs text-slate-400">NEXOVA X / OVERVIEW</p><h2 className="mt-1 text-lg font-semibold">Team dashboard</h2></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-300">● Workspace</span></div>
              <div className="mt-4 grid grid-cols-3 gap-3">{[{ label: "Projects", value: "Organized" }, { label: "Tasks", value: "On track" }, { label: "Team", value: "Connected" }].map((item) => <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:p-4"><p className="text-[11px] text-slate-400 sm:text-xs">{item.label}</p><p className="mt-2 text-xs font-semibold text-white sm:text-sm">{item.value}</p></div>)}</div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#101c30] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs text-slate-400">PROJECT ACTIVITY</p><p className="mt-1 text-base font-semibold">Progress at a glance</p></div><span className="text-xs text-cyan-300">Team overview</span></div><div className="mt-6 flex h-32 items-end gap-2 sm:h-40 sm:gap-3">{[34, 48, 42, 66, 55, 77, 69, 92, 81, 100, 88, 96].map((height, index) => <div key={index} className="flex h-full flex-1 items-end"><div className={`w-full rounded-t-md ${index === 9 ? "bg-gradient-to-t from-blue-600 to-cyan-300" : "bg-gradient-to-t from-blue-950 to-blue-500/80"}`} style={{ height: `${height}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-slate-500 sm:text-xs"><span>Plan</span><span>Build</span><span>Review</span><span>Deliver</span></div></div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] p-3 sm:p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-lg text-cyan-200">✓</span><div className="min-w-0"><p className="text-sm font-semibold">Everything in sync</p><p className="mt-1 text-xs leading-5 text-slate-400">Tasks, projects, and teammates in one place.</p></div></div>
            </div>
            <div className="pointer-events-none absolute -bottom-5 -left-4 hidden rounded-xl border border-white/10 bg-[#101c30] px-4 py-3 shadow-xl sm:block"><p className="text-xs text-slate-400">Built for teams</p><p className="mt-1 text-sm font-semibold text-cyan-200">Modern · Clear · Connected</p></div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-5 pb-10 sm:grid-cols-3 sm:px-8 lg:px-12">{highlights.map((item) => <div key={item.label} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-4"><span className="text-2xl font-semibold text-cyan-300">{item.value}</span><span className="text-sm text-slate-400">{item.label}</span></div>)}</div>
      </section>

      <section id="features" className="scroll-mt-8 border-t border-white/10 bg-[#080d17] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold text-cyan-300">Everything your team needs</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">One workspace.<span className="text-cyan-300"> Endless possibilities.</span></h2><p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">From planning to delivery, NEXOVA X helps your team stay organized, focused, and connected.</p></div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">{features.map((feature) => <article key={feature.title} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-200 hover:border-cyan-300/30 hover:bg-white/[0.055]"><div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-xl text-cyan-200">{feature.icon}</div><p className="mt-5 text-xs tracking-widest text-slate-500">{feature.number}</p><h3 className="mt-2 text-lg font-semibold text-white">{feature.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p></article>)}</div>
        </div></section>

      <section id="about" className="bg-[#080d17] px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12"><div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-blue-300/15 bg-[radial-gradient(ellipse_at_top_left,rgba(22,131,255,0.18),transparent_45%),linear-gradient(120deg,#0d1a2d,#10131c_65%,#10252b)] px-6 py-12 text-center sm:px-12 sm:py-16"><p className="text-sm font-semibold text-cyan-300">Bring your team together</p><h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">Ready to bring your workflow into focus?</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">Your projects, tasks, and team — connected in one smarter workspace.</p><button type="button" onClick={onLogin} className="mt-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 active:scale-[0.98]">Login to NEXOVA X <span aria-hidden="true">↗</span></button></div></section>

      <footer className="border-t border-white/10 bg-[#070b14] px-5 py-6 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row"><p className="font-semibold tracking-wide">NEXOVA <span className="text-cyan-300">X</span></p><p className="text-center text-xs text-slate-500 sm:text-sm">© {new Date().getFullYear()} NEXOVA X. All rights reserved.</p></div></footer>
    </main>
  );
}
