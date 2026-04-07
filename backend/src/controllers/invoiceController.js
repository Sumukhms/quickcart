import PDFDocument from "pdfkit";
import Order       from "../models/Order.js";
 
// GET /api/orders/:id/invoice
export const generateInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId",  "name email phone address")
      .populate("storeId", "name phone address");
 
    if (!order) return res.status(404).json({ message: "Order not found" });
 
    // Only the customer or admin can download
    const isOwner = order.userId._id.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
 
    const doc = new PDFDocument({ margin: 50, size: "A4" });
 
    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="invoice-${order._id.toString().slice(-8).toUpperCase()}.pdf"`);
    doc.pipe(res);
 
    // ── Header ────────────────────────────────────────────────
    doc
      .fontSize(22).font("Helvetica-Bold").fillColor("#ff6b35")
      .text("QuickCart", 50, 50)
      .fontSize(10).font("Helvetica").fillColor("#666")
      .text("Your neighbourhood delivery platform", 50, 78)
      .moveDown();
 
    doc.moveTo(50, 100).lineTo(545, 100).strokeColor("#ff6b35").lineWidth(2).stroke();
 
    // ── Invoice details ───────────────────────────────────────
    doc
      .fontSize(20).font("Helvetica-Bold").fillColor("#111")
      .text("INVOICE", 50, 115)
      .fontSize(10).font("Helvetica").fillColor("#444")
      .text(`Invoice No: #${order._id.toString().slice(-8).toUpperCase()}`, 50,  145)
      .text(`Date:       ${new Date(order.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}`, 50, 160)
      .text(`Status:     ${order.status.toUpperCase()}`, 50, 175);
 
    // ── Customer & Store ──────────────────────────────────────
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#111")
      .text("Bill To:",    50,  210)
      .text("From Store:", 300, 210);
 
    doc.fontSize(10).font("Helvetica").fillColor("#444")
      .text(order.userId.name,            50,  225)
      .text(order.userId.email,           50,  240)
      .text(order.userId.phone || "—",    50,  255)
      .text(order.deliveryAddress,        50,  270, { width: 200 })
 
      .text(order.storeId.name,           300, 225)
      .text(order.storeId.phone || "—",   300, 240)
      .text(order.storeId.address || "—", 300, 255, { width: 200 });
 
    // ── Items table ───────────────────────────────────────────
    const tableTop = 340;
    doc.moveTo(50, tableTop).lineTo(545, tableTop).strokeColor("#ddd").lineWidth(1).stroke();
 
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#111")
      .text("Item",     50,  tableTop + 8)
      .text("Qty",      370, tableTop + 8)
      .text("Price",    420, tableTop + 8)
      .text("Total",    490, tableTop + 8);
 
    doc.moveTo(50, tableTop + 24).lineTo(545, tableTop + 24).strokeColor("#ddd").lineWidth(1).stroke();
 
    let y = tableTop + 34;
    for (const item of (order.items || [])) {
      const lineTotal = (item.price || 0) * (item.quantity || 1);
      doc.fontSize(10).font("Helvetica").fillColor("#333")
        .text(item.name,               50,  y, { width: 300 })
        .text(String(item.quantity),   370, y)
        .text(`₹${item.price}`,        420, y)
        .text(`₹${lineTotal}`,         490, y);
      y += 20;
    }
 
    // ── Totals ────────────────────────────────────────────────
    y += 10;
    doc.moveTo(370, y).lineTo(545, y).strokeColor("#ddd").lineWidth(1).stroke();
    y += 10;
 
    const subtotal  = (order.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
    const delivery  = order.deliveryFee ?? 20;
    const discount  = Math.max(0, subtotal + delivery - order.totalPrice);
 
    doc.fontSize(10).font("Helvetica").fillColor("#444")
      .text("Subtotal:",      370, y).text(`₹${subtotal}`, 490, y); y += 16;
    doc.text("Delivery fee:", 370, y).text(`₹${delivery}`, 490, y); y += 16;
    if (discount > 0) {
      doc.fillColor("#22c55e")
        .text("Discount:",    370, y).text(`-₹${discount}`, 490, y);
      y += 16;
    }
 
    doc.moveTo(370, y).lineTo(545, y).strokeColor("#111").lineWidth(1.5).stroke();
    y += 8;
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#ff6b35")
      .text("TOTAL:",         370, y).text(`₹${order.totalPrice}`, 490, y);
    y += 18;
    doc.fontSize(10).font("Helvetica").fillColor("#444")
      .text(`Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}`, 370, y);
 
    // ── Footer ────────────────────────────────────────────────
    doc.fontSize(9).font("Helvetica").fillColor("#aaa")
      .text("Thank you for ordering with QuickCart! ⚡", 50, 740, { align: "center", width: 495 })
      .text("For queries: support@quickcart.in | +91 80 1234 5678",  50, 755, { align: "center", width: 495 });
 
    doc.end();
  } catch (e) {
    console.error("[Invoice] Error:", e.message);
    if (!res.headersSent) res.status(500).json({ message: e.message });
  }
};
