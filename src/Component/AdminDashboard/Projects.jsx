import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const initialForm = {
  name: "",
  description: "",
  status: "planning",
  start_date: "",
  due_date: "",
};

const projectStatuses = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

function formatDate(date) {
  if (!date) return "Not set";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status) {
  const styles = {
    planning: "border border-slate-600/60 bg-slate-800 text-slate-200",
    in_progress: "border border-blue-300/20 bg-blue-400/10 text-blue-200",
    completed: "border border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
    on_hold: "border border-amber-300/20 bg-amber-400/10 text-amber-200",
  };

  return styles[status] || "border border-slate-600/60 bg-slate-800 text-slate-200";
}

export default function Projects({ adminId }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // READ: Fetch all projects from Supabase.
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("projects")
        .select("id, name, description, status, start_date, due_date, created_by, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setProjects(data || []);
    } catch (err) {
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Open form for creating a project.
  function openCreateForm() {
    setEditingProject(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  // Open form for editing an existing project.
  function openEditForm(project) {
    setEditingProject(project);

    setForm({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "planning",
      start_date: project.start_date || "",
      due_date: project.due_date || "",
    });

    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;

    setFormOpen(false);
    setEditingProject(null);
    setForm(initialForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // CREATE / UPDATE: Save the project to Supabase.
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const projectName = form.name.trim();

    if (!projectName) {
      setError("Please enter a project name.");
      return;
    }

    if (
      form.start_date &&
      form.due_date &&
      form.due_date < form.start_date
    ) {
      setError("The deadline cannot be earlier than the start date.");
      return;
    }

    const projectData = {
      name: projectName,
      description: form.description.trim() || null,
      status: form.status,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    };

    setSaving(true);

    try {
      if (editingProject) {
        // UPDATE
        if (editingProject) {
      const { data: updatedProject, error: updateError } = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", editingProject.id)
        .select("id, name, description, status, start_date, due_date")
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!updatedProject) {
        throw new Error(
          "Project update nahi hua. Ho sakta hai database permission missing ho."
        );
      }}
        setSuccess("Project updated successfully.");
      } else {
        // CREATE
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          throw new Error("Please sign in again before creating a project.");
        }

        const { error: insertError } = await supabase
          .from("projects")
          .insert({
            ...projectData,
            created_by: adminId || user.id,
          });

        if (insertError) throw insertError;

        setSuccess("Project created successfully.");
      }

      setFormOpen(false);
      setEditingProject(null);
      setForm(initialForm);

      await fetchProjects();
    } catch (err) {
      setError(err.message || "Unable to save the project.");
    } finally {
      setSaving(false);
    }
  }

  // DELETE: Remove a project from Supabase.
  async function handleDelete(project) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(project.id);

    try {
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

      if (deleteError) throw deleteError;

      setSuccess("Project deleted successfully.");
      await fetchProjects();
    } catch (err) {
      setError(err.message || "Unable to delete the project.");
    } finally {
      setDeletingId(null);
    }
  }

  // Search and filter projects.
const filteredProjects = useMemo(() => {
  const query = search.trim().toLowerCase();

  return projects.filter((project) => {
    const matchesSearch =
      (project.name || "").toLowerCase().includes(query) ||
      (project.description || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}, [projects, search, statusFilter]);

// Project counts
const projectCounts = useMemo(() => {
  return {
    total: projects.length,
    planning: projects.filter((p) => p.status === "planning").length,
    inProgress: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
  };
}, [projects]);

  return (
    <div className="min-h-full space-y-6 pb-8 font-[Inter,ui-sans-serif,system-ui] text-slate-100">
      {/* Page Heading */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#09253b] via-[#071b2e] to-[#101b3b] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-70px] right-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" /> NEXOVA X / PROJECTS
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Projects Management
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Create, organize, track and manage your workspace projects.
            </p>
          </div>

          <div className="relative flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchProjects}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600/80 bg-[#0a2237]/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-bold text-[#041524] shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:shadow-cyan-400/25 disabled:opacity-50"
          >
            + Add Project
          </button>
          </div>
        </div>
      </section>

      {/* Success Message */}
      {success && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          <span>✓ {success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            className="font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
          <span className="break-words">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error message"
            className="shrink-0 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Cards */}
<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  {[
    {
      title: "Total Projects",
      value: projectCounts.total,
      color: "text-cyan-300",
      filter: "all",
    },
    {
      title: "Planning",
      value: projectCounts.planning,
      color: "text-slate-200",
      filter: "planning",
    },
    {
      title: "In Progress",
      value: projectCounts.inProgress,
      color: "text-amber-300",
      filter: "in_progress",
    },
    {
      title: "Completed",
      value: projectCounts.completed,
      color: "text-emerald-300",
      filter: "completed",
    },
    ].map((item) => (
    <button
      key={item.title}
      type="button"
      onClick={() => setStatusFilter(item.filter)}
      className={`rounded-2xl border bg-[#071b2e] p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-md ${
        statusFilter === item.filter
          ? "border-cyan-300/50 ring-1 ring-cyan-300/20 shadow-lg shadow-cyan-950/20"
          : "border-slate-700/70 hover:border-blue-300"
      }`}
    >
      <p className="text-sm font-medium text-slate-400">
        {item.title}
      </p>

      <p className={`mt-3 text-3xl font-bold ${item.color}`}>
        {loading ? "..." : item.value}
      </p>

      <p className="mt-2 text-xs font-medium text-cyan-300">
        {statusFilter === item.filter
          ? "Currently selected ✓"
          : "Click to view projects →"}
      </p>
    </button>
  ))}

</section>

      {/* Create / Edit Form */}
      {formOpen && (
        <section className="rounded-2xl border border-slate-700 bg-[#071b2e] p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">
                {editingProject ? "Edit Project" : "Create New Project"}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Enter the project details below.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              aria-label="Close project form"
              className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Project Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="project-name"
                  name="name"
                  type="text"
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Description
                </label>

                <textarea
                  id="project-description"
                  name="description"
                  rows={4}
                  maxLength={3000}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the project and its objectives..."
                  className="w-full resize-y rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              <div>
                <label
                  htmlFor="project-status"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Project Status
                </label>

                <select
                  id="project-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-[#071b2e] px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                >
                  {projectStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="project-start-date"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Start Date
                </label>

                <input
                  id="project-start-date"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>

              <div>
                <label
                  htmlFor="project-due-date"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Deadline
                </label>

                <input
                  id="project-due-date"
                  name="due_date"
                  type="date"
                  min={form.start_date || undefined}
                  value={form.due_date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-[#041524] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-700/70 pt-5">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-[#0a2740]/60 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-bold text-[#041524] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingProject
                    ? "Save Changes"
                    : "Create Project"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Project List */}
      <section className="rounded-2xl border border-slate-700 bg-[#071b2e] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-bold text-white">
              All Projects
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {filteredProjects.length} project(s) displayed
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              aria-label="Search projects"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects..."
              className="min-w-0 rounded-xl border border-slate-700/70 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10 sm:w-64"
            />

            <select
              aria-label="Filter projects by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-700 bg-[#071b2e] px-4 py-3 text-sm outline-none focus:border-cyan-400"
            >
              <option value="all">All Statuses</option>

              {projectStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-300" />

            <p className="mt-4 text-sm text-slate-400">
              Loading projects...
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl text-slate-400">
              ▣
            </div>

            <h4 className="mt-4 font-semibold text-slate-200">
              {projects.length === 0
                ? "No projects created yet"
                : "No matching projects"}
            </h4>

            <p className="mt-2 text-sm text-slate-400">
              {projects.length === 0
                ? "Create your first project to get started."
                : "Try changing your search or status filter."}
            </p>

            {projects.length === 0 && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
              >
                + Create First Project
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="mt-6 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-slate-700/70 bg-[#0a2740] text-[11px] uppercase tracking-[0.15em] text-slate-400">
                    <th className="px-4 py-4 font-semibold">Project</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 font-semibold">Start Date</th>
                    <th className="px-4 py-4 font-semibold">Deadline</th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-slate-800/90 transition last:border-0 hover:bg-[#0a2740]/60"
                    >
                      <td className="max-w-xs px-4 py-5">
                        <p className="break-words font-semibold text-white">
                          {project.name}
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                          {project.description || "No description"}
                        </p>
                      </td>

                      <td className="px-4 py-5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                            project.status
                          )}`}
                        >
                          {projectStatuses.find(
                            (status) => status.value === project.status
                          )?.label || formatDate(project.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-5 text-sm text-slate-300">
                        {formatDate(project.start_date)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-5 text-sm text-slate-300">
                        {formatDate(project.due_date)}
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(project)}
                            aria-label={`Edit ${project.name}`}
                            className="rounded-lg border border-slate-700/70 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/10"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(project)}
                            disabled={deletingId === project.id}
                            aria-label={`Delete ${project.name}`}
                            className="rounded-lg border border-slate-700/70 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-400/20 hover:bg-rose-400/10 disabled:opacity-50"
                          >
                            {deletingId === project.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
              {filteredProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border border-slate-700/70 bg-[#071b2e] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="break-words font-semibold text-white">
                      {project.name}
                    </h4>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        project.status
                      )}`}
                    >
                      {projectStatuses.find(
                        (status) => status.value === project.status
                      )?.label || (project.status || "Unknown").replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="mt-3 break-words text-sm leading-6 text-slate-400">
                    {project.description || "No description provided."}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <p>Start: {formatDate(project.start_date)}</p>
                    <p>Deadline: {formatDate(project.due_date)}</p>
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-slate-700/70 pt-4">
                    <button
                      type="button"
                      onClick={() => openEditForm(project)}
                      className="flex-1 rounded-lg border border-slate-700/70 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-blue-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(project)}
                      disabled={deletingId === project.id}
                      className="flex-1 rounded-lg border border-slate-700/70 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === project.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}