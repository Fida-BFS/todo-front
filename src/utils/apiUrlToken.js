// Base API URL
export const API_URL = "http://localhost:8080/api"; 
// ⚠️ Change the URL above to match your backend

// Function to attach JWT token from localStorage
export const authConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};
