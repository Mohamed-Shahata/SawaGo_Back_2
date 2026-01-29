import multer from "multer";
import path from "path";
import { createFolderIfNotExist } from "../utils/file.utils.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";

    if (file.fieldname === "face") folder = "uploads/face";
    if (file.fieldname === "idFront") folder = "uploads/id/front";
    if (file.fieldname === "idBack") folder = "uploads/id/back";
    if (file.fieldname === "license") folder = "uploads/license";

    createFolderIfNotExist(folder);
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

export const upload = multer({ storage });
