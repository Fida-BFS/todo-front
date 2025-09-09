import axios from "axios";
import { authService } from "./authService";

export const USERS_URL = "http://localhost:9090/api/person";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` },
});

// Fetch all users
export const fetchAllUsers = async () => {
  return await axios.get(USERS_URL, authHeader());
};

// Create user (POST /register)
export const createUser = async (data) => {
  return await axios.post(`${USERS_URL}/register`, data, {
    headers: {
      ...authHeader().headers,
      "Content-Type": "application/json",
    },
  });
};

// Update user
export const updateUser = async (id, data) => {
  return await axios.put(`${USERS_URL}/${id}`, data, {
    headers: {
      ...authHeader().headers,
      "Content-Type": "application/json",
    },
  });
};

// Delete user
export const deleteUser = async (id) => {
  return await axios.delete(`${USERS_URL}/${id}`, authHeader());
};
