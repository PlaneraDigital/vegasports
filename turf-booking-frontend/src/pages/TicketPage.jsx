import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../utils/auth";
import { ArrowLeft, Loader2 } from "lucide-react";

function fmt(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/* ── Stadium Background Wrapper ─────────────────────────────────────────── */
const STADIUM_BG = {
  backgroundImage: `url('https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=900&q=80')`,
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundRepeat: "no-repeat",
  position: "relative",
};
const OVERLAY = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,20,5,0.82) 100%)",
  zIndex: 0,
};

/* Ticket page intentionally has no site navbar — standalone ticket UI */

/* ── Red Card ─────────────────────────────────────────────────────────────── */
function RedCardView({ booking, onBack }) {
  const balanceDue = booking.total_amount - (booking.payment?.advance_amount || 200);
  const balanceLinkUrl = booking.payment?.balance_link_url;

  return (
    <div style={{ ...STADIUM_BG, minHeight: "100vh" }}>
      <div style={OVERLAY} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto" }}>
        {/* no navbar on ticket page */}

        {/* Back */}
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 6,
          color: "#aaa", fontSize: 13, fontWeight: 700,
          background: "none", border: "none", cursor: "pointer",
          padding: "12px 20px", zIndex: 10,
        }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ padding: "0 20px 40px" }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>✅</div>
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 900, margin: "0 0 6px", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
              Booking Confirmed!
            </h1>
            <p style={{ color: "#ccc", fontSize: 14, margin: 0, fontWeight: 500 }}>
              Your slot at Infinity Sports Turf is secured.
            </p>
          </div>

          {/* Red Card Box */}
          <div style={{
            borderRadius: 12,
            border: "2px solid #cc2200",
            boxShadow: "0 0 24px rgba(220,38,38,0.5), inset 0 0 20px rgba(220,38,38,0.08)",
            overflow: "hidden",
            marginBottom: 18,
          }}>
            {/* Card Header */}
            <div style={{
              background: "linear-gradient(135deg, #cc2200, #aa1800)",
              padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, letterSpacing: "0.04em" }}>
                🔴 RED CARD: ACTION REQUIRED
              </span>
              <span style={{ fontSize: 18 }}>⚠️</span>
            </div>
            {/* Card Body */}
            <div style={{ background: "rgba(10,0,0,0.85)", padding: "16px" }}>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>
                Balance Due: ₹{balanceDue}{" "}
                <span style={{ color: "#aaa", fontWeight: 500, fontSize: 12 }}>(Payable via QR scan)</span>
              </p>
              <p style={{ color: "#ccc", fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>
                Status: Pending Entry Clearance
              </p>

              {/* Booking Summary Box */}
              <div style={{
                background: "rgba(180,20,0,0.12)",
                border: "1px solid rgba(220,38,38,0.35)",
                borderRadius: 8, padding: "12px 14px",
              }}>
                <p style={{ color: "#ffcdd2", fontSize: 12, fontWeight: 800, margin: "0 0 10px", letterSpacing: "0.02em" }}>
                  Booking Summary:
                </p>
                <div style={{ color: "#f0f0f0", fontSize: 13, lineHeight: 2 }}>
                  <div>• <strong>Total Rate:</strong> ₹{booking.total_amount}</div>
                  <div>• <strong>Advance Paid:</strong> ₹{booking.payment?.advance_amount || 200}</div>
                  <div>• <strong>Date:</strong> {fmtDate(booking.date)}</div>
                  <div>• <strong>Time:</strong> {fmt(booking.start_time)} – {fmt(booking.end_time)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Section */}
          {balanceLinkUrl && (
            <div style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: 20, marginBottom: 18, 
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"
            }}>
              <p style={{ color: "#ddd", fontSize: 12, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Scan to Pay Balance ₹{balanceDue}
              </p>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(balanceLinkUrl)}&bgcolor=111111&color=ffffff&format=png`}
                  alt="Pay Balance QR"
                  style={{ borderRadius: 10, border: "3px solid rgba(255,255,255,0.15)", width: 180, height: 180, display: "block" }}
                />
              </div>
              <a href={balanceLinkUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", padding: "10px 24px", background: "#2563eb", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
                Pay ₹{balanceDue} Online ↗
              </a>
            </div>
          )}

          {/* Notice */}
          <p style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.7, marginBottom: 20, fontWeight: 500 }}>
            <strong>Notice:</strong> Please ensure the balance is paid before entering the turf. Pay the remaining amount to unlock your Blue Card.
          </p>

          {/* Instructions */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 12 }}>📋 Arrival &amp; Gear Instructions:</p>
            <div style={{ color: "#ccc", fontSize: 13, lineHeight: 2, fontWeight: 500 }}>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Arrival Time:</strong> Please arrive 10 minutes prior to your slot to settle the balance and maximize your playtime.</p>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Bring Your Gear:</strong> Please bring your own Bats and Balls. We provide the Stumps.</p>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Footwear Policy:</strong> Only flat-sole sports shoes are allowed. Please ensure you and your team bring the correct footwear (No metal studs or spikes).</p>
            </div>
          </div>

          {/* Location */}
          <div style={{ textAlign: "center", padding: "14px", background: "rgba(0,0,0,0.4)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>📍 Bolinj, Virar West</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Blue Card ─────────────────────────────────────────────────────────────── */
function BlueCardView({ booking, onBack }) {

  return (
    <div style={{ ...STADIUM_BG, minHeight: "100vh" }}>
      <div style={OVERLAY} />
  <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto" }}>
  {/* no navbar on ticket page */}

        {/* Back */}
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 6,
          color: "#aaa", fontSize: 13, fontWeight: 700,
          background: "none", border: "none", cursor: "pointer",
          padding: "12px 20px",
        }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ padding: "0 20px 40px" }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🏆</div>
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 900, margin: "0 0 6px", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
              You're Pitch Ready!
            </h1>
            <p style={{ color: "#ccc", fontSize: 14, margin: 0, fontWeight: 500 }}>
              Your payment is complete. Step into the arena.
            </p>
          </div>

          {/* Blue Card Box */}
          <div style={{
            borderRadius: 12,
            border: "2px solid #2563eb",
            boxShadow: "0 0 28px rgba(37,99,235,0.6), inset 0 0 20px rgba(37,99,235,0.08)",
            overflow: "hidden",
            marginBottom: 20,
          }}>
            {/* Card Header */}
            <div style={{
              background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, letterSpacing: "0.04em" }}>
                🔵 BLUE CARD: FULL ACCESS
              </span>
              <span style={{ fontSize: 18 }}>🏆</span>
            </div>
            {/* Card Body */}
            <div style={{ background: "rgba(0,5,30,0.88)", padding: "16px" }}>
              <p style={{ color: "#93c5fd", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>
                Status: Fully Cleared / Game On!
              </p>
              <p style={{ color: "#4ade80", fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>
                Total Paid: ₹{booking.total_amount} ✅
              </p>

              {/* Match Details Box */}
              <div style={{
                background: "rgba(37,99,235,0.12)",
                border: "1px solid rgba(37,99,235,0.4)",
                borderRadius: 8, padding: "12px 14px",
              }}>
                <p style={{ color: "#bfdbfe", fontSize: 12, fontWeight: 800, margin: "0 0 10px" }}>
                  Match Details:
                </p>
                <div style={{ color: "#f0f0f0", fontSize: 13, lineHeight: 2 }}>
                  <div>• <strong>Venue:</strong> {booking.turf_address_snapshot || "Bolinj, Virar West"}</div>
                  <div>• <strong>Date:</strong> {fmtDate(booking.date)}</div>
                  <div>• <strong>Time:</strong> {fmt(booking.start_time)} – {fmt(booking.end_time)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Final Instructions */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🗒️ Final Instructions:</p>
            <div style={{ color: "#ccc", fontSize: 13, lineHeight: 2, fontWeight: 500 }}>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Show &amp; Go:</strong> Present this Blue Card at the gate for instant entry.</p>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Fair Play:</strong> Respect the clock. Please exit the turf promptly when your session ends so the next team can start on time.</p>
              <p style={{ margin: 0 }}>• <strong style={{ color: "#fff" }}>Safety First:</strong> The facility is under CCTV surveillance. Please follow the coordinator's instructions.</p>
            </div>
          </div>

          {/* Tagline + Contact */}
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
              Play Without Limits!
            </p>
            <p style={{ color: "#aaa", fontSize: 14, fontWeight: 600, margin: 0 }}>
              📞 9325656695 / 9321400014
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
function CancelledView({ booking, onBack }) {
  return (
    <div style={{ ...STADIUM_BG, minHeight: "100vh" }}>
      <div style={OVERLAY} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "24px" }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 6,
          color: "#aaa", fontSize: 13, fontWeight: 700,
          background: "none", border: "none", cursor: "pointer",
          padding: "12px 0",
        }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0 }}>Booking Cancelled</h1>
          <p style={{ color: "#ccc", marginTop: 8 }}>This booking was cancelled and is no longer active.</p>

          <div style={{ marginTop: 18, background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 14 }}>
            <p style={{ color: "#fff", fontWeight: 800, margin: 0 }}>Booking Summary</p>
            <div style={{ color: "#ddd", marginTop: 8, fontSize: 13 }}>
              <div>• Date: {fmtDate(booking.date)}</div>
              <div>• Time: {fmt(booking.start_time)} – {fmt(booking.end_time)}</div>
              <div>• Amount: ₹{booking.total_amount}</div>
              <div>• Status: Cancelled</div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button onClick={onBack} style={{ padding: "10px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800 }}>Go to Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  // searchParams not currently used in ticket page
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get(`/api/bookings/${id}`)
      .then(r => setBooking(r.data.booking))
      .catch(() => setError("Booking not found or access denied."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ ...STADIUM_BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={OVERLAY} />
      <Loader2 size={36} color="#60a5fa" style={{ position: "relative", zIndex: 1, animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (error || !booking) return (
    <div style={{ ...STADIUM_BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
      <div style={OVERLAY} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎫</div>
        <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Ticket Not Found</h2>
        <p style={{ color: "#aaa", fontSize: 14, marginBottom: 24 }}>{error}</p>
        <button onClick={() => navigate("/profile")} style={{ padding: "12px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Go to Profile
        </button>
      </div>
    </div>
  );

  const isFullyPaid = booking?.payment?.status === "paid";
  const isCancelled = booking?.booking_status === "cancelled";
  const onBack = () => navigate("/profile");

  if (isCancelled) return <CancelledView booking={booking} onBack={onBack} />;
  return isFullyPaid ? <BlueCardView booking={booking} onBack={onBack} /> : <RedCardView booking={booking} onBack={onBack} />;
}
