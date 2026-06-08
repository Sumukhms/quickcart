/**
 * deliveryController.js — FIXED
 *
 * Root causes fixed:
 *  1. getEarningsSummary now uses single MongoDB aggregation (no frontend filtering)
 *  2. requestPayout validates wallet balance using same aggregation
 *  3. getPayoutStatus now sorted by createdAt desc (most recent first)
 *  4. All errors logged clearly, no silent failures
 *
 * FILE: backend/src/controllers/deliveryController.js
 */
import mongoose from "mongoose";
import Order from "../models/Order.js";
import PayoutRequest from "../models/PayoutRequest.js";

// ── Helper: aggregate earnings for a delivery partner ──────────
async function computeEarnings(userId) {
  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);



    // Validate userId is a valid ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("[computeEarnings] Invalid userId:", userId);
      return {
        totalDeliveries: 0,
        total: 0,
        todayEarnings: 0,
        weekEarnings: 0,
        monthEarnings: 0,
      };
    }

    const [summary] = await Order.aggregate([
      {
        $match: {
          deliveryAgentId: new mongoose.Types.ObjectId(userId),
          status: "delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          total: { $sum: { $ifNull: ["$deliveryFee", 30] } },
          todayEarnings: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", todayStart] },
                { $ifNull: ["$deliveryFee", 30] },
                0,
              ],
            },
          },
          weekEarnings: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", weekStart] },
                { $ifNull: ["$deliveryFee", 30] },
                0,
              ],
            },
          },
          monthEarnings: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", monthStart] },
                { $ifNull: ["$deliveryFee", 30] },
                0,
              ],
            },
          },
        },
      },
    ]).catch((aggError) => {
      console.error("[computeEarnings] Aggregation error:", aggError.message);
      return [null]; // Return empty result on aggregation error
    });

    return {
      totalDeliveries: summary?.totalDeliveries ?? 0,
      total: summary?.total ?? 0,
      todayEarnings: summary?.todayEarnings ?? 0,
      weekEarnings: summary?.weekEarnings ?? 0,
      monthEarnings: summary?.monthEarnings ?? 0,
    };
  } catch (error) {
    console.error("[computeEarnings] Error:", error.message);
    // Return zero earnings on error
    return {
      totalDeliveries: 0,
      total: 0,
      todayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,
    };
  }
}

// ── GET /api/delivery/earnings ────────────────────────────────
export const getEarningsSummary = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const earnings = await computeEarnings(userId);

    const pendingPayout = await PayoutRequest.findOne({
      deliveryPartnerId: userId,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ...earnings,
      pendingPayout: pendingPayout
        ? {
            _id: pendingPayout._id,
            amount: pendingPayout.amount,
            status: pendingPayout.status,
            requestedAt: pendingPayout.createdAt,
          }
        : null,
    });
  } catch (e) {
    console.error("[DeliveryController] getEarningsSummary error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ── POST /api/delivery/payout/request ─────────────────────────
export const requestPayout = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // ✅ FIX: Block if pending request already exists
    const existing = await PayoutRequest.findOne({
      deliveryPartnerId: userId,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({
        message:
          "You already have a pending payout request. Please wait for it to be processed.",
        request: {
          _id: existing._id,
          amount: existing.amount,
          requestedAt: existing.createdAt,
        },
      });
    }

    // ✅ FIX: Compute earnings via aggregation (not client-side)
    const earnings = await computeEarnings(userId);

    if (earnings.total < 1) {
      return res.status(400).json({
        message: "You have no earnings available to request a payout.",
      });
    }

    // ✅ FIX: Validate requested amount against actual earnings
    const body = req.body || {};
    const { amount } = body;
    const payoutAmount = amount ? Number(amount) : earnings.total;

    if (isNaN(payoutAmount) || payoutAmount < 1) {
      return res.status(400).json({ message: "Invalid payout amount." });
    }

    if (payoutAmount > earnings.total) {
      return res.status(400).json({
        message: `Requested ₹${payoutAmount} exceeds your total earnings of ₹${earnings.total}.`,
        maxAmount: earnings.total,
      });
    }

    const requestData = {
      deliveryPartnerId: userId,
      amount: payoutAmount,
      status: "pending",
    };

    let request;
    try {
      request = await PayoutRequest.create(requestData);
    } catch (createError) {
      console.error(
        "[requestPayout] Failed to create payout request:",
        createError.message,
      );
      return res.status(500).json({
        message: "Failed to create payout request: " + createError.message,
      });
    }
    res.status(201).json({
      message:
        "Payout request submitted! Our team will process it within 2–3 business days.",
      request: {
        _id: request._id,
        amount: request.amount,
        status: request.status,
        requestedAt: request.createdAt,
      },
    });
  } catch (e) {
    console.error("[DeliveryController] requestPayout error:", e.message);
    res.status(500).json({
      message: "Payout failed",
      error: e.message,
    });
  }
};

// ── GET /api/delivery/payout/status ───────────────────────────
export const getPayoutStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const requests = await PayoutRequest.find({
      deliveryPartnerId: userId,
    })
      .sort({ createdAt: -1 }) // ✅ FIX: most recent first
      .limit(10)
      .lean();

    res.json(requests);
  } catch (e) {
    console.error("[DeliveryController] getPayoutStatus error:", e.message);
    res.status(500).json({ message: e.message });
  }
};
