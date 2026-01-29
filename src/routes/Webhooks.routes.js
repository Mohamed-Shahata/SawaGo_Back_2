import express from "express";
import {
  onBookingStatusChange,
  onTripCompleted,
} from "../services/popularity.service.js";

const router = express.Router();

/**
 * Webhooks للـ Event-Driven Updates
 * 
 * ⭐ الطريقة الأفضل للـ Production:
 * بدل ما نعمل cron يحدث كل الرحلات، نحدث الرحلة بس لما يحصل event معين
 * 
 * الـ Events:
 * 1. Booking Status Change (accepted/cancelled)
 * 2. Trip Completed
 * 
 * طريقة الاستخدام:
 * لما تعمل update على booking أو trip في الـ app/backend،
 * تنادي الـ webhook ده عشان يحدث الـ popularity
 */

/**
 * POST /api/webhooks/booking-status-changed
 * Body: {
 *   bookingId: string,
 *   newStatus: "accepted" | "rejected" | "cancelled",
 *   tripId: string
 * }
 */
router.post("/booking-status-changed", async (req, res) => {
  try {
    const { bookingId, newStatus, tripId } = req.body;

    // Validation
    if (!bookingId || !newStatus || !tripId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: bookingId, newStatus, tripId",
      });
    }

    if (!["accepted", "rejected", "cancelled"].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: accepted, rejected, or cancelled",
      });
    }

    // Update popularity في الـ background (non-blocking)
    // ما نستناش الـ response عشان ما نبطئش الـ main flow
    onBookingStatusChange(bookingId, newStatus, tripId).catch((error) => {
      console.error("Background popularity update failed:", error);
    });

    // نرد بسرعة
    res.status(200).json({
      success: true,
      message: "Booking status change processed",
    });
  } catch (error) {
    console.error("❌ Error in booking-status-changed webhook:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process booking status change",
      error: error.message,
    });
  }
});

/**
 * POST /api/webhooks/trip-completed
 * Body: {
 *   tripId: string
 * }
 */
router.post("/trip-completed", async (req, res) => {
  try {
    const { tripId } = req.body;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: "tripId is required",
      });
    }

    // Update popularity في الـ background
    onTripCompleted(tripId).catch((error) => {
      console.error("Background popularity update failed:", error);
    });

    res.status(200).json({
      success: true,
      message: "Trip completion processed",
    });
  } catch (error) {
    console.error("❌ Error in trip-completed webhook:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process trip completion",
      error: error.message,
    });
  }
});

export default router;