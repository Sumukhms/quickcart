/**
 * addressController.js
 *
 * Handles structured address management for logged-in users.
 *
 * Routes (mounted at /api/addresses):
 *   GET    /           – list all addresses for current user
 *   POST   /           – add a new address (max 5)
 *   PUT    /:id        – update an address
 *   DELETE /:id        – delete an address
 *   PATCH  /:id/default – set as default
 *   POST   /from-coords – reverse-geocode lat/lng → prefilled fields
 */
import Address from "../models/Address.js";

// ── Helpers ─────────────────────────────────────────────────
function buildOneLiner(addr) {
  return [addr.street, addr.area, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(", ");
}

function sanitize(body) {
  return {
    label:    body.label    || "Home",
    street:   body.street?.trim()   || "",
    area:     body.area?.trim()     || "",
    city:     body.city?.trim()     || "",
    state:    body.state?.trim()    || "",
    pincode:  body.pincode?.trim()  || "",
    landmark: body.landmark?.trim() || "",
    lat:      body.lat  != null ? Number(body.lat)  : null,
    lng:      body.lng  != null ? Number(body.lng)  : null,
  };
}

// ── GET /api/addresses ────────────────────────────────────────
export const listAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.userId })
      .sort({ isDefault: -1, createdAt: 1 });
    res.json(addresses);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── POST /api/addresses ───────────────────────────────────────
export const addAddress = async (req, res) => {
  try {
    const data = sanitize(req.body);

    if (!data.street) return res.status(400).json({ message: "Street is required" });
    if (!data.city)   return res.status(400).json({ message: "City is required" });
    if (!data.state)  return res.status(400).json({ message: "State is required" });
    if (!/^\d{6}$/.test(data.pincode))
      return res.status(400).json({ message: "Pincode must be exactly 6 digits" });

    // If this is the first address for the user, make it default
    const existing = await Address.countDocuments({ userId: req.user.userId });
    const isDefault = existing === 0 ? true : !!req.body.isDefault;

    const address = await Address.create({
      ...data,
      userId:    req.user.userId,
      isDefault,
    });

    res.status(201).json(address);
  } catch (e) {
    if (e.message.includes("Maximum 5 addresses")) {
      return res.status(400).json({ message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
};

// ── PUT /api/addresses/:id ────────────────────────────────────
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    const data = sanitize(req.body);

    if (data.pincode && !/^\d{6}$/.test(data.pincode)) {
      return res.status(400).json({ message: "Pincode must be exactly 6 digits" });
    }

    Object.assign(address, data);
    await address.save();
    res.json(address);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── DELETE /api/addresses/:id ─────────────────────────────────
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    // If we deleted the default, promote the oldest remaining to default
    if (address.isDefault) {
      const next = await Address.findOne({ userId: req.user.userId }).sort({ createdAt: 1 });
      if (next) { next.isDefault = true; await next.save(); }
    }

    res.json({ message: "Address deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── PATCH /api/addresses/:id/default ─────────────────────────
export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    address.isDefault = true;   // pre-save hook clears others
    await address.save();

    const all = await Address.find({ userId: req.user.userId }).sort({ isDefault: -1, createdAt: 1 });
    res.json(all);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── POST /api/addresses/from-coords ──────────────────────────
// Uses OpenStreetMap Nominatim (free, no API key) to reverse-geocode
// a lat/lng into structured address fields.
export const addressFromCoords = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

    const response = await fetch(url, {
      headers: { "User-Agent": "QuickCart/1.0 (engineering-project)" },
    });

    if (!response.ok) {
      return res.status(502).json({ message: "Geocoding service unavailable" });
    }

    const data = await response.json();
    if (!data || data.error) {
      return res.status(404).json({ message: "Location not found" });
    }

    const a = data.address || {};

    // Map OSM fields → our schema
    const prefilled = {
      street:   [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean).join(", "),
      area:     a.suburb || a.neighbourhood || a.quarter || a.city_district || "",
      city:     a.city || a.town || a.village || a.county || "",
      state:    a.state || "",
      pincode:  a.postcode || "",
      landmark: a.amenity || a.building || "",
      lat:      Number(lat),
      lng:      Number(lng),
      // raw display name for the user to review
      displayName: data.display_name || "",
    };

    res.json(prefilled);
  } catch (e) {
    res.status(500).json({ message: "Failed to reverse-geocode location" });
  }
};