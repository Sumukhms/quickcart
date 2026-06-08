import User from "../models/User.js";
import { sendOrderEmail } from "./emailService.js";

export async function sendOrderStatusEmail({
  userId,
  status,
  orderId,
  storeName,
  totalPrice,
  deliveryAddress,
}) {
  try {
    const customer = await User.findById(userId)
      .select("name email")
      .lean();

    if (!customer?.email) return;

    await sendOrderEmail(
      customer.email,
      customer.name,
      {
        status,
        orderId,
        storeName,
        totalPrice,
        deliveryAddress,
      }
    );
  } catch (err) {
    console.error(
      "[sendOrderStatusEmail]",
      err.message
    );
  }
}