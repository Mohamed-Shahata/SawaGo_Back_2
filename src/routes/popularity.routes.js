import express from "express";
import { db } from "../config/firebase.js";
import {
  updatePopularityScoreForAllTrips,
  calculateTripPopularity,
  updatePopularityForRoute,
} from "../services/popularity.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/popularity/update-all
 * تحديث الـ popularity لكل الرحلات النشطة
 * ⚠️ Admin only - عملية ثقيلة
 */
router.post("/update-all", authMiddleware(["admin"]), async (req, res) => {
  try {
    console.log("📢 Manual popularity update triggered by admin");

    const result = await updatePopularityScoreForAllTrips();

    res.status(200).json({
      success: true,
      message: "Popularity scores updated successfully",
      data: {
        totalTrips: result.totalTrips,
        successCount: result.successCount,
        failedCount: result.failedCount,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("❌ Error in update-all endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update popularity scores",
      error: error.message,
    });
  }
});

/**
 * POST /api/popularity/update-trip/:tripId
 * تحديث الـ popularity لرحلة واحدة
 * Admin or Driver (owner of trip)
 */
router.post(
  "/update-trip/:tripId",
  authMiddleware(["admin", "driver"]),
  async (req, res) => {
    try {
      const { tripId } = req.params;

      if (!tripId) {
        return res.status(400).json({
          success: false,
          message: "Trip ID is required",
        });
      }

      const result = await calculateTripPopularity(tripId);

      res.status(200).json({
        success: true,
        message: "Trip popularity updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ Error in update-trip endpoint:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "Trip not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update trip popularity",
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/popularity/update-route
 * تحديث الـ popularity لكل الرحلات على route معين
 * Body: { fromLocation: "Cairo", toLocation: "Alexandria" }
 */
router.post("/update-route", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { fromLocation, toLocation } = req.body;

    if (!fromLocation || !toLocation) {
      return res.status(400).json({
        success: false,
        message: "fromLocation and toLocation are required",
      });
    }

    const result = await updatePopularityForRoute(fromLocation, toLocation);

    res.status(200).json({
      success: true,
      message: "Route popularity updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error in update-route endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update route popularity",
      error: error.message,
    });
  }
});

/**
 * GET /api/popularity/popular-trips
 * جلب أشهر الرحلات (sorted by popularityScore)
 * Query params:
 * - limit: عدد النتائج (default: 10)
 * - route: filter by routeKey (optional)
 */
router.get("/popular-trips", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const routeKey = req.query.route;

    let query = db
      .collection("rides")
      .where("status", "in", ["scheduled", "started"])
      .orderBy("popularityScore", "desc")
      .limit(limit);

    if (routeKey) {
      query = query.where("routeKey", "==", routeKey);
    }

    const snapshot = await query.get();

    const trips = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    console.error("❌ Error in popular-trips endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular trips",
      error: error.message,
    });
  }
});

export default router;