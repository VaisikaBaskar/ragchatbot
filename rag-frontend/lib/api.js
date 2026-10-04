import axios from "axios";
import Cookies from "js-cookie";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  // Route through Next.js rewrite to avoid emulator CORS/network edge cases.
  return "/backend";
};

const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Prevent infinite hangs in emulator network configurations
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }
  if (!token) {
    token = Cookies.get("token");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global interceptor for gracefully handling expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== "undefined") {
        // Clear ALL authentication data to prevent stale auth state
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        Cookies.remove("token");
        
        // Only redirect if we are not already on the login or register page to avoid swallowing validation errors!
        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
