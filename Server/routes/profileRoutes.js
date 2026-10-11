import express from "express";
import multer from "multer";
import {
  getProfile, updateProfile, uploadAvatar, removeAvatar,
} from "../controllers/profileController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only image files are allowed")),
});

// Turn multer errors into a normal JSON message
const handleUpload = (req, res, next) =>
  upload.single("avatar")(req, res, (err) => {
    if (err) {
      const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be under 3 MB" : err.message;
      return res.status(400).json({ message });
    }
    next();
  });

router.route("/").get(getProfile).put(updateProfile);
router.route("/avatar").put(handleUpload, uploadAvatar).delete(removeAvatar);

export default router;