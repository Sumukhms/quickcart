/**
 * useRazorpay.js
 *
 * Custom hook that:
 *   1. Dynamically loads the Razorpay checkout script (once)
 *   2. Exposes an `initiatePayment(options)` function
 *
 * Usage in CheckoutPage:
 *   const { initiatePayment, loading: rpLoading } = useRazorpay();
 *
 *   const result = await initiatePayment({
 *     razorpayOrderId,
 *     amount,           // in paise (from backend)
 *     currency,
 *     keyId,
 *     name:    user.name,
 *     email:   user.email,
 *     contact: user.phone || "",
 *   });
 *   // result: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 *   // throws if user dismisses or payment fails
 */
import { useState, useEffect } from "react";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    loadScript(RAZORPAY_SCRIPT)
      .then(() => setScriptReady(true))
      .catch((err) => console.error(err));
  }, []);

  /**
   * Opens the Razorpay checkout popup.
   *
   * @returns Promise<{ razorpay_payment_id, razorpay_order_id, razorpay_signature }>
   * @throws  Error if user cancels or payment fails
   */
  const initiatePayment = ({
    razorpayOrderId,
    amount,
    currency = "INR",
    keyId,
    name = "QuickCart",
    email = "",
    contact = "",
    description = "Order payment",
  }) => {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error("Razorpay SDK not loaded"));
        return;
      }

      const options = {
        key: keyId,
        amount: amount, // paise (already converted by backend)
        currency: currency,
        name: "QuickCart",
        description: description,
        order_id: razorpayOrderId,
        
        prefill: { name, email, contact },
        theme: { color: "#ff6b35" }, // QuickCart brand colour

        handler: (response) => {
          resolve({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
        },

        modal: {
          ondismiss: () => {
            reject(new Error("Payment cancelled by user"));
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        reject(new Error(response.error?.description || "Payment failed"));
      });

      rzp.open();
    });
  };

  return { initiatePayment, loading, setLoading, scriptReady };
}
