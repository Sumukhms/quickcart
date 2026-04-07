import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE,
  timeout: 30_000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("qc-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    const skipRefresh = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/auth/logout",
      "/auth/google",
    ];
    const isSkipped = skipRefresh.some((p) => originalRequest.url?.includes(p));

    if (
      err.response?.status === 401 &&
      !originalRequest._retried &&
      !isSkipped
    ) {
      originalRequest._retried = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const { data } = await api.post("/auth/refresh");
        const newToken = data.token;

        localStorage.setItem("qc-token", newToken);
        if (data.user) {
          localStorage.setItem("qc-user", JSON.stringify(data.user));
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem("qc-token");
        localStorage.removeItem("qc-user");

        const authPages = [
          "/login",
          "/register",
          "/forgot-password",
          "/auth/callback",
        ];
        const isAuthPage = authPages.some((p) =>
          window.location.pathname.startsWith(p),
        );
        if (!isAuthPage) {
          window.location.replace("/login");
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  verifyEmail: (data) => api.post("/auth/verify-email", data),
  resendVerification: (email) =>
    api.post("/auth/resend-verification", { email }),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  toggleAvailability: () => api.patch("/auth/availability"),
  // ✅ FIX: keep old string-address endpoints for backward compat on profile page
  addAddress: (address) => api.post("/auth/addresses", { address }),
  removeAddress: (index) => api.delete(`/auth/addresses/${index}`),
  setDefaultAddress: (index) => api.patch(`/auth/addresses/${index}/default`),
  deleteAccount: (data) => api.delete("/auth/account", { data }),
  logout: () => api.post("/auth/logout"),
  logoutAll: () => api.post("/auth/logout-all"),
  refresh: () => api.post("/auth/refresh"),
};

// ─── Stores ───────────────────────────────────────────────────
export const storeAPI = {
  getAll: (params) => api.get("/stores", { params }),
  getById: (id) => api.get(`/stores/${id}`),
  getMine: () => api.get("/stores/mine"),
  create: (data) => api.post("/stores", data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  // ✅ FIX: analytics endpoint is on /stores/analytics (store-protected route)
  getAnalytics: () => api.get("/stores/analytics"),
};

// ─── Products ─────────────────────────────────────────────────
export const productAPI = {
  getByStore: (storeId) => api.get(`/products/store/${storeId}`),
  search: (q) => api.get("/products/search", { params: { q } }),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ─── Cart ─────────────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get("/cart"),
  add: (productId, quantity = 1) =>
    api.post("/cart/add", { productId, quantity }),
  update: (productId, quantity) =>
    api.put("/cart/update", { productId, quantity }),
  clear: () => api.delete("/cart/clear"),
};

// ─── Orders ───────────────────────────────────────────────────
export const orderAPI = {
  place: (data) => api.post("/orders", data),
  getMy: () => api.get("/orders/my"),
  getById: (id) => api.get(`/orders/${id}`),
  getStoreOrders: (storeId, params) =>
    api.get(`/orders/store/${storeId}`, { params }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getAvailable: () => api.get("/orders/delivery/available"),
  getMyDeliveries: (params) => api.get("/orders/delivery/mine", { params }),
  accept: (id) => api.post(`/orders/${id}/accept`),
  updateLocation: (id, lat, lng) =>
    api.put(`/orders/${id}/location`, { lat, lng }),
  // ✅ FIX: cancel uses POST /:id/cancel (not DELETE)
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

// ─── Invoice ──────────────────────────────────────────────────
export const invoiceAPI = {
  /**
   * Download order invoice as PDF blob.
   * Returns a Blob that the caller should convert to an object URL.
   */
  download: (orderId) =>
    api.get(`/orders/${orderId}/invoice`, {
      responseType: "blob", // ✅ tells axios to handle binary response
      headers: { Accept: "application/pdf" },
    }),
};

// ─── Coupons (platform-wide) ──────────────────────────────────
export const couponAPI = {
  validate: (code, orderTotal, storeCategory, storeId) =>
    api.post("/coupons/validate", { code, orderTotal, storeCategory, storeId }),
  list: () => api.get("/coupons"),
};

// ─── Store Coupons (store-owner specific) ─────────────────────
export const storeCouponAPI = {
  list: () => api.get("/store-coupons"),
  create: (data) => api.post("/store-coupons", data),
  toggle: (id) => api.patch(`/store-coupons/${id}/toggle`),
  delete: (id) => api.delete(`/store-coupons/${id}`),
};

// ─── Ratings ──────────────────────────────────────────────────
export const ratingAPI = {
  submit: (storeId, rating, orderId) =>
    api.post("/ratings/rate", { storeId, rating, orderId }),
};

// ─── Payment ──────────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (amount, items, couponCode) =>
    api.post("/payment/create-order", { amount, items, couponCode }),
  verify: (payload) => api.post("/payment/verify", payload),
};

// ─── Favorites ────────────────────────────────────────────────
export const favoriteAPI = {
  toggle: (storeId) => api.post("/favorites/toggle", { storeId }),
  getAll: () => api.get("/favorites"),
};

// ─── Inventory ────────────────────────────────────────────────
export const inventoryAPI = {
  get: () => api.get("/inventory"),
  getAlerts: () => api.get("/inventory/alerts"),
  updateStock: (id, data) => api.patch(`/inventory/${id}/stock`, data),
  toggle: (id) => api.patch(`/inventory/${id}/toggle`),
  bulkUpdate: (updates) => api.post("/inventory/bulk", { updates }),
};

// ─── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params) => api.get("/admin/users", { params }),
  getOrders: (params) => api.get("/admin/orders", { params }),
  getCoupons: () => api.get("/admin/coupons"),
  createCoupon: (data) => api.post("/admin/coupons", data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  toggleCoupon: (id) => api.patch(`/admin/coupons/${id}/toggle`),
  getBanners: () => api.get("/admin/banners"),
  createBanner: (data) => api.post("/admin/banners", data),
  updateBanner: (id, data) => api.put(`/admin/banners/${id}`, data),
  deleteBanner: (id) => api.delete(`/admin/banners/${id}`),
  toggleBanner: (id) => api.patch(`/admin/banners/${id}/toggle`),
  // ✅ FIX: store analytics is a store-protected route, admin uses it via store owner context
  // Admin panel's StoreAnalytics component calls this — it works because admin role
  // bypasses restrictTo("store") check. But to be safe, use the direct store route.
  getAnalytics: () => api.get("/stores/analytics"),
  getPayouts: (params) => api.get("/admin/payouts", { params }),
  processPayout: (id, action, note) =>
    api.patch(`/admin/payout/${id}`, { action, note }),
  getRefunds: (params) => api.get("/admin/refunds", { params }),
  processRefund: (orderId, action, amount, reason) =>
    api.post(`/admin/refunds/${orderId}/process`, { action, amount, reason }),
};

export const statsAPI = {
  getHome: () => api.get("/stats/home"),
};

export const locationAPI = {
  update: (orderId, lat, lng) => api.post(`/location/${orderId}`, { lat, lng }),
  get: (orderId) => api.get(`/location/${orderId}`),
};
