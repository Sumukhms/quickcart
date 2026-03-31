import nodemailer from "nodemailer";

// ── Lazy singleton ────────────────────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",     // ✅ more reliable than service: gmail
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // ✅ VERIFY CONNECTION (DEBUG)
  _transporter.verify((error, success) => {
    if (error) {
      console.error("❌ EMAIL CONFIG ERROR:", error);
    } else {
      console.log("✅ Email server ready");
    }
  });

  return _transporter;
}

// ── Shared HTML wrapper ───────────────────────────────────────
function htmlWrapper(title, bodyHtml) {
  return `
    <!DOCTYPE html>
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

// ── OTP email ────────────────────────────────────────────────
export async function sendOtpEmail(email, otp, purpose) {
  const isReset    = purpose === "reset_password";
  const subject    = isReset ? "Reset your QuickCart password" : "Verify your QuickCart email";
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
                letter-spacing:10px;color:#ff6b35;">
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

  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html,
    });

    console.log("✅ OTP EMAIL SENT:", info.response);
  } catch (err) {
    console.error("❌ OTP EMAIL ERROR:", err);
  }
}

// ── Welcome email ─────────────────────────────────────────────
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

  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Welcome to QuickCart 🚀",
      html,
    });

    console.log("✅ WELCOME EMAIL SENT:", info.response);
  } catch (err) {
    console.error("❌ WELCOME EMAIL ERROR:", err);
  }
}