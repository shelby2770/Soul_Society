import axios from "axios";

// Get the API URL from environment variables or use the Render backend URL
const API_URL =
  import.meta.env.VITE_API_URL || "https://soul-society.onrender.com";

// Create an axios instance with predefined config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Add an interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors but don't interfere with component error handling
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;
