import multer from "multer";
import path from "path";
import fs from "fs";

// ============================================================
// إنشاء المجلدات المطلوبة لو مش موجودة
// ============================================================
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const UPLOAD_DIRS = {
  face: "uploads/face",
  id: "uploads/id",
  license: "uploads/license",
  vehicleDocs: "uploads/vehicle/docs",
  others: "uploads/others",
  videos: "uploads/videos",
  destinations: "uploads/destinations",
};

// إنشاء كل المجلدات عند تحميل الملف
Object.values(UPLOAD_DIRS).forEach(ensureDir);

// ============================================================
// Storage configuration
// ============================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/others"; // default

    switch (file.fieldname) {
      case "face":
        uploadPath = UPLOAD_DIRS.face;
        break;
      case "idFront":
      case "idBack":
        uploadPath =
          UPLOAD_DIRS.id + "/" + file.fieldname.replace("id", "").toLowerCase();
        // مثال: uploads/id/front أو uploads/id/back
        ensureDir(uploadPath);
        break;
      case "licenseFront":
      case "licenseBack":
        uploadPath = UPLOAD_DIRS.license;
        break;
      case "vehicleLicense":
      case "vehicleRegistration":
      case "vehicleInsurance":
        uploadPath = UPLOAD_DIRS.vehicleDocs + "/" + file.fieldname;
        ensureDir(uploadPath);
        break;
      case "others":
        uploadPath = UPLOAD_DIRS.others;
        break;
      case "video":
        uploadPath = UPLOAD_DIRS.videos;
        break;
      case "destinationImage":
        uploadPath = UPLOAD_DIRS.destinations;
        break;
      default:
        uploadPath = "uploads/others";
        ensureDir(uploadPath);
        break;
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  },
});

// ============================================================
// File filter: صور وفيديوهات فقط
// ============================================================
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp|gif/;
  const allowedVideoTypes = /mp4|mov|avi|mkv|webm|3gp/;

  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mimeType = file.mimetype;

  const isImage = allowedImageTypes.test(ext) || mimeType.startsWith("image/");
  const isVideo = allowedVideoTypes.test(ext) || mimeType.startsWith("video/");

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

// ============================================================
// Multer instance
// ============================================================
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (للفيديو)
    files: 15, // max 15 files في نفس الوقت
  },
});

export default upload;
