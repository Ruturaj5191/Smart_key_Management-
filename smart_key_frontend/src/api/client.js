import axios from "axios";

const baseURL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("TOKEN");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
