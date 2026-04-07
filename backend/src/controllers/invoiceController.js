/**
 * invoiceController.js — COMPLETE FIXED VERSION
 *
 * Root causes fixed:
 *  1. Content-Disposition: attachment (not inline) → triggers download
 *  2. Route was never registered in orderRoutes.js
 *  3. Added auth check (customer can download own invoice, admin can download all)
 *  4. Graceful error if pdfkit not installed (clear message)
 *  5. All numbers safely defaulted to avoid NaN in PDF
 *
 * FILE: backend/src/controllers/invoiceController.js
 *
 * SETUP: Run in /backend → npm install pdfkit
 */
import Order from "../models/Order.js";

export const generateInvoice = async (req, res) => {
  try {
    // ✅ FIX: lazy import so missing package gives clear error
    let PDFDocument;
    try {
      PDFDocument = (await import("pdfkit")).default;
    } catch {
      return res.status(500).json({
        message: "PDF generation not available. Run: npm install pdfkit",
      });
    }

    const order = await Order.findById(req.params.id)
      .populate("userId",  "name email phone address")
      .populate("storeId", "name phone address");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ FIX: authorization — customer sees own, admin sees all
    const isOwner = order.userId?._id?.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to download this invoice" });
    }

    const shortId  = order._id.toString().slice(-8).toUpperCase();
    const filename = `QuickCart-Invoice-${shortId}.pdf`;

    // ✅ FIX: 'attachment' forces download; 'inline' opens in browser (was the original issue)
    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control",       "no-store");

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // ✅ FIX: pipe before any content is written
    doc.pipe(res);

    // ── Brand header ───────────────────────────────────────────
    doc
      .rect(0, 0, 595.28, 80)
      .fill("#ff6b35");

    doc
      .fontSize(26)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("QuickCart", 50, 22);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("rgba(255,255,255,0.85)")
      .text("Your neighbourhood delivery platform", 50, 52);

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("TAX INVOICE", 420, 30, { align: "right", width: 125 });

    // ── Invoice meta ───────────────────────────────────────────
    doc
      .fillColor("#111111")
      .fontSize(10)
      .font("Helvetica");

    const metaY = 100;
    doc
      .text(`Invoice No : #${shortId}`,                             50,  metaY)
      .text(`Date       : ${new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "long", year: "numeric",
      })}`,                                                          50,  metaY + 16)
      .text(`Order ID   : ${order._id}`,                           50,  metaY + 32)
      .text(`Status     : ${order.status.replace(/_/g, " ").toUpperCase()}`, 50, metaY + 48);

    doc
      .text(`Payment    : ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}`, 300, metaY, { align: "left" })
      .text(`Pay Status : ${(order.paymentStatus || "pending").toUpperCase()}`,             300, metaY + 16);

    if (order.paymentId) {
      doc.text(`Payment ID : ${order.paymentId}`, 300, metaY + 32);
    }

    // ── Divider ────────────────────────────────────────────────
    doc
      .moveTo(50, metaY + 70)
      .lineTo(545, metaY + 70)
      .strokeColor("#dddddd")
      .lineWidth(1)
      .stroke();

    // ── Bill To / From ─────────────────────────────────────────
    const addrY = metaY + 85;
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#888888")
      .text("BILL TO", 50, addrY)
      .text("FROM", 300, addrY);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#111111")
      .text(order.userId?.name || "Customer",  50,  addrY + 14)
      .text(order.storeId?.name || "Store",    300, addrY + 14);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#444444")
      .text(order.userId?.email || "",         50,  addrY + 28)
      .text(order.userId?.phone || "",         50,  addrY + 42)
      .text(order.deliveryAddress || "",       50,  addrY + 56, { width: 220 })

      .text(order.storeId?.phone   || "",      300, addrY + 28)
      .text(order.storeId?.address || "",      300, addrY + 42, { width: 220 });

    // ── Items table header ─────────────────────────────────────
    const tableY = addrY + 115;
    doc
      .rect(50, tableY, 495, 22)
      .fill("#f5f5f5");

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("#",        55,   tableY + 7)
      .text("Item",     75,   tableY + 7)
      .text("Qty",      360,  tableY + 7)
      .text("Unit Price",400, tableY + 7)
      .text("Amount",   490,  tableY + 7, { align: "right", width: 55 });

    doc
      .moveTo(50, tableY + 22)
      .lineTo(545, tableY + 22)
      .strokeColor("#eeeeee")
      .lineWidth(1)
      .stroke();

    // ── Items rows ─────────────────────────────────────────────
    let rowY = tableY + 30;
    const items = order.items || [];

    items.forEach((item, idx) => {
      const price    = Number(item.price    || 0);
      const quantity = Number(item.quantity || 1);
      const total    = price * quantity;

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#222222")
        .text(String(idx + 1),           55,  rowY)
        .text(item.name || "Item",        75,  rowY, { width: 275 })
        .text(String(quantity),           360, rowY)
        .text(`₹${price.toFixed(2)}`,    400, rowY)
        .text(`₹${total.toFixed(2)}`,    490, rowY, { align: "right", width: 55 });

      rowY += 20;

      // row separator
      doc
        .moveTo(50, rowY - 3)
        .lineTo(545, rowY - 3)
        .strokeColor("#f0f0f0")
        .lineWidth(0.5)
        .stroke();
    });

    // ── Totals ─────────────────────────────────────────────────
    const subtotal = items.reduce(
      (s, i) => s + Number(i.price || 0) * Number(i.quantity || 1),
      0,
    );
    const deliveryFee = Number(order.deliveryFee || 20);
    const grandTotal  = Number(order.totalPrice  || 0);
    const discount    = Math.max(0, subtotal + deliveryFee - grandTotal);

    const totalsX = 370;
    let totalsY   = rowY + 10;

    doc
      .moveTo(totalsX, totalsY)
      .lineTo(545, totalsY)
      .strokeColor("#cccccc")
      .lineWidth(1)
      .stroke();

    totalsY += 8;

    const totalsRow = (label, value, bold = false, color = "#333333") => {
      doc
        .fontSize(9)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(color)
        .text(label,  totalsX,     totalsY)
        .text(value,  440,         totalsY, { align: "right", width: 105 });
      totalsY += 16;
    };

    totalsRow("Subtotal",     `₹${subtotal.toFixed(2)}`);
    totalsRow("Delivery Fee", `₹${deliveryFee.toFixed(2)}`);

    if (discount > 0) {
      totalsRow("Discount",   `-₹${discount.toFixed(2)}`, false, "#22c55e");
    }

    doc
      .moveTo(totalsX, totalsY)
      .lineTo(545, totalsY)
      .strokeColor("#111111")
      .lineWidth(1.5)
      .stroke();

    totalsY += 6;
    totalsRow("TOTAL", `₹${grandTotal.toFixed(2)}`, true, "#ff6b35");

    // ── Footer ─────────────────────────────────────────────────
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#aaaaaa")
      .text(
        "Thank you for ordering with QuickCart! ⚡  |  support@quickcart.in  |  +91 80 1234 5678",
        50,
        770,
        { align: "center", width: 495 },
      )
      .text(
        "This is a computer-generated invoice and does not require a signature.",
        50,
        783,
        { align: "center", width: 495 },
      );

    // ✅ FIX: end() finalizes the PDF and flushes to res
    doc.end();
  } catch (e) {
    console.error("[Invoice] generateInvoice error:", e.message);
    // ✅ FIX: only send error if headers not already sent (PDF streaming started)
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate invoice: " + e.message });
    }
  }
};