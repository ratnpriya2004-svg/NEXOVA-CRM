import React, { useEffect, useRef, useState } from "react";
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react";
import { motion } from "framer-motion";

export default function ShaderShowcase({ onLogin }) {
  const containerRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnter = () => setIsActive(true);
    const handleMouseLeave = () => setIsActive(false);

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={containerRef}
      className="relative isolate min-h-[100svh] overflow-hidden bg-black text-white"
    >
      {/* SVG filters */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="nexova-glass">
            <feTurbulence
              baseFrequency="0.005"
              numOctaves="1"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="0.3"
            />
          </filter>

          <linearGradient
            id="nexova-logo-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Animated shader background */}
      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={[
          "#000000",
          "#06b6d4",
          "#0891b2",
          "#164e63",
          "#f97316",
        ]}
        speed={0.3}
      />

      <MeshGradient
        className="absolute inset-0 h-full w-full opacity-40"
        colors={["#000000", "#ffffff", "#06b6d4", "#f97316"]}
        speed={0.2}
        wireframe="true"
      />

      {/* Background overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/20" />

      {/* Navbar */}
      <header className="relative z-20 mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group flex shrink-0 items-center gap-2 sm:gap-3"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          aria-label="NEXOVA X home"
        >
          <motion.svg
            viewBox="0 0 100 100"
            className="h-9 w-9 text-white sm:h-11 sm:w-11"
            fill="currentColor"
            whileHover={{
              fill: "url(#nexova-logo-gradient)",
              rotate: [0, -3, 3, 0],
            }}
            transition={{ duration: 0.5 }}
          >
            <path d="M15 85V15h12l18 35 18-35h12v70h-12V35L45 70h-10L17 35v50H15z" />
          </motion.svg>

          <span className="text-base font-bold tracking-wide sm:text-xl">
            NEXOVA <span className="text-cyan-400">X</span>
          </span>
        </motion.button>

        {/* Navigation */}
        <nav className="hidden items-center gap-2 md:flex lg:gap-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-full px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            Home
          </button>

          <button
            onClick={scrollToFeatures}
            className="rounded-full px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            Features
          </button>

          <a
            href="#about"
            className="rounded-full px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            About
          </a>
        </nav>

        {/* Login button */}
        <motion.button
          type="button"
          onClick={onLogin}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-cyan-50 sm:px-6 sm:text-sm"
        >
          Login
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </motion.button>
      </header>

      {/* Hero content */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-90px)] w-full max-w-[1600px] items-center px-5 pb-24 pt-12 sm:px-8 sm:pb-28 sm:pt-16 lg:px-12 lg:pb-24 lg:pt-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 backdrop-blur-md"
            style={{ filter: "url(#nexova-glass)" }}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            <span className="text-xs font-medium tracking-wide text-white/90 sm:text-sm">
              Your workspace, reimagined
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-5xl font-light leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl xl:text-[100px]"
          >
            <span
              className="block bg-gradient-to-r from-white via-cyan-300 to-orange-400 bg-clip-text pb-2 text-transparent"
              style={{ backgroundSize: "200% 200%" }}
            >
              Work smarter.
            </span>

            <span className="mt-2 block font-black text-white">
              Grow faster.
            </span>

            <span className="mt-2 block text-4xl font-light italic text-white/75 sm:text-5xl md:text-6xl lg:text-7xl">
              Together.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-7 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8 md:text-lg"
          >
            Manage projects, organize tasks, track team progress, and bring
            your entire workflow together with NEXOVA X — your team's smarter
            digital workspace.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <motion.button
              type="button"
              onClick={onLogin}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex min-h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:from-cyan-400 hover:to-orange-400 sm:px-10"
            >
              Enter Your Workspace
              <span aria-hidden="true">↗</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={scrollToFeatures}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.04] px-8 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:border-cyan-400/60 hover:bg-white/10"
            >
              Explore Features
            </motion.button>
          </motion.div>

          {/* Quick benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/60 sm:text-sm"
          >
            <span>✓ Project Management</span>
            <span>✓ Task Tracking</span>
            <span>✓ Team Collaboration</span>
          </motion.div>
        </div>
      </main>

      {/* Decorative glowing circle */}
      <div className="pointer-events-none absolute bottom-5 right-5 z-10 flex h-16 w-16 items-center justify-center sm:bottom-8 sm:right-8 sm:h-20 sm:w-20">
        <PulsingBorder
          colors={[
            "#06b6d4",
            "#0891b2",
            "#f97316",
            "#ffffff",
          ]}
          colorBack="#00000000"
          speed={1.5}
          roundness={1}
          thickness={0.1}
          softness={0.2}
          intensity={5}
          spotSize={0.1}
          pulse={0.1}
          smoke={0.5}
          smokeSize={4}
          scale={0.65}
          rotation={0}
          style={{
            width: "55px",
            height: "55px",
            borderRadius: "50%",
          }}
        />

        <motion.span
          className="absolute text-lg font-bold text-white"
          animate={{ rotate: 360 }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          N
        </motion.span>
      </div>

      {/* Hover effect */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]"
        animate={{
          opacity: isActive ? 0.8 : 0.4,
          scale: isActive ? 1.15 : 1,
        }}
        transition={{ duration: 0.5 }}
      />
    </section>
  );
}