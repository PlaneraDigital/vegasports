const PDFDocument = require("pdfkit");

const generateInvoice = (booking, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF chunks into buffer
      doc.on("data",  (chunk) => chunks.push(chunk));
      doc.on("end",   ()      => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Header ──────────────────────────────────────────────────────────────
      doc
        .fillColor("#2e7d32")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("VegaSports", 50, 50);

      doc
        .fillColor("#555")
        .fontSize(10)
        .font("Helvetica")
        .text("Book. Play. Win.", 50, 78);

      // Invoice title
      doc
        .fillColor("#000")
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("BOOKING INVOICE", 350, 50, { align: "right" });

      doc
        .fillColor("#555")
        .fontSize(10)
        .font("Helvetica")
        .text(`Invoice #: ${booking._id}`, 350, 78, { align: "right" });

      doc
        .text(
          `Date: ${new Date(booking.payment?.paid_at || booking.created_at).toDateString()}`,
          350, 92, { align: "right" }
        );

      // Divider
      doc
        .moveTo(50, 115)
        .lineTo(550, 115)
        .strokeColor("#2e7d32")
        .lineWidth(2)
        .stroke();

      // ── Customer Details ─────────────────────────────────────────────────────
      doc
        .fillColor("#2e7d32")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("BILLED TO", 50, 135);

      doc
        .fillColor("#000")
        .fontSize(11)
        .font("Helvetica")
        .text(user.name,  50, 153)
        .text(user.email, 50, 168)
        .text(user.phone, 50, 183);

      // ── Booking Details ──────────────────────────────────────────────────────
      doc
        .fillColor("#2e7d32")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("BOOKING DETAILS", 300, 135);

      doc
        .fillColor("#000")
        .fontSize(11)
        .font("Helvetica")
        .text(`Turf:    ${booking.turf_name_snapshot}`,    300, 153)
        .text(`Address: ${booking.turf_address_snapshot}`, 300, 168)
        .text(
          `Date:    ${new Date(booking.date).toDateString()}`,
          300, 183
        )
        .text(
          `Time:    ${booking.start_time} - ${booking.end_time}`,
          300, 198
        );

      // ── Table Header ─────────────────────────────────────────────────────────
      doc
        .rect(50, 230, 500, 25)
        .fill("#2e7d32");

      doc
        .fillColor("#fff")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Description",  60,  238)
        .text("Slots",        270, 238)
        .text("Price/Slot",   360, 238)
        .text("Total",        470, 238);

      // ── Table Row ────────────────────────────────────────────────────────────
      doc
        .rect(50, 255, 500, 25)
        .fill("#f5f5f5");

      const slotCount = booking.slot_ids?.length || 1;

      doc
        .fillColor("#000")
        .fontSize(10)
        .font("Helvetica")
        .text("Turf Booking",              60,  263)
        .text(`${slotCount}`,              280, 263)
        .text(`₹${booking.price_per_slot_snapshot}`, 365, 263)
        .text(`₹${booking.total_amount}`,  470, 263);

      // ── Total Section ────────────────────────────────────────────────────────
      doc
        .moveTo(50, 295)
        .lineTo(550, 295)
        .strokeColor("#e0e0e0")
        .lineWidth(1)
        .stroke();

      doc
        .fillColor("#000")
        .fontSize(11)
        .font("Helvetica")
        .text("Subtotal:",  380, 310)
        .text(`₹${booking.total_amount}`, 470, 310);

      doc
        .text("Tax (0%):", 380, 328)
        .text("₹0",        470, 328);

      doc
        .moveTo(370, 348)
        .lineTo(550, 348)
        .strokeColor("#000")
        .lineWidth(1)
        .stroke();

      doc
        .fillColor("#2e7d32")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("TOTAL:",                    380, 358)
        .text(`₹${booking.total_amount}`,  470, 358);

      // ── Payment Status ───────────────────────────────────────────────────────
      doc
        .moveTo(50, 395)
        .lineTo(550, 395)
        .strokeColor("#e0e0e0")
        .lineWidth(1)
        .stroke();

      const paymentStatus = booking.payment?.status?.toUpperCase() || "PENDING";
      const statusColor   = paymentStatus === "PAID" ? "#2e7d32" : "#c62828";

      doc
        .fillColor("#555")
        .fontSize(11)
        .font("Helvetica")
        .text("Payment Status:", 50, 410);

      doc
        .fillColor(statusColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(paymentStatus, 170, 410);

      if (booking.payment?.transaction_id) {
        doc
          .fillColor("#555")
          .fontSize(10)
          .font("Helvetica")
          .text(`Transaction ID: ${booking.payment.transaction_id}`, 50, 428);
      }

      if (booking.payment?.razorpay_order_id) {
        doc
          .fillColor("#555")
          .fontSize(10)
          .font("Helvetica")
          .text(`Order ID: ${booking.payment.razorpay_order_id}`, 50, 443);
      }

      // ── Booking Status ───────────────────────────────────────────────────────
      doc
        .fillColor("#555")
        .fontSize(10)
        .font("Helvetica")
        .text(`Booking Status: ${booking.booking_status?.toUpperCase()}`, 50, 460);

      // ── Footer ───────────────────────────────────────────────────────────────
      doc
        .moveTo(50, 500)
        .lineTo(550, 500)
        .strokeColor("#2e7d32")
        .lineWidth(2)
        .stroke();

      doc
        .fillColor("#555")
        .fontSize(9)
        .font("Helvetica")
        .text("Thank you for booking with VegaSports!", 50, 515, {
          align: "center",
          width: 500,
        })
        .text(
          "For support contact: support@vegasports.com",
          50, 530,
          { align: "center", width: 500 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoice;