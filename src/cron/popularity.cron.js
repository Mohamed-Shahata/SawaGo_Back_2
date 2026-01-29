import cron from "node-cron";
import { updatePopularityScoreForAllTrips } from "../services/popularity.service.js";

/**
 * Cron Job لتحديث الـ popularityScore
 * 
 * ⚠️ ملحوظة مهمة:
 * الأفضل في الـ production نستخدم event-driven approach بدل الـ cron
 * يعني نحدث الـ popularity لما يحصل booking أو trip completion
 * 
 * الـ cron ده backup بس عشان نتأكد إن كل حاجة متزامنة
 */

// تشغيل كل 6 ساعات (مش كل ساعة عشان الـ load)
// يعني: الساعة 12 ص، 6 ص، 12 ظ، 6 م
cron.schedule("0 */6 * * *", async () => {
  const startTime = Date.now();
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│  🔄 Starting Popularity Score Update Job    │");
  console.log("│  Time:", new Date().toISOString(), "         │");
  console.log("└─────────────────────────────────────────────┘");

  try {
    const result = await updatePopularityScoreForAllTrips();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("┌─────────────────────────────────────────────┐");
    console.log("│  ✅ Popularity Update Job Completed         │");
    console.log("│  Duration:", duration, "seconds                 │");
    console.log("│  Total Trips:", result.totalTrips, "                │");
    console.log("│  Success:", result.successCount, "                  │");
    console.log("│  Failed:", result.failedCount, "                    │");
    console.log("└─────────────────────────────────────────────┘");

    // لو في errors كتير، نبعت تنبيه
    if (result.failedCount > result.successCount * 0.1) {
      console.error("⚠️ WARNING: High failure rate detected!");
      // TODO: أضف هنا integration مع monitoring service (Sentry, etc.)
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error("┌─────────────────────────────────────────────┐");
    console.error("│  ❌ Popularity Update Job FAILED            │");
    console.error("│  Duration:", duration, "seconds                 │");
    console.error("│  Error:", error.message, "                      │");
    console.error("└─────────────────────────────────────────────┘");

    // TODO: أضف هنا notification للـ admin أو monitoring
  }
});

console.log("⏰ Popularity cron job scheduled (every 6 hours)");