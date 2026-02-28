import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Create transporter with Mailtrap configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter verification failed:", error);
  } else {
    console.log("Server is ready to send emails");
  }
});

// Email sending endpoint
router.post("/send", async (req, res) => {
  try {
    const { to, subject, message, name, phone, tripDetails } = req.body;

    // Validate required fields
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: to, subject, and message are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Create HTML email template with ride-sharing theme
    const htmlTemplate = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #F3F4F6, #E5E7EB);">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
          
          <!-- Header with gradient -->
          <div style="background: linear-gradient(135deg, #02C35E, #01AEB2); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">تطبيق توصيل الرحلات</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">رحلات آمنة ومريحة في جميع أنحاء المدينة</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 25px;">
            <div style="background: linear-gradient(135deg, rgba(2,195,94,0.1), rgba(1,174,178,0.1)); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
              <h2 style="color: #02C35E; margin: 0 0 15px; font-size: 22px;">${subject}</h2>
              <p style="color: #374151; line-height: 1.6; font-size: 16px;">${message}</p>
            </div>
            
            ${
              name
                ? `
            <div style="margin-bottom: 15px; padding: 12px; background: #F3F4F6; border-radius: 8px;">
              <span style="color: #4B5563; font-weight: bold;">👤 الاسم: </span>
              <span style="color: #111827;">${name}</span>
            </div>
            `
                : ""
            }
            
            ${
              phone
                ? `
            <div style="margin-bottom: 15px; padding: 12px; background: #F3F4F6; border-radius: 8px;">
              <span style="color: #4B5563; font-weight: bold;">📱 رقم الهاتف: </span>
              <span style="color: #111827;">${phone}</span>
            </div>
            `
                : ""
            }
            
            ${
              tripDetails
                ? `
            <div style="margin: 20px 0; border: 2px dashed #D1FAE5; padding: 20px; border-radius: 12px;">
              <h3 style="color: #02C35E; margin: 0 0 15px;">تفاصيل الرحلة</h3>
              <p style="color: #374151; margin: 5px 0;">${tripDetails}</p>
            </div>
            `
                : ""
            }
          </div>
          
          <!-- Footer -->
          <div style="background: #F3F4F6; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; margin: 5px 0; font-size: 14px;">© 2024 تطبيق توصيل الرحلات - جميع الحقوق محفوظة</p>
            <p style="color: #9CA3AF; margin: 5px 0; font-size: 12px;">هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email options
    const mailOptions = {
      from: `"تطبيق توصيل الرحلات" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: subject,
      text: message, // Plain text version
      html: htmlTemplate, // HTML version
      headers: {
        "X-Priority": "3", // Normal priority
        "X-Mailer": "RideShare Email Service",
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log successful send (in production, you might want to save to database)
    console.log("Email sent successfully:", {
      messageId: info.messageId,
      to: to,
      subject: subject,
      timestamp: new Date().toISOString(),
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: {
        messageId: info.messageId,
        to: to,
        subject: subject,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Email sending failed:", error);

    // Handle specific nodemailer errors
    let errorMessage = "Failed to send email";
    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Check email credentials.";
    } else if (error.code === "ESOCKET") {
      errorMessage = "Network error. Please try again.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
});

// Get email status endpoint
router.get("/status/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;

    // In a real application, you would check the email status from your database
    // or email service provider

    res.status(200).json({
      success: true,
      message: "Email status retrieved",
      data: {
        messageId: messageId,
        status: "sent", // This would be dynamic in production
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve email status",
      error: error.message,
    });
  }
});

module.exports = router;
