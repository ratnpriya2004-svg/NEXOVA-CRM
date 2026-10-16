import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  password: "",
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [activeEmployeeCard, setActiveEmployeeCard] = useState("total");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // READ: Fetch employees
const loadEmployees = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false });

    console.log("Supabase profiles:", data);
    console.table(data);
    console.log("Supabase query error:", queryError);

    if (queryError) {
      throw queryError;
    }

    const employeeProfiles = (data ?? []).filter(
      (profile) =>
        profile.role?.trim().toLowerCase() === "employee"
    );

    console.log("Filtered employees:", employeeProfiles);

    setEmployees(employeeProfiles);
  } catch (err) {
    console.error("Employee loading failed:", err);
    setError(err.message || "Unable to load employees.");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // SEARCH
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return employees;

    return employees.filter(
      (employee) =>
        (employee.full_name ?? "").toLowerCase().includes(q) ||
        employee.id.toLowerCase().includes(q)
    );
  }, [employees, search]);

  // OPEN CREATE FORM
  function openCreate() {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  // OPEN EDIT FORM
  function openEdit(employee) {
    setEditingEmployee(employee);

    setForm({
      full_name: employee.full_name ?? "",
      email: "",
      password: "",
    });

    setError("");
    setNotice("");
    setModalOpen(true);
  }

  // CREATE / UPDATE
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    const fullName = form.full_name.trim();

    if (!fullName) {
      setError("Employee name is required.");
      return;
    }

    setBusy(true);

    try {
      if (editingEmployee) {
        const { data, error: functionError } =
            await supabase.functions.invoke("admin-manage-employee", {
            body: {
                action: "update",
                employee_id: editingEmployee.id,
                full_name: fullName,
            },
            });

        if (functionError) {
            throw functionError;
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        setNotice("Employee profile updated successfully.");
        } else {
        // CREATE authentication account securely
        if (!form.email.trim() || !form.password) {
          throw new Error("Email and password are required.");
        }

        if (form.password.length < 8) {
          throw new Error(
            "Password must contain at least 8 characters."
          );
        }

        const { data, error: functionError } =
          await supabase.functions.invoke(
            "admin-manage-employee",
            {
              body: {
                action: "create",
                full_name: fullName,
                email: form.email.trim(),
                password: form.password,
              },
            }
          );

        if (functionError) throw functionError;

        if (data?.error) {
          throw new Error(data.error);
        }

        setNotice("Employee account created successfully.");
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);

      await loadEmployees();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // DELETE employee
  async function handleDelete(employee) {
    const confirmed = window.confirm(
      `Delete employee "${employee.full_name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setBusy(true);

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke(
          "admin-manage-employee",
          {
            body: {
              action: "delete",
              employee_id: employee.id,
            },
          }
        );

      if (functionError) throw functionError;

      if (data?.error) {
        throw new Error(data.error);
      }

      setNotice("Employee deleted successfully.");

      await loadEmployees();
    } catch (err) {
      setError(err.message || "Unable to delete employee.");
    } finally {
      setBusy(false);
    }
  }

  function formatDate(value) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Team Management
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Employees
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create, view, update and manage employees.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadEmployees}
            disabled={loading || busy}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={busy}
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {notice}
        </div>
      )}

      {/* SUMMARY CARDS */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

  {/* TOTAL EMPLOYEES */}
  <button
    type="button"
    onClick={() => setSearch("")}
    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-md"
  >
    <p className="text-sm text-slate-500">
      Total Employees
    </p>

    <p className="mt-3 text-3xl font-bold text-slate-900">
      {loading ? "..." : employees.length}
    </p>

    <p className="mt-2 text-xs font-semibold text-blue-600">
      View all employees →
    </p>
  </button>

  {/* SEARCH RESULTS */}
  <button
    type="button"
    onClick={() => {
      document
        .querySelector('input[type="search"]')
        ?.focus();
    }}
    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-md"
  >
    <p className="text-sm text-slate-500">
      Search Results
    </p>

    <p className="mt-3 text-3xl font-bold text-blue-600">
      {loading ? "..." : filteredEmployees.length}
    </p>

    <p className="mt-2 text-xs font-semibold text-blue-600">
      View search results →
    </p>
  </button>

</div>

      {/* EMPLOYEE TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by employee name or ID..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 sm:max-w-md"
          />
        </div>

        {loading ? (
          <p className="p-10 text-center text-slate-500">
            Loading employees...
          </p>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-semibold text-slate-800">
              No employees found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Add an employee or try another search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                          {(employee.full_name || "E")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {employee.full_name || "Unnamed Employee"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            ID: {employee.id.slice(0, 8)}...
                          </p>
                        </div>
<div className="mt-1 flex flex-wrap items-center gap-2">
  <p className="break-all text-xs text-slate-500">
    UID: {employee.id}
  </p>

  <button
    type="button"
    onClick={() => {
      navigator.clipboard.writeText(employee.id);
      setNotice("Employee UID copied successfully!");
    }}
    className="rounded border border-blue-200 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
  >
    Copy UID
  </button>
</div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                        {employee.role}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(employee.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(employee)}
                          disabled={busy}
                          className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(employee)}
                          disabled={busy}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </h3>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-2xl text-slate-400 hover:text-slate-700"
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="employee-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="employee-name"
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      full_name: event.target.value,
                    })
                  }
                  placeholder="Enter employee name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {!editingEmployee && (
                <>
                  <div>
                    <label
                      htmlFor="employee-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email Address
                    </label>

                    <input
                      id="employee-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          email: event.target.value,
                        })
                      }
                      placeholder="employee@example.com"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="employee-password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Temporary Password
                    </label>

                    <input
                      id="employee-password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          password: event.target.value,
                        })
                      }
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Share the temporary password securely with the employee.
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={busy}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy
                    ? "Please wait..."
                    : editingEmployee
                      ? "Save Changes"
                      : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}