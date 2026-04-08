const transporter = require("../config/email");

// ─── Booking Confirmation Email ───────────────────────────────────────────────
const sendBookingConfirmationEmail = async ({ to, name, booking }) => {
  const mailOptions = {
    from:    process.env.EMAIL_FROM,
    to,
    subject: `Booking Confirmed - ${booking.turf_name_snapshot}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32;">✅ Booking Confirmed!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your booking has been confirmed. Here are your details:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Turf</td>
            <td style="padding: 10px;">${booking.turf_name_snapshot}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Address</td>
            <td style="padding: 10px;">${booking.turf_address_snapshot}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Date</td>
            <td style="padding: 10px;">${new Date(booking.date).toDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Time</td>
            <td style="padding: 10px;">${booking.start_time} - ${booking.end_time}</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; font-weight: bold;">Amount Paid</td>
            <td style="padding: 10px;">₹${booking.total_amount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Booking ID</td>
            <td style="padding: 10px;">${booking._id}</td>
          </tr>
        </table>

        <p style="color: #555;">Please arrive on time. Late arrival will not extend your slot.</p>
        <p style="color: #2e7d32; font-weight: bold;">See you on the turf! ⚽</p>
        <hr/>
        <p style="font-size: 12px; color: #999;">VegaSports - Book. Play. Win.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
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
        <p style="font-size: 12px; color: #999;">VegaSports - Book. Play. Win.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
};