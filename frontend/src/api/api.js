import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: BASE });

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
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  toggleAvailability: () => api.patch("/auth/availability"),
};

// ─── Stores ────────────────────────────────────────────────────
export const storeAPI = {
  getAll: (params) => api.get("/stores", { params }),
  getById: (id) => api.get(`/stores/${id}`),
  getMine: () => api.get("/stores/mine"),
  create: (data) => api.post("/stores", data),
  update: (id, data) => api.put(`/stores/${id}`, data),
};

// ─── Products ──────────────────────────────────────────────────
export const productAPI = {
  getByStore: (storeId) => api.get(`/products/store/${storeId}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ─── Cart ──────────────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get("/cart"),
  add: (productId, quantity = 1) => api.post("/cart/add", { productId, quantity }),
  update: (productId, quantity) => api.put("/cart/update", { productId, quantity }),
  clear: () => api.delete("/cart/clear"),
};

// ─── Orders ────────────────────────────────────────────────────
export const orderAPI = {
  place: (data) => api.post("/orders", data),
  getMy: () => api.get("/orders/my"),
  getById: (id) => api.get(`/orders/${id}`),
  // Store
  getStoreOrders: (storeId, params) => api.get(`/orders/store/${storeId}`, { params }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  // Delivery
  getAvailable: () => api.get("/orders/delivery/available"),
  getMyDeliveries: (params) => api.get("/orders/delivery/mine", { params }),
  accept: (id) => api.post(`/orders/${id}/accept`),
  markDelivered: (id) => api.post(`/orders/${id}/delivered`),
  updateLocation: (id, lat, lng) => api.put(`/orders/${id}/location`, { lat, lng }),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

// ─── Coupons ───────────────────────────────────────────────────
export const couponAPI = {
  validate: (code, orderTotal, storeCategory) =>
    api.post("/coupons/validate", { code, orderTotal, storeCategory }),
  list: () => api.get("/coupons"),
};