import React, { useEffect, useState } from "react";
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

  // fetch tasks
  const fetchTasks = async () => {
    console.log("Fetching tasks...");
    await fetchAllTasks()
      .then((res) => {
        if (res.status === 200) {
          const normalized = res.data.map((t) => ({
            ...t,
            dueDate: t.dueDate ? t.dueDate.slice(0, 16) : "",
          }));
          setTasks(normalized);
        } else {
          console.log("Unexpected status:", res.status);
        }
      })
      .catch((err) => console.error("Error loading tasks:", err));
  };

  // fetch users
  const fetchUsersList = async () => {
    await fetchAllUsers()
      .then((res) => {
        if (res.status === 200) {
          setUsers(res.data);
        }
      })
      .catch((err) => console.error("Error loading users:", err));
  };
//Updates form values when typing in inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
//Handles file uploads, stores files in attachments
  const handleFiles = (e) => {
    setForm({ ...form, attachments: Array.from(e.target.files) });
  };
//Pre-fills the form with task values so the user can edit
  const startEdit = (task) => {
    setEditing(task.id);
    setForm({
      title: task.title,
      description: task.description,
      completed: task.completed,
      dueDate: task.dueDate,
      personId: task.personId || "",
      attachments: [],
    });
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
      fetchTasks();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

const handleDelete = async (id) => {
  const user = authService.getCurrentUser();
   console.log("Current user object:", user);

  if (!authService.isAdmin(user)) {
    setErrorMsg("❌ You are not allowed to delete tasks.");
    return;
  }

  if (!window.confirm("Delete this task?")) return;

  setTasks((prev) => prev.filter((t) => t.id !== id));
  if (editing === id) resetForm();

  try {
    const res = await deleteTask(id);
    if (res.status === 200 || res.status === 204) {
      console.log("Task deleted successfully.");
    }
  } catch (err) {
    console.error("Delete failed:", err);
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
            <div className="col-md-8 mx-auto" >
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
                          <i className="bi bi-x-lg"></i>
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
                        <i className="bi bi-plus-lg me-1"></i>
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
                <div className="card-header bg-white">
                  <h5 className="card-title mb-0">Tasks</h5>
                </div>
                <div className="card-body">
                  {tasks.length === 0 && (
                    <p className="text-muted">No tasks yet.</p>
                  )}
                  <div className="list-group">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{task.title}</h6>
                          <small className="text-muted">
                            {formatDate(task.createdAt)}
                          </small>
                          <p className="mb-1 small text-muted">
                            {task.description}
                          </p>
                          <div>
                            <span className="me-2">
                              <i className="bi bi-calendar-event"></i>{" "}
                              {formatDate(task.dueDate)}
                            </span>
                            <span className="badge bg-info me-2">
                              <i className="bi bi-person"></i> {task.personId}
                            </span>
                            <span
                              className={
                                task.completed
                                  ? "badge bg-success"
                                  : "badge bg-warning text-dark"
                              }
                            >
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
                            <i className="bi bi-check-lg"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => startEdit(task)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(task.id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Task;
