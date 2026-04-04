/**
 * deliveryController.js
 *
 * Handles delivery-partner specific features:
 *   POST /api/delivery/payout/request  – request a payout
 *   GET  /api/delivery/payout/status   – current payout request status
 *   GET  /api/delivery/earnings        – earnings summary (for dashboard)
 *
 * No real payment processing — payout = DB flag for admin to act on.
 */
import Order          from "../models/Order.js";
import PayoutRequest  from "../models/PayoutRequest.js";

// ── GET /api/delivery/earnings ────────────────────────────────
// Returns total earnings + per-period breakdowns + delivery count
export const getEarningsSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    const deliveries = await Order.find({
      deliveryAgentId: userId,
      status:          "delivered",
    }).select("deliveryFee totalPrice createdAt");

    const now         = new Date();
    const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart   = new Date(now - 7 * 86_400_000);
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

    const fee = (d) => d.deliveryFee ?? 30;

    const total        = deliveries.reduce((s, d) => s + fee(d), 0);
    const todayEarnings = deliveries
      .filter((d) => new Date(d.createdAt) >= todayStart)
      .reduce((s, d) => s + fee(d), 0);
    const weekEarnings  = deliveries
      .filter((d) => new Date(d.createdAt) >= weekStart)
      .reduce((s, d) => s + fee(d), 0);
    const monthEarnings = deliveries
      .filter((d) => new Date(d.createdAt) >= monthStart)
      .reduce((s, d) => s + fee(d), 0);

    // Find any pending payout request
    const pendingPayout = await PayoutRequest.findOne({
      deliveryPartnerId: userId,
      status:            "pending",
    }).sort({ createdAt: -1 }).lean();

    res.json({
      totalDeliveries: deliveries.length,
      total,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      pendingPayout: pendingPayout
        ? {
            _id:         pendingPayout._id,
            amount:      pendingPayout.amount,
            status:      pendingPayout.status,
            requestedAt: pendingPayout.createdAt,
          }
        : null,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── POST /api/delivery/payout/request ─────────────────────────
export const requestPayout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Block if there's already a pending request
    const existing = await PayoutRequest.findOne({
      deliveryPartnerId: userId,
      status:            "pending",
    });

    if (existing) {
      return res.status(400).json({
        message: "You already have a pending payout request. Please wait for it to be processed.",
        request: {
          _id:         existing._id,
          amount:      existing.amount,
          requestedAt: existing.createdAt,
        },
      });
    }

    // Calculate requestable amount (all-time total, simplified)
    const deliveries = await Order.find({
      deliveryAgentId: userId,
      status:          "delivered",
    }).select("deliveryFee");

    const totalEarned = deliveries.reduce((s, d) => s + (d.deliveryFee ?? 30), 0);

    if (totalEarned < 1) {
      return res.status(400).json({
        message: "You have no earnings to request a payout for.",
      });
    }

    const { amount } = req.body;
    const payoutAmount = amount ? Number(amount) : totalEarned;

    if (isNaN(payoutAmount) || payoutAmount < 1) {
      return res.status(400).json({ message: "Invalid payout amount." });
    }

    if (payoutAmount > totalEarned) {
      return res.status(400).json({
        message: `Requested amount ₹${payoutAmount} exceeds total earnings ₹${totalEarned}.`,
        maxAmount: totalEarned,
      });
    }

    const request = await PayoutRequest.create({
      deliveryPartnerId: userId,
      amount:            payoutAmount,
      status:            "pending",
    });

    res.status(201).json({
      message: "Payout request submitted! Our team will process it within 2–3 business days.",
      request: {
        _id:         request._id,
        amount:      request.amount,
        status:      request.status,
        requestedAt: request.createdAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── GET /api/delivery/payout/status ───────────────────────────
export const getPayoutStatus = async (req, res) => {
  try {
    const requests = await PayoutRequest.find({
      deliveryPartnerId: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json(requests);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};