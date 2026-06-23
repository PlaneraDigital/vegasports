const Slot = require("../models/Slot");
const Booking = require("../models/Booking");

/**
 * Finds expired holds (slots with status "on_hold" where held_until has passed)
 * and updates them back to "available".
 * Also marks corresponding pending bookings older than 10 minutes as "failed".
 */
const releaseExpiredHolds = async () => {
  try {
    const now = new Date();

    // 1. Find all slots with status "on_hold" where held_until <= now
    const expiredSlots = await Slot.find({
      status: "on_hold",
      held_until: { $lte: now }
    });

    if (expiredSlots.length > 0) {
      const expiredSlotIds = expiredSlots.map(s => s._id);

      // Release these slots back to available
      await Slot.updateMany(
        { _id: { $in: expiredSlotIds } },
        {
          $set: {
            status: "available",
            booked_by: null,
            held_until: null,
            booking_id: null
          }
        }
      );

      console.log(`[HoldManager] Released ${expiredSlots.length} expired slot holds: ${expiredSlotIds.join(", ")}`);
    }

    // 2. Expire corresponding pending bookings that are older than 10 minutes
    const cutoff = new Date(Date.now() - 10 * 60 * 1000);
    const expiredBookingsResult = await Booking.updateMany(
      {
        booking_status: "pending",
        created_at: { $lte: cutoff }
      },
      {
        $set: {
          booking_status: "failed"
        }
      }
    );

    if (expiredBookingsResult.modifiedCount > 0) {
      console.log(`[HoldManager] Marked ${expiredBookingsResult.modifiedCount} pending bookings as failed due to timeout.`);
    }
  } catch (error) {
    console.error("[HoldManager] Error releasing expired holds:", error.message);
  }
};

module.exports = { releaseExpiredHolds };
