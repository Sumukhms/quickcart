/**
 * response.js
 *
 * Consistent API response envelope helpers.
 *
 * Usage in controllers:
 *   import { success, fail } from "../utils/response.js";
 *
 *   res.json(success(data));
 *   res.status(400).json(fail("Bad input"));
 *   res.json(success(orders, { total: 42, page: 1 }));
 */
export const success = (data, meta = {}) => ({ ok: true, ...meta, data });
export const fail = (message, code = "ERROR") => ({ ok: false, code, message });