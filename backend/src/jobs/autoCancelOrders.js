// ══════════════════════════════════════════════════════════════════
// FEATURE 4: Order Auto-Cancellation via node-cron
// FILE: backend/src/jobs/autoCancelOrders.js  (NEW FILE)
// ══════════════════════════════════════════════════════════════════

import cron    from "node-cron";
import Order   from "../models/Order.js";
import Product from "../models/Product.js";
import { notifyOrderStatus } from "../services/notificationService.js";

const PENDING_TIMEOUT_MINUTES = 15;

/**
 * Cancels orders that have been "pending" for more than 15 minutes.
 * Restores stock and notifies the customer.
 */
export function startAutoCancelJob(io) {
  // Run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    const cutoff = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60_000);

    try {
      const staleOrders = await Order.find({
        status:    "pending",
        createdAt: { $lte: cutoff },
      }).populate("storeId", "name");

      if (staleOrders.length === 0) return;

      console.log(`[AutoCancel] Cancelling ${staleOrders.length} stale pending order(s)...`);

      for (const order of staleOrders) {
        // ── 1. Cancel the order ────────────────────────────────
        order.status = "cancelled";
        order.statusHistory.push({
          status:    "cancelled",
          timestamp: new Date(),
          updatedBy: null,                // system action
        });
        await order.save();

        // ── 2. Restore stock ───────────────────────────────────
        const restoreOps = (order.items || [])
          .filter((i) => i.productId && i.quantity)
          .map((i) => ({
            updateOne: {
              filter: { _id: i.productId },
              update: { $inc: { stock: i.quantity } },
            },
          }));

        if (restoreOps.length) {
          await Product.bulkWrite(restoreOps);
          // Re-enable any products whose stock went back above 0
          const productIds = order.items.map((i) => i.productId).filter(Boolean);
          await Product.updateMany(
            { _id: { $in: productIds }, stock: { $gt: 0 }, available: false },
            { $set: { available: true } }
          );
        }

        // ── 3. Notify customer via socket ──────────────────────
        io?.to(`user_${order.userId.toString()}`).emit("order_status_update", {
          orderId: order._id,
          status:  "cancelled",
        });

        // ── 4. Send in-app notification ────────────────────────
        notifyOrderStatus(io, {
          userId:    order.userId,
          orderId:   order._id,
          storeName: order.storeId?.name || "the store",
          status:    "cancelled",
        }).catch(() => {});

        console.log(`[AutoCancel] Order ${order._id} cancelled (was pending > ${PENDING_TIMEOUT_MINUTES}min)`);
      }
    } catch (err) {
      console.error("[AutoCancel] Job error:", err.message);
    }
  });

  console.log(`✅ Auto-cancel job started — cancels orders pending > ${PENDING_TIMEOUT_MINUTES}min (runs every 5min)`);
}

