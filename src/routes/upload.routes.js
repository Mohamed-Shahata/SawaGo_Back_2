import express from "express";
import { upload } from "../config/multer.config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      console.log("FILE:", req.file);
      console.log("BODY:", req.body);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "لم يتم رفع أي صورة",
        });
      }

      const { placeName } = req.body;
      console.log("placeName:", placeName);

      const baseUrl = `${req.protocol}://${req.get("host")}/`;

      const filePath = req.file.path;
      console.log("filePath:", filePath);

      res.json({
        success: true,
        imageUrl: baseUrl + filePath,
        imagePath: filePath,
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

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: "مسار الصورة مطلوب",
      });
    }

    // ✅ منع Path Traversal Attack
    const normalizedPath = path
      .normalize(imagePath)
      .replace(/^(\.\.(\/|\\|$))+/, "");

    // ✅ فولدر الصور الأساسي
    const uploadsDir = path.join(__dirname, "..", "uploads");

    // ✅ المسار النهائي
    const fullPath = path.join(uploadsDir, normalizedPath);

    // ✅ تأكد إن الملف جوه فولدر uploads بس
    if (!fullPath.startsWith(uploadsDir)) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح بحذف هذا الملف",
      });
    }

    // ✅ تحقق وجود الملف
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: "الملف غير موجود",
      });
    }

    // ✅ حذف Async أفضل من Sync
    await fs.promises.unlink(fullPath);

    console.log("Deleted image:", fullPath);

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
