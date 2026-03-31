/**
 * Consistent API response helpers.
 * Usage: res.json(success({ data })) or res.status(400).json(fail("Bad input"))
 */
export const success = (data, meta = {}) => ({ ok: true, ...meta, data });
export const fail    = (message, code = "ERROR") => ({ ok: false, code, message });