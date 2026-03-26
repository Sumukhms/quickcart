import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("qc-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("qc-token");
      localStorage.removeItem("qc-user");
    }
    return Promise.reject(err);
  }
);

export default api;