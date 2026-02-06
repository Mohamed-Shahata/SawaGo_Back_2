import express from "express";
import { upload } from "../config/multer.config.js";

const router = express.Router();

router.post("/upload-face-image", upload.single("face"), (req, res) => {
  const file = req.file;
  const baseUrl = `${req.protocol}://${req.get("host")}/`;

  if (!file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  res.json({
    profileImage: baseUrl + file.path,
  });
});

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
  (req, res) => {
    const files = req.files || {};
    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    const urls = {
      idFront: files.idFront ? baseUrl + files.idFront[0].path : null,
      idBack: files.idBack ? baseUrl + files.idBack[0].path : null,
    };

    // لو مفيش ولا صورة اترفعت
    if (!urls.idFront && !urls.idBack) {
      return res.status(400).json({
        message: "No ID images uploaded",
      });
    }

    res.json({
      message: "ID images updated successfully",
      urls,
    });
  },
);

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
