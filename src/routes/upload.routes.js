import express from "express";
import { upload } from "../config/multer.config.js";
import fs from "fs";
import path from "path";
import { getProjectRoot, getUploadsDir } from "../utils/path.utils.js";

const router = express.Router();

router.post(
  "/upload-face-and-id",
  upload.fields([
    { name: "face", maxCount: 1 },
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files;
    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    const urls = {
      face: files.face ? baseUrl + files.face[0].path : null,
      idFront: files.idFront ? baseUrl + files.idFront[0].path : null,
      idBack: files.idBack ? baseUrl + files.idBack[0].path : null,
    };

    res.json({ urls });
  },
);

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

      const baseUrl = `${req.protocol}://${req.get("host")}/`;

      const deleteFile = (fileUrl) => {
        if (!fileUrl) return;

        try {
          const filePath = fileUrl.replace(baseUrl, "");

          const fullPath = path.join(__dirname, "..", filePath);

          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (err) {
          console.log("Error deleting file:", err.message);
        }
      };

      if (files.idFront && oldIdFront) {
        deleteFile(oldIdFront);
        console.log("delete idFront");
      }

      if (files.idBack && oldIdBack) {
        deleteFile(oldIdBack);
        console.log("delete idBack");
      }

      const urls = {
        idFront: files.idFront
          ? baseUrl + files.idFront[0].path
          : oldIdFront || null,

        idBack: files.idBack
          ? baseUrl + files.idBack[0].path
          : oldIdBack || null,
      };

      if (!urls.idFront && !urls.idBack) {
        return res.status(400).json({
          message: "No ID images uploaded",
        });
      }

      res.json({
        message: "ID images updated successfully",
        urls,
      });
    } catch (err) {
      res.status(500).json({
        message: "Server error",
        error: err.message,
      });
    }
  },
);

router.post(
  "/upload-featured-destination",
  upload.single("destinationImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "لم يتم رفع أي صورة",
        });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}/`;

      // المسار النسبي من req.file.path (مثل: uploads/others/123456.jpg)
      const relativePath = req.file.path.replace(/\\/g, "/");

      console.log("=== UPLOAD SUCCESS ===");
      console.log("- File uploaded to:", req.file.path);
      console.log("- Relative path:", relativePath);
      console.log("- Full URL:", baseUrl + relativePath);
      console.log("===================");

      res.json({
        success: true,
        imageUrl: baseUrl + relativePath,
        imagePath: relativePath, // احفظ المسار الكامل مع uploads
      });
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

router.delete("/delete-featured-destination-image", async (req, res) => {
  try {
    const { imagePath } = req.body;

    console.log("=== DELETE REQUEST ===");
    console.log("Received imagePath:", imagePath);

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: "مسار الصورة مطلوب",
      });
    }

    // استخدم الـ utility للحصول على المسار الصحيح
    const projectRoot = getProjectRoot();
    const uploadsDir = getUploadsDir();

    console.log("Project root:", projectRoot);
    console.log("Uploads dir:", uploadsDir);

    // تنظيف المسار
    const cleanPath = imagePath.replace(/\\/g, "/");
    console.log("Clean path:", cleanPath);

    // بناء المسار الكامل
    const fullPath = path.join(projectRoot, cleanPath);
    console.log("Full path to delete:", fullPath);

    // التحقق من الأمان
    if (!fullPath.startsWith(uploadsDir)) {
      console.log("Security check failed - path outside uploads dir");
      return res.status(403).json({
        success: false,
        message: "غير مسموح بحذف هذا الملف",
      });
    }

    // التحقق من وجود الملف
    if (!fs.existsSync(fullPath)) {
      console.log("File not found at:", fullPath);

      // طباعة محتويات المجلد للتشخيص
      const dirname = path.dirname(fullPath);
      if (fs.existsSync(dirname)) {
        const files = fs.readdirSync(dirname);
        console.log("Files in directory:", files);
      } else {
        console.log("Directory does not exist:", dirname);
      }

      return res.status(404).json({
        success: false,
        message: "الملف غير موجود",
        requestedPath: imagePath,
        searchedPath: fullPath,
      });
    }

    // حذف الملف
    await fs.promises.unlink(fullPath);

    console.log("✓ File deleted successfully:", fullPath);
    console.log("===================");

    res.json({
      success: true,
      message: "تم حذف الصورة بنجاح",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف الصورة",
      error: error.message,
    });
  }
});

router.post(
  "/upload-images",
  upload.fields([
    { name: "face", maxCount: 1 },
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files;
    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    const urls = {
      face: files.face ? baseUrl + files.face[0].path : null,
      idFront: files.idFront ? baseUrl + files.idFront[0].path : null,
      idBack: files.idBack ? baseUrl + files.idBack[0].path : null,
      license: files.license ? baseUrl + files.license[0].path : null,
    };

    res.json({ urls });
  },
);

export default router;
