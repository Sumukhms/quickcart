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

// ─── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login:             (data)    => api.post("/auth/login", data),
  register:          (data)    => api.post("/auth/register", data),
  getProfile:        ()        => api.get("/auth/profile"),
  updateProfile:     (data)    => api.put("/auth/profile", data),
  toggleAvailability: ()       => api.patch("/auth/availability"),
  addAddress:        (address) => api.post("/auth/addresses", { address }),
  removeAddress:     (index)   => api.delete(`/auth/addresses/${index}`),
  setDefaultAddress: (index)   => api.patch(`/auth/addresses/${index}/default`),
};

// ─── Stores ───────────────────────────────────────────────────
export const storeAPI = {
  getAll:  (params)     => api.get("/stores", { params }),
  getById: (id)         => api.get(`/stores/${id}`),
  getMine: ()           => api.get("/stores/mine"),
  create:  (data)       => api.post("/stores", data),
  update:  (id, data)   => api.put(`/stores/${id}`, data),
};

// ─── Products ─────────────────────────────────────────────────
export const productAPI = {
  getByStore: (storeId)      => api.get(`/products/store/${storeId}`),
  search:     (q)            => api.get("/products/search", { params: { q } }),
  create:     (data)         => api.post("/products", data),
  update:     (id, data)     => api.put(`/products/${id}`, data),
  delete:     (id)           => api.delete(`/products/${id}`),
};

// ─── Cart ─────────────────────────────────────────────────────
export const cartAPI = {
  get:    ()                    => api.get("/cart"),
  add:    (productId, quantity = 1) => api.post("/cart/add", { productId, quantity }),
  update: (productId, quantity) => api.put("/cart/update", { productId, quantity }),
  clear:  ()                    => api.delete("/cart/clear"),
};

// ─── Orders ───────────────────────────────────────────────────
export const orderAPI = {
  place:          (data)           => api.post("/orders", data),
  getMy:          ()               => api.get("/orders/my"),
  getById:        (id)             => api.get(`/orders/${id}`),
  getStoreOrders: (storeId, params)=> api.get(`/orders/store/${storeId}`, { params }),
  updateStatus:   (id, status)     => api.put(`/orders/${id}/status`, { status }),
  getAvailable:   ()               => api.get("/orders/delivery/available"),
  getMyDeliveries:(params)         => api.get("/orders/delivery/mine", { params }),
  accept:         (id)             => api.post(`/orders/${id}/accept`),
  markDelivered:  (id)             => api.post(`/orders/${id}/delivered`),
  updateLocation: (id, lat, lng)   => api.put(`/orders/${id}/location`, { lat, lng }),
  cancel:         (id)             => api.post(`/orders/${id}/cancel`),
};

// ─── Coupons ──────────────────────────────────────────────────
export const couponAPI = {
  validate: (code, orderTotal, storeCategory) =>
    api.post("/coupons/validate", { code, orderTotal, storeCategory }),
  list: () => api.get("/coupons"),
};

// ─── Ratings ──────────────────────────────────────────────────
export const ratingAPI = {
  submit: (storeId, rating, orderId) =>
    api.post("/ratings/rate", { storeId, rating, orderId }),
};

// ─── Payment ──────────────────────────────────────────────────
export const paymentAPI = {
  /**
   * Ask backend to create a Razorpay order.
   * Returns { razorpayOrderId, amount, currency, keyId }
   */
  createOrder: (amount) =>
    api.post("/payment/create-order", { amount }),

  /**
   * Verify payment signature on the backend.
   * If valid, backend creates the DB order and returns it.
   *
   * @param {object} payload
   *   razorpay_payment_id, razorpay_order_id, razorpay_signature,
   *   orderData: { storeId, items, totalPrice, deliveryAddress,
   *                paymentMethod, notes?, couponCode? }
   */
  verify: (payload) =>
    api.post("/payment/verify", payload),
};

// ─── Favorites ────────────────────────────────────────────────
export const favoriteAPI = {
  toggle:  (storeId) => api.post("/favorites/toggle", { storeId }),
  getAll:  ()        => api.get("/favorites"),
};

// ─── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  getStats:      ()           => api.get("/admin/stats"),
  getUsers:      (params)     => api.get("/admin/users", { params }),
  getOrders:     (params)     => api.get("/admin/orders", { params }),
  getCoupons:    ()           => api.get("/admin/coupons"),
  createCoupon:  (data)       => api.post("/admin/coupons", data),
  deleteCoupon:  (id)         => api.delete(`/admin/coupons/${id}`),
  toggleCoupon:  (id)         => api.patch(`/admin/coupons/${id}/toggle`),
  getAnalytics:  ()           => api.get("/stores/analytics"),
};