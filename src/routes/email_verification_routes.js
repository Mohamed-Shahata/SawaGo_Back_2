import express from "express";
import nodemailer from "nodemailer";
import admin from "firebase-admin";

const router = express.Router();

// ============================================================
// Nodemailer Transporter
// ============================================================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ============================================================
// Helper: Shared Email Wrapper
// ============================================================
const wrapEmailHTML = ({ title, subtitle, bodyContent, footerNote }) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F0FDF4;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#02C35E,#01AEB2);padding:40px 30px;text-align:center;">
            <div style="width:70px;height:70px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;line-height:70px;font-size:36px;">🚗</div>
            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">SAWAGO</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">${subtitle}</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr><td style="padding:40px 35px;">${bodyContent}</td></tr>

        <!-- DIVIDER -->
        <tr><td style="padding:0 35px;"><hr style="border:none;border-top:1px solid #E5E7EB;margin:0;"/></td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 35px;text-align:center;background:#F9FAFB;">
            <p style="color:#9CA3AF;font-size:13px;margin:0 0 6px;">${footerNote}</p>
            <p style="color:#D1D5DB;font-size:12px;margin:0;">© ${new Date().getFullYear()} SAWAGO — جميع الحقوق محفوظة</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

// ============================================================
// Template: Email Verification
// ============================================================
const buildVerificationHTML = ({ name, verificationLink }) =>
  wrapEmailHTML({
    title: "تأكيد البريد الإلكتروني",
    subtitle: "رحلات آمنة ومريحة في جميع أنحاء المدينة",
    footerNote: "لو ما طلبتش تأكيد الإيميل، تجاهل الرسالة دي.",
    bodyContent: `
      <h2 style="color:#111827;font-size:22px;margin:0 0 12px;">أهلاً ${name || "بك"} 👋</h2>
      <p style="color:#4B5563;font-size:15px;line-height:1.7;margin:0 0 28px;">
        شكراً لتسجيلك في <strong>SAWAGO</strong>!<br/>
        خطوة واحدة بس تفصلك — اضغط على الزر اللي تحت عشان تأكد بريدك الإلكتروني وتبدأ رحلتك معانا.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${verificationLink}"
           style="display:inline-block;background:linear-gradient(135deg,#02C35E,#01AEB2);color:#fff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 44px;border-radius:50px;box-shadow:0 4px 15px rgba(2,195,94,0.35);">
          ✅ تأكيد البريد الإلكتروني
        </a>
      </div>

      <div style="background:#FEF9C3;border:1px solid #FDE047;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
        <p style="color:#713F12;font-size:13px;margin:0;line-height:1.6;">
          ⏰ <strong>تنبيه:</strong> الرابط ده صالح لمدة <strong>24 ساعة</strong> فقط.
        </p>
      </div>

      <p style="color:#6B7280;font-size:13px;margin:0;">لو الزرار مش شغال، انسخ الرابط ده:</p>
      <p style="word-break:break-all;margin:6px 0 0;">
        <a href="${verificationLink}" style="color:#02C35E;font-size:12px;">${verificationLink}</a>
      </p>
    `,
  });

// ============================================================
// Template: Password Reset
// ============================================================
const buildPasswordResetHTML = ({ resetLink }) =>
  wrapEmailHTML({
    title: "إعادة تعيين كلمة المرور",
    subtitle: "اضغط على الزر عشان تعيد تعيين كلمة مرورك",
    footerNote: "لو ما طلبتش إعادة تعيين كلمة المرور، تجاهل الرسالة دي.",
    bodyContent: `
      <h2 style="color:#111827;font-size:22px;margin:0 0 12px;">إعادة تعيين كلمة المرور 🔐</h2>
      <p style="color:#4B5563;font-size:15px;line-height:1.7;margin:0 0 28px;">
        استلمنا طلب لإعادة تعيين كلمة مرور حسابك في <strong>SAWAGO</strong>.<br/>
        اضغط على الزر اللي تحت عشان تعمل كلمة مرور جديدة.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}"
           style="display:inline-block;background:linear-gradient(135deg,#02C35E,#01AEB2);color:#fff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 44px;border-radius:50px;box-shadow:0 4px 15px rgba(2,195,94,0.35);">
          🔑 إعادة تعيين كلمة المرور
        </a>
      </div>

      <div style="background:#FEF9C3;border:1px solid #FDE047;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
        <p style="color:#713F12;font-size:13px;margin:0;line-height:1.6;">
          ⏰ <strong>تنبيه:</strong> الرابط ده صالح لمدة <strong>1 ساعة</strong> فقط.
        </p>
      </div>

      <p style="color:#6B7280;font-size:13px;margin:0;">لو الزرار مش شغال، انسخ الرابط ده:</p>
      <p style="word-break:break-all;margin:6px 0 0;">
        <a href="${resetLink}" style="color:#02C35E;font-size:12px;">${resetLink}</a>
      </p>
    `,
  });

// ============================================================
// Rate limiting بسيط (استبدله بـ Redis في production)
// ============================================================
const cooldowns = new Map();
const COOLDOWN_MS = 60 * 1000;

const checkCooldown = (email) => {
  const last = cooldowns.get(email);
  if (last && Date.now() - last < COOLDOWN_MS) {
    return Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
  }
  return 0;
};

// ============================================================
// POST /api/auth/send-verification-email
// Body: { uid, email, name? }
// ============================================================
router.post("/send-verification-email", async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    if (!uid || !email)
      return res.status(400).json({ success: false, message: "uid and email are required" });

    // generateEmailVerificationLink بدون url عشان localhost مش Authorized Domain
    // لو عايز تعمل redirect بعد التأكيد، أضف الـ domain في Firebase Console أولاً
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);

    const html = buildVerificationHTML({ name, verificationLink });

    const info = await transporter.sendMail({
      from: `"SAWAGO" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "✅ تأكيد بريدك الإلكتروني في SAWAGO",
      text: `مرحباً ${name || ""}،\n\nاضغط على الرابط ده عشان تأكد بريدك:\n${verificationLink}`,
      html,
    });

    console.log(`📧 Verification email sent → ${email} | ${info.messageId}`);
    res.status(200).json({ success: true, message: "Verification email sent", data: { messageId: info.messageId } });
  } catch (error) {
    console.error("❌ send-verification-email:", error);
    if (error.code === "auth/user-not-found")
      return res.status(404).json({ success: false, message: "User not found" });
    res.status(500).json({ success: false, message: "Failed to send verification email" });
  }
});

// ============================================================
// POST /api/auth/resend-verification-email
// Body: { uid, email, name? }
// ============================================================
router.post("/resend-verification-email", async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    if (!uid || !email)
      return res.status(400).json({ success: false, message: "uid and email are required" });

    const wait = checkCooldown(email);
    if (wait)
      return res.status(429).json({ success: false, message: `الرجاء الانتظار ${wait} ثانية`, retryAfterSeconds: wait });

    const userRecord = await admin.auth().getUser(uid);
    if (userRecord.emailVerified)
      return res.status(400).json({ success: false, message: "البريد الإلكتروني مؤكد بالفعل" });

    const verificationLink = await admin.auth().generateEmailVerificationLink(email);

    const html = buildVerificationHTML({ name, verificationLink });

    const info = await transporter.sendMail({
      from: `"SAWAGO" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "🔁 إعادة إرسال رابط التأكيد - SAWAGO",
      text: `الرابط:\n${verificationLink}`,
      html,
    });

    cooldowns.set(email, Date.now());
    console.log(`📧 Resend verification → ${email} | ${info.messageId}`);
    res.status(200).json({ success: true, message: "Verification email resent" });
  } catch (error) {
    console.error("❌ resend-verification-email:", error);
    res.status(500).json({ success: false, message: "Failed to resend verification email" });
  }
});

// ============================================================
// POST /api/auth/send-password-reset
// Body: { email }
// ============================================================
router.post("/send-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: "email is required" });

    const wait = checkCooldown(`reset_${email}`);
    if (wait)
      return res.status(429).json({ success: false, message: `الرجاء الانتظار ${wait} ثانية`, retryAfterSeconds: wait });

    const resetLink = await admin.auth().generatePasswordResetLink(email);

    const html = buildPasswordResetHTML({ resetLink });

    const info = await transporter.sendMail({
      from: `"SAWAGO" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "🔑 إعادة تعيين كلمة المرور - SAWAGO",
      text: `الرابط:\n${resetLink}`,
      html,
    });

    cooldowns.set(`reset_${email}`, Date.now());
    console.log(`📧 Password reset email → ${email} | ${info.messageId}`);
    res.status(200).json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    console.error("❌ send-password-reset:", error);
    if (error.code === "auth/user-not-found")
      return res.status(404).json({ success: false, message: "User not found" });
    res.status(500).json({ success: false, message: "Failed to send password reset email" });
  }
});

export default router;