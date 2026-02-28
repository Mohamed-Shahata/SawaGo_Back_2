import express from "express";
import { upload } from "../config/multer.config.js";
import fs from "fs";
import path from "path";
import { getProjectRoot, getUploadsDir } from "../utils/path.utils.js";

const router = express.Router();

// ============================================================
// Helper: بناء الـ base URL
// ============================================================
const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}/`;

// ============================================================
// Helper: تنظيف مسار الملف للـ URL
// ============================================================
const fileToUrl = (baseUrl, filePath) => {
  if (!filePath) return null;
  return baseUrl + filePath.replace(/\\/g, "/");
};

// ============================================================
// POST /upload-face-and-id
// الاستخدام: رفع صورة الوجه + البطاقة (للمستخدمين العاديين)
// ============================================================
router.post(
  "/upload-face-and-id",
  upload.fields([
    { name: "face", maxCount: 1 },
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files;
    const baseUrl = getBaseUrl(req);
    res.json({
      urls: {
        face: files.face ? fileToUrl(baseUrl, files.face[0].path) : null,
        idFront: files.idFront
          ? fileToUrl(baseUrl, files.idFront[0].path)
          : null,
        idBack: files.idBack ? fileToUrl(baseUrl, files.idBack[0].path) : null,
      },
    });
  },
);

// ============================================================
// PUT /update-id-images
// ============================================================
router.put(
  "/update-id-images",
  upload.fields([
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files || {};
      const { oldIdFront, oldIdBack } = req.body;
      const baseUrl = getBaseUrl(req);

      const deleteFile = (fileUrl) => {
        if (!fileUrl) return;
        try {
          const filePath = fileUrl.replace(baseUrl, "");
          const fullPath = path.join(getProjectRoot(), filePath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        } catch (err) {
          console.log("Error deleting file:", err.message);
        }
      };

      if (files.idFront && oldIdFront) deleteFile(oldIdFront);
      if (files.idBack && oldIdBack) deleteFile(oldIdBack);

      const urls = {
        idFront: files.idFront
          ? fileToUrl(baseUrl, files.idFront[0].path)
          : oldIdFront || null,
        idBack: files.idBack
          ? fileToUrl(baseUrl, files.idBack[0].path)
          : oldIdBack || null,
      };

      if (!urls.idFront && !urls.idBack) {
        return res.status(400).json({ message: "No ID images uploaded" });
      }

      res.json({ message: "ID images updated successfully", urls });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

// ============================================================
// POST /upload-images
// الاستخدام: رفع كل صور السائق (وجه + بطاقة + رخصة)
// Fields: face, idFront, idBack, licenseFront, licenseBack
// ============================================================
router.post(
  "/upload-images",
  upload.fields([
    { name: "face", maxCount: 1 },
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files;
    const baseUrl = getBaseUrl(req);

    if (!files || Object.keys(files).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    res.json({
      success: true,
      urls: {
        face: files.face ? fileToUrl(baseUrl, files.face[0].path) : null,
        idFront: files.idFront
          ? fileToUrl(baseUrl, files.idFront[0].path)
          : null,
        idBack: files.idBack ? fileToUrl(baseUrl, files.idBack[0].path) : null,
        licenseFront: files.licenseFront
          ? fileToUrl(baseUrl, files.licenseFront[0].path)
          : null,
        licenseBack: files.licenseBack
          ? fileToUrl(baseUrl, files.licenseBack[0].path)
          : null,
      },
    });
  },
);

// ============================================================
// POST /upload-vehicle-docs
// الاستخدام: رفع أوراق العربية (يقبل أكثر من صورة لكل ورقة)
// Fields: vehicleLicense[], vehicleRegistration[], vehicleInsurance[]
// ============================================================
router.post(
  "/upload-vehicle-docs",
  upload.fields([
    { name: "vehicleLicense", maxCount: 3 },
    { name: "vehicleRegistration", maxCount: 3 },
    { name: "vehicleInsurance", maxCount: 3 },
  ]),
  (req, res) => {
    const files = req.files;
    const baseUrl = getBaseUrl(req);

    if (!files || Object.keys(files).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const buildUrls = (fileArray) => {
      if (!fileArray) return [];
      return fileArray.map((f) => fileToUrl(baseUrl, f.path));
    };

    res.json({
      success: true,
      urls: {
        vehicleLicense: buildUrls(files.vehicleLicense),
        vehicleRegistration: buildUrls(files.vehicleRegistration),
        vehicleInsurance: buildUrls(files.vehicleInsurance),
      },
    });
  },
);

// ============================================================
// POST /upload-others
// الاستخدام: رفع صور إضافية (others) للعربية أو أي مستندات أخرى
// Field: others[] (max 10)
// ============================================================
router.post(
  "/upload-others",
  upload.fields([{ name: "others", maxCount: 10 }]),
  (req, res) => {
    const files = req.files;
    const baseUrl = getBaseUrl(req);

    if (!files?.others || files.others.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    res.json({
      success: true,
      urls: files.others.map((f) => fileToUrl(baseUrl, f.path)),
    });
  },
);

// ============================================================
// POST /upload-video
// الاستخدام: رفع فيديو التحقق للسائق
// Field: video (single file, max 100MB)
// ============================================================
router.post("/upload-video", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No video uploaded" });
  }

  const baseUrl = getBaseUrl(req);
  const url = fileToUrl(baseUrl, req.file.path);

  console.log("=== VIDEO UPLOAD SUCCESS ===");
  console.log("- File:", req.file.originalname);
  console.log("- Size:", (req.file.size / (1024 * 1024)).toFixed(2), "MB");
  console.log("- URL:", url);
  console.log("===========================");

  res.json({
    success: true,
    url,
    filename: req.file.filename,
    size: req.file.size,
  });
});

// ============================================================
// POST /upload-featured-destination
// ============================================================
router.post(
  "/upload-featured-destination",
  upload.single("destinationImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "لم يتم رفع أي صورة" });
      }

      const baseUrl = getBaseUrl(req);
      const relativePath = req.file.path.replace(/\\/g, "/");
      const imageUrl = baseUrl + relativePath;

      console.log("=== UPLOAD SUCCESS ===");
      console.log("- File uploaded to:", req.file.path);
      console.log("- Full URL:", imageUrl);
      console.log("===================");

      res.json({ success: true, imageUrl, imagePath: relativePath });
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

// ============================================================
// DELETE /delete-featured-destination-image
// ============================================================
router.delete("/delete-featured-destination-image", async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res
        .status(400)
        .json({ success: false, message: "مسار الصورة مطلوب" });
    }

    const projectRoot = getProjectRoot();
    const uploadsDir = getUploadsDir();
    const cleanPath = imagePath.replace(/\\/g, "/");
    const fullPath = path.join(projectRoot, cleanPath);

    if (!fullPath.startsWith(uploadsDir)) {
      return res
        .status(403)
        .json({ success: false, message: "غير مسموح بحذف هذا الملف" });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: "الملف غير موجود",
        requestedPath: imagePath,
      });
    }

    await fs.promises.unlink(fullPath);
    res.json({ success: true, message: "تم حذف الصورة بنجاح" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف الصورة",
      error: error.message,
    });
  }
});

export default router;
