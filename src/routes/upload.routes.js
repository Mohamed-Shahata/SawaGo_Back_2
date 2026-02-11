import express from "express";
import { upload } from "../config/multer.config.js";
import fs from "fs";
import path from "path";

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

      const { placeName } = req.body;
      const baseUrl = `${req.protocol}://${req.get("host")}/`;

      // إنشاء اسم فريد للملف
      const timestamp = Date.now();
      const sanitizedPlaceName = placeName
        ? placeName.replace(/\s+/g, "-")
        : "destination";
      const fileName = `featured-destinations/${sanitizedPlaceName}-${timestamp}`;

      // مسار الملف الكامل
      const filePath = req.file.path;
      const newFilePath = path.join(
        path.dirname(filePath),
        `${sanitizedPlaceName}-${timestamp}${path.extname(filePath)}`,
      );

      // إعادة تسمية الملف
      fs.renameSync(filePath, newFilePath);

      // رابط الصورة
      const relativePath = newFilePath.replace(path.join(__dirname, ".."), "");
      const imageUrl = baseUrl + relativePath.replace(/\\/g, "/");

      res.json({
        success: true,
        message: "تم رفع الصورة بنجاح",
        imageUrl: imageUrl,
        imagePath: relativePath,
        fileName: path.basename(newFilePath),
      });
    } catch (error) {
      console.error("Error uploading destination image:", error);
      res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء رفع الصورة",
        error: error.message,
      });
    }
  },
);

// ✅ NEW ENDPOINT: حذف صورة وجهة سياحية
router.delete("/delete-featured-destination-image", async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: "مسار الصورة مطلوب",
      });
    }

    const fullPath = path.join(__dirname, "..", imagePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log("Deleted image:", fullPath);

      res.json({
        success: true,
        message: "تم حذف الصورة بنجاح",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "الملف غير موجود",
      });
    }
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
