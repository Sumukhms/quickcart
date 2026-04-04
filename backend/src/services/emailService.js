/**
 * emailService.js — FIXED
 *
 * Key fixes:
 *   1. Transporter is re-created fresh on each sendWithRetry attempt
 *      (was caching a broken transporter after first failure)
 *   2. Added detailed console logging for debugging
 *   3. Added environment variable validation at call time with clear errors
 *   4. Fixed verify() call — was silently failing and nulling transporter
 *      even when the connection was fine (async race condition)
 *   5. Added direct test export for health checks
 */
import nodemailer from "nodemailer";

// ── Create transporter fresh each time ──────────────────────────
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS must be set in .env\n" +
      "For Gmail, use an App Password (not your account password).\n" +
      "Steps: Google Account → Security → 2-Step Verification → App passwords"
    );
  }

  return nodemailer.createTransport({
    host:   "smtp.gmail.com",
    port:   587,
    secure: false,             // STARTTLS
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout:   10_000,
    socketTimeout:     15_000,
    logger: process.env.NODE_ENV === "development",   // log SMTP dialogue in dev
    debug:  false,
  });
}

// ── Retry wrapper ───────────────────────────────────────────────
async function sendWithRetry(mailOptions, attempts = 3) {
  let lastError;

  for (let i = 1; i <= attempts; i++) {
    let transporter;
    try {
      transporter = createTransporter();

      console.log(`[Email] Attempt ${i}/${attempts} → ${mailOptions.to} (${mailOptions.subject})`);

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email] ✅ Sent successfully. MessageId: ${info.messageId}`);
      return true;
    } catch (err) {
      lastError = err;
      console.error(`[Email] ⚠️  Attempt ${i}/${attempts} failed: ${err.message}`);

      if (i < attempts) {
        const delay = 1000 * Math.pow(2, i - 1); // 1s, 2s, 4s
        console.log(`[Email] Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    } finally {
      // Always close the transporter connection pool
      if (transporter) {
        try { transporter.close(); } catch (_) {}
      }
    }
  }

  console.error(`[Email] ❌ All ${attempts} attempts failed. Last error: ${lastError?.message}`);
  console.error("[Email] Check your EMAIL_USER / EMAIL_PASS in .env");
  console.error("[Email] Gmail requires an App Password, NOT your regular password.");
  return false;
}

// ── Shared HTML wrapper ─────────────────────────────────────────
function htmlWrapper(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#ff6b35,#e5521e);
                       padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;
                         letter-spacing:-0.5px;">⚡ QuickCart</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;text-align:center;
                       color:#9ca3af;font-size:12px;
                       border-top:1px solid #f3f4f6;">
              This email was sent by QuickCart. Please do not reply.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── OTP email ───────────────────────────────────────────────────
export async function sendOtpEmail(email, otp, purpose) {
  const isReset    = purpose === "reset_password";
  const subject    = isReset
    ? "Reset your QuickCart password"
    : "Verify your QuickCart email";
  const actionLine = isReset
    ? "Use the OTP below to reset your password."
    : "Use the OTP below to verify your email address.";

  const html = htmlWrapper(subject, `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
      ${isReset ? "Password Reset" : "Email Verification"}
    </h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
      ${actionLine}
    </p>
    <div style="background:#fff7f4;border:2px dashed #ff6b35;border-radius:12px;
                padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;
                text-transform:uppercase;letter-spacing:1px;font-weight:600;">
        Your OTP
      </p>
      <p style="margin:0;font-size:44px;font-weight:900;
                letter-spacing:10px;color:#ff6b35;font-family:monospace;">
        ${otp}
      </p>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
      ⏱ This OTP expires in <strong>10 minutes</strong>.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:13px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `);

  const fromAddress = process.env.EMAIL_FROM || `"QuickCart" <${process.env.EMAIL_USER}>`;

  return sendWithRetry({
    from:    fromAddress,
    to:      email,
    subject,
    html,
  });
}

// ── Welcome email ───────────────────────────────────────────────
export async function sendWelcomeEmail(email, name) {
  const html = htmlWrapper("Welcome to QuickCart!", `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
      Welcome, ${name}! 🎉
    </h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6;">
      Your email has been verified. You can now place orders from hundreds
      of local stores — delivered in minutes.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:14px;">
      Use code <strong style="color:#ff6b35;">QUICKFIRST</strong> on your
      first order for a discount!
    </p>
  `);

  const fromAddress = process.env.EMAIL_FROM || `"QuickCart" <${process.env.EMAIL_USER}>`;

  return sendWithRetry({
    from:    fromAddress,
    to:      email,
    subject: "Welcome to QuickCart 🚀",
    html,
  });
}

// ── Health check — call this on server startup to verify SMTP ──
export async function verifyEmailConfig() {
  try {
    const t = createTransporter();
    await t.verify();
    console.log("✅ SMTP connection verified — emails will send correctly");
    t.close();
    return true;
  } catch (err) {
    console.error("❌ SMTP verification failed:", err.message);
    console.error("   EMAIL_USER:", process.env.EMAIL_USER || "(not set)");
    console.error("   EMAIL_PASS:", process.env.EMAIL_PASS ? "(set, length=" + process.env.EMAIL_PASS.length + ")" : "(not set)");
    console.error("   Fix: Set EMAIL_USER and EMAIL_PASS (Gmail App Password) in .env");
    return false;
  }
}

// ── Order notification email ────────────────────────────────────
/**
 * Sends a transactional order status email to the customer.
 * Non-blocking — errors are logged but never thrown.
 *
 * @param {string} email       - customer email
 * @param {string} name        - customer name
 * @param {object} opts
 * @param {string} opts.status - order status key
 * @param {string} opts.orderId
 * @param {string} opts.storeName
 * @param {number} [opts.totalPrice]
 * @param {string} [opts.deliveryAddress]
 */
export async function sendOrderEmail(email, name, { status, orderId, storeName, totalPrice, deliveryAddress }) {
  const shortId = orderId?.toString().slice(-8).toUpperCase();

  const STATUS_CONTENT = {
    pending: {
      subject: `Order #${shortId} placed — QuickCart`,
      headline: "Order Placed! 🛒",
      body: `
        <p style="margin:0 0 12px;color:#6b7280;font-size:15px;line-height:1.6;">
          Hi <strong>${name}</strong>, your order from <strong>${storeName}</strong> has been received.
        </p>
        <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">Order ID</p>
          <p style="margin:0;font-size:18px;font-weight:900;color:#111827;font-family:monospace;">#${shortId}</p>
          ${totalPrice ? `<p style="margin:6px 0 0;font-size:14px;color:#374151;">Total: <strong>₹${totalPrice}</strong></p>` : ""}
          ${deliveryAddress ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">📍 ${deliveryAddress}</p>` : ""}
        </div>
        <p style="margin:0;color:#6b7280;font-size:14px;">
          You can track your order status in real-time on QuickCart.
        </p>`,
    },
    out_for_delivery: {
      subject: `Your order #${shortId} is on the way! 🛵`,
      headline: "Out for Delivery! 🛵",
      body: `
        <p style="margin:0 0 12px;color:#6b7280;font-size:15px;line-height:1.6;">
          Great news, <strong>${name}</strong>! A delivery partner has picked up your order from
          <strong>${storeName}</strong> and is heading to you now.
        </p>
        <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
          <p style="margin:0;font-size:28px;">🛵</p>
          <p style="margin:8px 0 0;font-weight:700;color:#ea580c;">Order #${shortId} is on the way</p>
          ${deliveryAddress ? `<p style="margin:4px 0 0;font-size:13px;color:#9a3412;">Delivering to: ${deliveryAddress}</p>` : ""}
        </div>
        <p style="margin:0;color:#6b7280;font-size:14px;">Open the app to track your rider's live location.</p>`,
    },
    delivered: {
      subject: `Order #${shortId} delivered! Thanks for ordering 🎉`,
      headline: "Order Delivered! 🎉",
      body: `
        <p style="margin:0 0 12px;color:#6b7280;font-size:15px;line-height:1.6;">
          Hey <strong>${name}</strong>, your order from <strong>${storeName}</strong> has been delivered. Enjoy!
        </p>
        <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
          <p style="margin:0;font-size:28px;">✅</p>
          <p style="margin:8px 0 0;font-weight:700;color:#16a34a;">Order #${shortId} — Delivered</p>
          ${totalPrice ? `<p style="margin:4px 0 0;font-size:13px;color:#15803d;">You paid ₹${totalPrice}</p>` : ""}
        </div>
        <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
          Please rate your experience on QuickCart to help us improve.
        </p>
        <p style="margin:0;color:#9ca3af;font-size:13px;">Thanks for choosing QuickCart ⚡</p>`,
    },
  };

  const content = STATUS_CONTENT[status];
  if (!content) return; // skip statuses we don't email for

  const html = htmlWrapper(content.headline, content.body);
  const fromAddress = process.env.EMAIL_FROM || `"QuickCart" <${process.env.EMAIL_USER}>`;

  // Fire-and-forget — never block the order flow
  sendWithRetry({ from: fromAddress, to: email, subject: content.subject, html })
    .catch((err) => console.error(`[OrderEmail] Failed for status=${status} orderId=${shortId}:`, err.message));
}