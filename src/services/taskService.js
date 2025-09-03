import axios from "axios";
import { authService } from "./authService";

export const API_URL = "http://localhost:9090/api/todo";
export const USERS_URL = "http://localhost:9090/api/person";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` },
});

// Fetch all tasks
export const fetchAllTasks = async () => {
  return await axios.get(API_URL, authHeader());
};

// Fetch all users
export const fetchAllUsers = async () => {
  return await axios.get(USERS_URL, authHeader());
};

// Create new task
export const createTask = async (formData) => {
  const fd = buildFormData(formData);
  return await axios.post(API_URL, fd, authHeader());
};

// Update task
export const updateTask = async (id, formData) => {
  const fd = buildFormData(formData);
  return await axios.put(`${API_URL}/${id}`, fd, authHeader());
};

// Delete task
export const deleteTask = async (id) => {
  return await axios.delete(`${API_URL}/${id}`, authHeader());
};

// Toggle completed
export const toggleTaskStatus = async (task) => {
  const updated = { ...task, completed: !task.completed };
  const fd = buildFormData(updated);
  return await axios.put(`${API_URL}/${task.id}`, fd, authHeader());
};

// helper for FormData
const buildFormData = (data) => {
  const fd = new FormData();
  const todoData = {
    title: data.title,
    description: data.description,
    completed: data.completed,
    dueDate: data.dueDate,
    personId: data.personId || null,
  };
  fd.append("todo", new Blob([JSON.stringify(todoData)], { type: "application/json" }));
  if (data.attachments?.length) {
    data.attachments.forEach((file) => fd.append("files", file));
  }
  return fd;
};
