const transporter = require("../config/email");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ─── Red Card Email (after ₹200 advance) ─────────────────────────────────────
const sendRedCardEmail = async ({ to, name, booking }) => {
  const balanceDue = booking.total_amount - (booking.payment?.advance_amount || 200);
  const bookingRef = booking._id?.toString().slice(-8).toUpperCase();

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#0d1117;border-radius:16px;overflow:hidden;">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 28px;text-align:center;border-bottom:1px solid #1e293b;">
        <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
          🏟️ Infinity Sports Turf
        </div>
        <div style="color:#94a3b8;font-size:13px;margin-top:6px;font-weight:500;">infinitysportsturf.com</div>
      </div>

      <!-- Title -->
      <div style="padding:28px 28px 0;text-align:center;">
        <div style="font-size:36px;margin-bottom:8px;">✅</div>
        <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0 0 8px;">Booking Confirmed!</h1>
        <p style="color:#94a3b8;font-size:14px;margin:0;">Your slot at Infinity Sports Turf is secured.</p>
      </div>

      <!-- Red Card -->
      <div style="margin:24px 28px;border:2px solid #ef4444;border-radius:14px;background:#1a0a0a;overflow:hidden;">
        <div style="background:#ef4444;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:11px;color:#fecaca;font-weight:700;letter-spacing:1px;text-transform:uppercase;">🔴 RED CARD: ACTION REQUIRED</div>
          <div style="font-size:18px;">⚠️</div>
        </div>
        <div style="padding:18px;text-align:center;">
          <div style="color:#ffffff;font-size:16px;font-weight:700;margin-bottom:4px;">Balance Due: ₹${balanceDue}</div>
          <div style="color:#94a3b8;font-size:13px;font-weight:600;margin-bottom:20px;">Status: Pending Entry Clearance</div>

          ${booking.payment?.balance_link_url ? `
            <!-- QR Section -->
            <div style="background:#000000;padding:20px;border-radius:12px;margin-bottom:20px;display:inline-block;border:1px solid #333;">
              <p style="color:#cbd5e1;font-size:11px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Scan to Pay Balance</p>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(booking.payment.balance_link_url)}&bgcolor=000000&color=ffffff" 
                   width="150" height="150" alt="Payment QR" style="display:block;margin:0 auto;border-radius:8px;" />
              <div style="margin-top:15px;">
                <a href="${booking.payment.balance_link_url}" style="background:#2563eb;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;display:inline-block;">Pay ₹${balanceDue} Online ↗</a>
              </div>
            </div>
          ` : `
            <div style="color:#f87171;font-size:13px;margin-bottom:20px;">Please pay the balance at the turf to clear entry.</div>
          `}

          <!-- Booking Summary Box -->
          <div style="background:#2a0a0a;border:1px solid #7f1d1d;border-radius:10px;padding:14px;text-align:left;">
            <div style="color:#fca5a5;font-size:12px;font-weight:800;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Booking Summary:</div>
            <div style="color:#e2e8f0;font-size:13px;line-height:2;">
              • <strong>Total Rate:</strong> ₹${booking.total_amount}<br>
              • <strong>Advance Paid:</strong> ₹${booking.payment?.advance_amount || 200} ✅<br>
              • <strong>Balance Due:</strong> ₹${balanceDue}<br>
              • <strong>Date:</strong> ${fmtDate(booking.date)}<br>
              • <strong>Time:</strong> ${fmtTime(booking.start_time)} – ${fmtTime(booking.end_time)}<br>
              • <strong>Booking Ref:</strong> #${bookingRef}
            </div>
          </div>
        </div>
      </div>

      <!-- Notice -->
      <div style="margin:0 28px 20px;padding:14px;background:#1e1a0a;border:1px solid #78350f;border-radius:10px;">
        <p style="color:#fbbf24;font-size:13px;margin:0;line-height:1.6;">
          <strong>Notice:</strong> Please scan the QR code in your ticket to pay the balance before entering the turf. 
          Present your Blue Card (paid status) at the gate for instant entry.
        </p>
      </div>

      <!-- Arrival Instructions -->
      <div style="margin:0 28px 24px;">
        <div style="color:#ffffff;font-size:15px;font-weight:800;margin-bottom:12px;">📋 Arrival &amp; Gear Instructions:</div>
        <div style="color:#cbd5e1;font-size:13px;line-height:2;">
          • <strong style="color:#94a3b8;">Arrival Time:</strong> Please arrive 10 minutes prior to your slot to settle the balance and maximize your playtime.<br>
          • <strong style="color:#94a3b8;">Bring Your Gear:</strong> Please bring your own Bats and Balls. We provide the Stumps.<br>
          • <strong style="color:#94a3b8;">Footwear Policy:</strong> Only flat-sole sports shoes are allowed. Please ensure you and your team bring the correct footwear (No metal studs or spikes).
        </div>
      </div>

      <!-- Location -->
      <div style="margin:0 28px 28px;padding:14px;background:#0d1f17;border:1px solid #166534;border-radius:10px;text-align:center;">
        <div style="color:#4ade80;font-size:13px;font-weight:700;">📍 Bolinj, Virar West</div>
      </div>

      <!-- Footer -->
      <div style="background:#0a0a0a;padding:20px 28px;text-align:center;border-top:1px solid #1e293b;">
        <div style="color:#64748b;font-size:12px;line-height:1.8;">
          📞 9325656695 / 9321400014<br>
          <a href="https://www.instagram.com/_infinity_turf" style="color:#a855f7;text-decoration:none;">@_infinity_turf</a>
        </div>
        <div style="color:#475569;font-size:11px;margin-top:8px;">Infinity Sports Turf · Play Without Limits!</div>
      </div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: `🔴 Booking Confirmed – Balance ₹${balanceDue} Due | ${booking.turf_name_snapshot}`,
    html,
  });
};

// ─── Blue Card Email (after full/balance payment) ─────────────────────────────
const sendBlueCardEmail = async ({ to, name, booking }) => {
  const bookingRef = booking._id?.toString().slice(-8).toUpperCase();

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#0d1117;border-radius:16px;overflow:hidden;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 28px;text-align:center;border-bottom:1px solid #1e293b;">
        <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
          🏟️ Infinity Sports Turf
        </div>
        <div style="color:#94a3b8;font-size:13px;margin-top:6px;font-weight:500;">infinitysportsturf.com</div>
      </div>

      <!-- Title -->
      <div style="padding:28px 28px 0;text-align:center;">
        <div style="font-size:36px;margin-bottom:8px;">🏆</div>
        <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0 0 8px;">You're Pitch Ready!</h1>
        <p style="color:#94a3b8;font-size:14px;margin:0;">Your payment is complete. Step into the arena.</p>
      </div>

      <!-- Blue Card -->
      <div style="margin:24px 28px;border:2px solid #3b82f6;border-radius:14px;background:#0a0a1a;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:11px;color:#bfdbfe;font-weight:700;letter-spacing:1px;text-transform:uppercase;">🔵 BLUE CARD: FULL ACCESS</div>
          <div style="font-size:18px;">🏆</div>
        </div>
        <div style="padding:18px;">
          <div style="color:#93c5fd;font-size:14px;font-weight:700;margin-bottom:4px;">Status: Fully Cleared / Game On!</div>
          <div style="color:#4ade80;font-size:14px;font-weight:700;">Total Paid: ₹${booking.total_amount} ✅</div>

          <!-- Match Details -->
          <div style="background:#0a0f2a;border:1px solid #1e3a8a;border-radius:10px;padding:14px;margin-top:16px;">
            <div style="color:#93c5fd;font-size:12px;font-weight:800;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Match Details:</div>
            <div style="color:#e2e8f0;font-size:13px;line-height:2;">
              • <strong>Venue:</strong> ${booking.turf_address_snapshot || "Bolinj, Virar West"}<br>
              • <strong>Date:</strong> ${fmtDate(booking.date)}<br>
              • <strong>Time:</strong> ${fmtTime(booking.start_time)} – ${fmtTime(booking.end_time)}<br>
              • <strong>Booking Ref:</strong> #${bookingRef}
            </div>
          </div>
        </div>
      </div>

      <!-- Final Instructions -->
      <div style="margin:0 28px 24px;">
        <div style="color:#ffffff;font-size:15px;font-weight:800;margin-bottom:12px;">🗒️ Final Instructions:</div>
        <div style="color:#cbd5e1;font-size:13px;line-height:2;">
          • <strong style="color:#94a3b8;">Show &amp; Go:</strong> Present this Blue Card at the gate for instant entry.<br>
          • <strong style="color:#94a3b8;">Fair Play:</strong> Respect the clock. Please exit the turf promptly when your session ends so the next team can start on time.<br>
          • <strong style="color:#94a3b8;">Safety First:</strong> The facility is under CCTV surveillance. Please follow the coordinator's instructions.
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#0a0a0a;padding:20px 28px;text-align:center;border-top:1px solid #1e293b;">
        <div style="color:#ffffff;font-size:15px;font-weight:900;margin-bottom:8px;">Play Without Limits! ✨</div>
        <div style="color:#64748b;font-size:12px;line-height:1.8;">
          📞 9325656695 / 9321400014<br>
          <a href="https://www.instagram.com/_infinity_turf" style="color:#a855f7;text-decoration:none;">@_infinity_turf</a>
        </div>
      </div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: `🔵 You're Pitch Ready! Full Access Granted | ${booking.turf_name_snapshot}`,
    html,
  });
};

// ─── Booking Cancellation Email ───────────────────────────────────────────────
const sendCancellationEmail = async ({ to, name, booking }) => {
  const mailOptions = {
    from:    process.env.EMAIL_FROM,
    to,
    subject: `Booking Cancelled - ${booking.turf_name_snapshot}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #c62828;">❌ Booking Cancelled</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your booking has been cancelled. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Turf</td>
            <td style="padding: 10px;">${booking.turf_name_snapshot}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Date</td>
            <td style="padding: 10px;">${new Date(booking.date).toDateString()}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Time</td>
            <td style="padding: 10px;">${booking.start_time} - ${booking.end_time}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Refund Amount</td>
            <td style="padding: 10px;">₹${booking.cancellation.refund_amount}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Refund Status</td>
            <td style="padding: 10px;">${booking.cancellation.refund_status}</td>
          </tr>
        </table>
        <p style="color: #555;">If you have any questions, please contact support.</p>
        <hr/>
        <p style="font-size: 12px; color: #999;">Infinity Sports Turf · Play Without Limits!</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// ─── Legacy alias (kept for backward compat) ──────────────────────────────────
const sendBookingConfirmationEmail = sendBlueCardEmail;

module.exports = {
  sendRedCardEmail,
  sendBlueCardEmail,
  sendBookingConfirmationEmail,
  sendCancellationEmail,
};