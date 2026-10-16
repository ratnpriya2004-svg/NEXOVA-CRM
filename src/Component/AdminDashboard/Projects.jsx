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
    planning: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    on_hold: "bg-amber-100 text-amber-700",
  };

  return styles[status] || "bg-slate-100 text-slate-700";
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
    <div className="space-y-7">
      {/* Page Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold tracking-widest text-blue-600">
            ADMIN WORKSPACE
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Projects Management
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create, organize, track and manage your workspace projects.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchProjects}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Project
          </button>
        </div>
      </section>

      {/* Success Message */}
      {success && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
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
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
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
      color: "text-blue-600",
      filter: "all",
    },
    {
      title: "Planning",
      value: projectCounts.planning,
      color: "text-slate-700",
      filter: "planning",
    },
    {
      title: "In Progress",
      value: projectCounts.inProgress,
      color: "text-amber-600",
      filter: "in_progress",
    },
    {
      title: "Completed",
      value: projectCounts.completed,
      color: "text-emerald-600",
      filter: "completed",
    },
    ].map((item) => (
    <button
      key={item.title}
      type="button"
      onClick={() => setStatusFilter(item.filter)}
      className={`rounded-2xl border bg-white p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-md ${
        statusFilter === item.filter
          ? "border-blue-500 ring-2 ring-blue-100 shadow-sm"
          : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <p className="text-sm font-medium text-slate-500">
        {item.title}
      </p>

      <p className={`mt-3 text-3xl font-bold ${item.color}`}>
        {loading ? "..." : item.value}
      </p>

      <p className="mt-2 text-xs font-medium text-blue-600">
        {statusFilter === item.filter
          ? "Currently selected ✓"
          : "Click to view projects →"}
      </p>
    </button>
  ))}

</section>

      {/* Create / Edit Form */}
      {formOpen && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {editingProject ? "Edit Project" : "Create New Project"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Enter the project details below.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              aria-label="Close project form"
              className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
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
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="project-status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Project Status
                </label>

                <select
                  id="project-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Start Date
                </label>

                <input
                  id="project-start-date"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="project-due-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              All Projects
            </h3>

            <p className="mt-1 text-sm text-slate-500">
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
              className="min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
            />

            <select
              aria-label="Filter projects by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
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
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading projects...
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl text-slate-400">
              ▣
            </div>

            <h4 className="mt-4 font-semibold text-slate-800">
              {projects.length === 0
                ? "No projects created yet"
                : "No matching projects"}
            </h4>

            <p className="mt-2 text-sm text-slate-500">
              {projects.length === 0
                ? "Create your first project to get started."
                : "Try changing your search or status filter."}
            </p>

            {projects.length === 0 && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
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
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
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
                      className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="max-w-xs px-4 py-5">
                        <p className="break-words font-semibold text-slate-900">
                          {project.name}
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
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

                      <td className="whitespace-nowrap px-4 py-5 text-sm text-slate-600">
                        {formatDate(project.start_date)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-5 text-sm text-slate-600">
                        {formatDate(project.due_date)}
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(project)}
                            aria-label={`Edit ${project.name}`}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(project)}
                            disabled={deletingId === project.id}
                            aria-label={`Delete ${project.name}`}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
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
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="break-words font-semibold text-slate-900">
                      {project.name}
                    </h4>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        project.status
                      )}`}
                    >
                      {projectStatuses.find(
                        (status) => status.value === project.status
                      )?.label || formatLabel(project.status)}
                    </span>
                  </div>

                  <p className="mt-3 break-words text-sm leading-6 text-slate-500">
                    {project.description || "No description provided."}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <p>Start: {formatDate(project.start_date)}</p>
                    <p>Deadline: {formatDate(project.due_date)}</p>
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => openEditForm(project)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(project)}
                      disabled={deletingId === project.id}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
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