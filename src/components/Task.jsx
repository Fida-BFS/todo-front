import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Task.css";
import Sidebar from "./Sidebar";
import Header from "./Header.jsx";
import { authService } from "../services/authService";

import {
  fetchAllTasks,
  fetchAllUsers,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
} from "../services/taskService.js";

const Task = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    completed: false,
    dueDate: "",
    personId: "",
    attachments: [],
  });

  // filter/sort state
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const [filters, setFilters] = useState({
    status: "", // "" | "pending" | "done"
    user: "",
    dueBefore: "",
    dueAfter: "",
  });

  const [sortBy, setSortBy] = useState("dueDate"); // dueDate | createdAt | title | status
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc

  // refs for click-outside to close panels
  const filtersRef = useRef(null);
  const sortRef = useRef(null);
  const filterBtnRef = useRef(null);
  const sortBtnRef = useRef(null);

  // inline date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchTasks();
    fetchUsersList();
  }, []);

  useEffect(() => {
    // click outside handler to close filter/sort panels
    const onDocClick = (e) => {
      if (
        showFilters &&
        filtersRef.current &&
        !filtersRef.current.contains(e.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(e.target)
      ) {
        setShowFilters(false);
      }
      if (
        showSort &&
        sortRef.current &&
        !sortRef.current.contains(e.target) &&
        sortBtnRef.current &&
        !sortBtnRef.current.contains(e.target)
      ) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showFilters, showSort]);

  // fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetchAllTasks();
      if (res.status === 200) {
        // keep dueDate in a consistent ISO-like string usable for datetime-local
        const normalized = res.data.map((t) => ({
          ...t,
          dueDate: t.dueDate ? t.dueDate.slice(0, 16) : "",
        }));
        setTasks(normalized);
      } else {
        console.warn("Unexpected status when fetching tasks:", res.status);
      }
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  };

  // fetch users
  const fetchUsersList = async () => {
    try {
      const res = await fetchAllUsers();
      if (res.status === 200) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  //Updates form values when typing in inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  //Handles file uploads, stores files in attachments
  const handleFiles = (e) => {
    setForm({ ...form, attachments: Array.from(e.target.files) });
  };

  //Pre-fills the form with task values so the user can edit
  const startEdit = (task) => {
    setEditing(task.id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      completed: task.completed || false,
      dueDate: task.dueDate || "",
      personId: task.personId || "",
      attachments: [],
    });
    // scroll to form maybe
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  //Clears form after submitting or canceling edit
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      completed: false,
      dueDate: "",
      personId: "",
      attachments: [],
    });
    setEditing(null);
  };

  // submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateTask(editing, form);
      } else {
        await createTask(form);
      }
      resetForm();
      await fetchTasks();
    } catch (err) {
      console.error("Save failed:", err);
      setErrorMsg("Save failed. See console.");
    }
  };

  const handleDelete = async (id) => {
    const user = authService.getCurrentUser();
    if (!authService.isAdmin(user)) {
      setErrorMsg("❌ You are not allowed to delete tasks.");
      return;
    }
    if (!window.confirm("Delete this task?")) return;

    // optimistic UI update
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (editing === id) resetForm();

    try {
      const res = await deleteTask(id);
      if (res.status === 200 || res.status === 204) {
        // OK
      } else {
        console.warn("Delete response:", res);
        fetchTasks();
      }
    } catch (err) {
      console.error("Delete failed:", err);
      fetchTasks();
    }
  };

  const handleToggle = async (task) => {
    try {
      await toggleTaskStatus(task);
      fetchTasks();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ status: "", user: "", dueAfter: "", dueBefore: "" });
  };

  // Helpful util: safe date parsing (returns null if invalid)
  const toDateOrNull = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // Memoized filtered + sorted tasks for performance
  const filteredSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filtering
    if (filters.status) {
      result = result.filter((t) =>
        filters.status === "done" ? t.completed : !t.completed
      );
    }
    if (filters.user) {
      result = result.filter((t) => String(t.personId) === String(filters.user));
    }

    const after = toDateOrNull(filters.dueAfter);
    const before = toDateOrNull(filters.dueBefore);
    if (after) {
      result = result.filter((t) => {
        const td = toDateOrNull(t.dueDate);
        return td ? td >= after : false;
      });
    }
    if (before) {
      // To include the entire day selected by the user, set end of day
      const endOfDay = new Date(before);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((t) => {
        const td = toDateOrNull(t.dueDate);
        return td ? td <= endOfDay : false;
      });
    }

    // Sorting
    const cmp = (a, b) => {
      // safe getters
      const aDue = toDateOrNull(a.dueDate);
      const bDue = toDateOrNull(b.dueDate);
      const aCreated = toDateOrNull(a.createdAt);
      const bCreated = toDateOrNull(b.createdAt);

      switch (sortBy) {
        case "dueDate":
          if (aDue && bDue) return aDue - bDue;
          if (aDue && !bDue) return -1;
          if (!aDue && bDue) return 1;
          return 0;
        case "createdAt":
          if (aCreated && bCreated) return aCreated - bCreated;
          if (aCreated && !bCreated) return -1;
          if (!aCreated && bCreated) return 1;
          return 0;
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "status":
          // show pending first by default (pending=false completed=true)
          const aVal = a.completed ? 1 : 0;
          const bVal = b.completed ? 1 : 0;
          return aVal - bVal;
        default:
          return 0;
      }
    };

    result.sort((a, b) => {
      const r = cmp(a, b);
      return sortOrder === "asc" ? r : -r;
    });

    return result;
  }, [tasks, filters, sortBy, sortOrder]);

  // Count active filters for UI badge
  const activeFiltersCount = useMemo(() => {
    return (
      (filters.status ? 1 : 0) +
      (filters.user ? 1 : 0) +
      (filters.dueAfter ? 1 : 0) +
      (filters.dueBefore ? 1 : 0)
    );
  }, [filters]);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={false} onClose={() => {}} />
      <main className="dashboard-main">
        <Header
          title="Tasks"
          subtitle="Manage and organize your tasks"
          onToggleSidebar={() => {}}
        />

        <div className="dashboard-content">
          <div className="row">
            <div className="col-md-8 mx-auto">
              {errorMsg && (
                <div className="alert alert-danger d-flex justify-content-between align-items-center">
                  <div>{errorMsg}</div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setErrorMsg("")}
                  />
                </div>
              )}

              {/* form */}
              <div className="card shadow-sm task-form-section">
                <div className="card-body">
                  <h2 className="card-title mb-4">
                    {editing ? "Edit Task" : "Add New Task"}
                  </h2>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        name="title"
                        className="form-control"
                        required
                        value={form.title}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="3"
                        required
                        value={form.description}
                        onChange={handleChange}
                      ></textarea>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Due Date</label>
                        <input
                          type="datetime-local"
                          name="dueDate"
                          className="form-control"
                          value={form.dueDate}
                          onChange={handleChange}
                          min={new Date().toISOString().slice(0, 16)}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Assign to</label>
                        <select
                          className="form-select"
                          name="personId"
                          value={form.personId}
                          onChange={handleChange}
                        >
                          <option value="">-- Optional --</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Attachments</label>
                      <div className="input-group mb-2">
                        <input
                          type="file"
                          multiple
                          className="form-control"
                          onChange={handleFiles}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setForm({ ...form, attachments: [] })}
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                      <div className="small text-muted">
                        {form.attachments.map((f, i) => (
                          <div key={i}>{f.name}</div>
                        ))}
                      </div>
                    </div>

                    <div className="d-flex justify-content-end">
                      <button type="submit" className="btn btn-primary btn-sm">
                        <i className="bi bi-plus-lg me-1" />
                        {editing ? "Update Task" : "Add Task"}
                      </button>
                      {editing && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm ms-2"
                          onClick={resetForm}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* list */}
              <div className="card shadow-sm tasks-list mt-4">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Tasks</h5>

                  <div className="d-flex align-items-center">
                    <button
                      type="button"
                      ref={filterBtnRef}
                      className="btn btn-outline-secondary btn-sm position-relative"
                      onClick={() => {
                        setShowFilters((s) => !s);
                        setShowSort(false); // close sort when opening filters
                      }}
                      title="Filter"
                      aria-expanded={showFilters}
                    >
                      <i className="bi bi-funnel" />
                      {activeFiltersCount > 0 && (
                        <span
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                          style={{ fontSize: "0.6rem" }}
                        >
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      ref={sortBtnRef}
                      className="btn btn-outline-secondary btn-sm ms-2"
                      onClick={() => {
                        setShowSort((s) => !s);
                        setShowFilters(false); // close filters when opening sort
                      }}
                      title="Sort"
                      aria-expanded={showSort}
                    >
                      <i className="bi bi-sort-down" />
                    </button>
                  </div>
                </div>

                {/* Filters UI */}
                {showFilters && (
                  <div
                    ref={filtersRef}
                    className="card-body border-bottom bg-light"
                    style={{ zIndex: 5 }}
                  >
                    <div className="row g-2 align-items-end">
                      <div className="col-md-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={filters.status}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, status: e.target.value }))
                          }
                        >
                          <option value="">All</option>
                          <option value="pending">Pending</option>
                          <option value="done">Done</option>
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Assigned User</label>
                        <select
                          className="form-select"
                          value={filters.user}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, user: e.target.value }))
                          }
                        >
                          <option value="">All</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Due After</label>
                        <input
                          type="date"
                          className="form-control"
                          value={filters.dueAfter}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, dueAfter: e.target.value }))
                          }
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Due Before</label>
                        <input
                          type="date"
                          className="form-control"
                          value={filters.dueBefore}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, dueBefore: e.target.value }))
                          }
                        />
                      </div>

                      <div className="col-12 d-flex justify-content-end mt-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={clearFilters}
                        >
                          Clear Filters
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowFilters(false)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sort UI */}
                {showSort && (
                  <div ref={sortRef} className="card-body border-bottom bg-light" style={{ zIndex: 5 }}>
                    <div className="d-flex align-items-center">
                      <label className="form-label mb-0 me-2">Sort by</label>
                      <select
                        className="form-select w-auto"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="dueDate">Due Date</option>
                        <option value="createdAt">Created At</option>
                        <option value="title">Title</option>
                        <option value="status">Status</option>
                      </select>

                      <div className="btn-group ms-3" role="group" aria-label="Sort order">
                        <button
                          type="button"
                          className={`btn btn-sm ${sortOrder === "asc" ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => setSortOrder("asc")}
                        >
                          Asc
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${sortOrder === "desc" ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => setSortOrder("desc")}
                        >
                          Desc
                        </button>
                      </div>

                      <div className="ms-auto">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={() => {
                            setSortBy("dueDate");
                            setSortOrder("asc");
                          }}
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowSort(false)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="card-body">
                  {filteredSortedTasks.length === 0 ? (
                    <p className="text-muted">No tasks match the current filters.</p>
                  ) : (
                    <div className="list-group">
                      {filteredSortedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{task.title}</h6>
                            <small className="text-muted">{formatDate(task.createdAt)}</small>
                            <p className="mb-1 small text-muted">{task.description}</p>
                            <div>
                              <span className="me-2">
                                <i className="bi bi-calendar-event" /> {formatDate(task.dueDate)}
                              </span>
                              <span className="badge bg-info me-2">
                                <i className="bi bi-person" /> {task.personId}
                              </span>
                              <span className={task.completed ? "badge bg-success" : "badge bg-warning text-dark"}>
                                {task.completed ? "Done" : "Pending"}
                              </span>
                            </div>
                          </div>

                          <div className="btn-group btn-group-sm ms-3">
                            <button
                              type="button"
                              className="btn btn-outline-success"
                              onClick={() => handleToggle(task)}
                              title="Complete"
                            >
                              <i className="bi bi-check-lg" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => startEdit(task)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(task.id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* end list */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Task;