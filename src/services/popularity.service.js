import { db } from "../config/firebase.js";
import { FieldValue } from "firebase-admin/firestore";

/**
 * حساب الـ popularityScore لرحلة واحدة
 * المعادلة: (accepted bookings * 2) + (completed trips) + (repeat route bookings)
 */
export const calculateTripPopularity = async (tripId) => {
  try {
    const tripRef = db.collection("rides").doc(tripId);
    const tripDoc = await tripRef.get();

    if (!tripDoc.exists) {
      throw new Error(`Trip ${tripId} not found`);
    }

    const tripData = tripDoc.data();

    // 1️⃣ عدد الحجوزات المقبولة (Accepted Bookings) × 2
    const acceptedBookingsSnap = await db
      .collection("ridesRequests")
      .where("rideId", "==", tripId)
      .where("status", "==", "accepted")
      .get();

    const acceptedBookingsScore = acceptedBookingsSnap.size * 2;

    // 2️⃣ الرحلات المكتملة (Completed Trip)
    const completedScore = tripData.status === "completed" ? 1 : 0;

    // 3️⃣ تكرار الحجز على نفس المسار (Repeat Route Bookings)
    const routeKey = `${tripData.fromLocation?.name}_${tripData.toLocation?.name}`;

    // نجيب كل الرحلات اللي عندها نفس الـ routeKey
    const sameRouteTripsSnap = await db
      .collection("rides")
      .where("routeKey", "==", routeKey)
      .where("status", "in", ["scheduled", "started", "completed"])
      .get();

    // نحسب مجموع الحجوزات المقبولة على نفس المسار (غير الرحلة الحالية)
    let repeatRouteScore = 0;

    for (const doc of sameRouteTripsSnap.docs) {
      if (doc.id !== tripId) {
        // نجيب الحجوزات المقبولة للرحلة دي
        const bookingsSnap = await db
          .collection("ridesRequests")
          .where("rideId", "==", doc.id)
          .where("status", "==", "accepted")
          .get();

        repeatRouteScore += bookingsSnap.size;
      }
    }

    // 🎯 الـ Score النهائي
    const popularityScore =
      acceptedBookingsScore + completedScore + repeatRouteScore;

    // Update الرحلة
    await tripRef.update({
      popularityScore,
      routeKey,
      lastPopularityUpdate: FieldValue.serverTimestamp(),
    });

    console.log(
      `✅ Trip ${tripId}: popularityScore = ${popularityScore} (accepted: ${acceptedBookingsScore}, completed: ${completedScore}, repeat: ${repeatRouteScore})`
    );

    return { success: true, tripId, popularityScore };
  } catch (error) {
    console.error(`❌ Error calculating popularity for trip ${tripId}:`, error);
    throw error;
  }
};

/**
 * تحديث الـ popularityScore لكل الرحلات
 * ⚠️ استخدمها بحذر - ممكن تاخد وقت طويل
 */
export const updatePopularityScoreForAllTrips = async () => {
  try {
    console.log("🔄 Starting popularity score update for all trips...");

    // نجيب الرحلات النشطة فقط (scheduled, started, completed)
    const tripsSnap = await db
      .collection("rides")
      .where("status", "in", ["scheduled", "started", "completed"])
      .get();

    if (tripsSnap.empty) {
      console.log("ℹ️ No active trips found");
      return { success: true, updatedCount: 0 };
    }

    console.log(`📊 Found ${tripsSnap.size} trips to update`);

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // نعمل batch processing عشان الـ performance
    const BATCH_SIZE = 10;
    const tripDocs = tripsSnap.docs;

    for (let i = 0; i < tripDocs.length; i += BATCH_SIZE) {
      const batch = tripDocs.slice(i, i + BATCH_SIZE);
      const promises = batch.map((doc) =>
        calculateTripPopularity(doc.id).catch((error) => ({
          success: false,
          tripId: doc.id,
          error: error.message,
        }))
      );

      const batchResults = await Promise.all(promises);

      batchResults.forEach((result) => {
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            tripId: result.tripId,
            error: result.error,
          });
        }
      });

      console.log(
        `📈 Progress: ${Math.min(i + BATCH_SIZE, tripDocs.length)}/${
          tripDocs.length
        } trips processed`
      );
    }

    console.log(
      `✅ Update completed: ${results.success} successful, ${results.failed} failed`
    );

    if (results.errors.length > 0) {
      console.error("❌ Errors:", results.errors);
    }

    return {
      success: true,
      totalTrips: tripsSnap.size,
      successCount: results.success,
      failedCount: results.failed,
      errors: results.errors,
    };
  } catch (error) {
    console.error("❌ Fatal error in updatePopularityScoreForAllTrips:", error);
    throw error;
  }
};

/**
 * تحديث الـ popularity للرحلات على route معين
 * أسرع من تحديث كل الرحلات
 */
export const updatePopularityForRoute = async (fromLocationName, toLocationName) => {
  try {
    const routeKey = `${fromLocationName}_${toLocationName}`;
    
    const tripsSnap = await db
      .collection("rides")
      .where("routeKey", "==", routeKey)
      .where("status", "in", ["scheduled", "started", "completed"])
      .get();

    console.log(`🔄 Updating popularity for ${tripsSnap.size} trips on route: ${routeKey}`);

    const results = [];
    for (const doc of tripsSnap.docs) {
      const result = await calculateTripPopularity(doc.id);
      results.push(result);
    }

    return { success: true, updatedTrips: results.length, routeKey };
  } catch (error) {
    console.error(`❌ Error updating route popularity:`, error);
    throw error;
  }
};

/**
 * Event-driven update: يتنادي لما يحصل booking جديد
 * دي الطريقة الأفضل للـ production بدل الـ cron
 */
export const onBookingStatusChange = async (bookingId, newStatus, tripId) => {
  try {
    // نحدث الـ popularity بس لو الـ status بقى accepted أو cancelled
    if (newStatus === "accepted" || newStatus === "cancelled") {
      console.log(
        `📢 Booking ${bookingId} status changed to ${newStatus}, updating trip ${tripId} popularity`
      );
      await calculateTripPopularity(tripId);
    }
  } catch (error) {
    console.error(
      `❌ Error in onBookingStatusChange for booking ${bookingId}:`,
      error
    );
    // ما نرميش error عشان ما نأثرش على الـ main flow
  }
};

/**
 * Event-driven update: يتنادي لما الرحلة تنتهي
 */
export const onTripCompleted = async (tripId) => {
  try {
    console.log(`🏁 Trip ${tripId} completed, updating popularity`);
    await calculateTripPopularity(tripId);
    
    // كمان نحدث كل الرحلات على نفس الـ route
    const tripDoc = await db.collection("rides").doc(tripId).get();
    const tripData = tripDoc.data();
    
    if (tripData?.fromLocation && tripData?.toLocation) {
      await updatePopularityForRoute(
        tripData.fromLocation.name,
        tripData.toLocation.name
      );
    }
  } catch (error) {
    console.error(`❌ Error in onTripCompleted for trip ${tripId}:`, error);
  }
};