import express from "express";
import multer from "multer";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  shareFile,
  uploadClientFile,
  uploadFile,
} from "../controllers/upload.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.post("/uploadFile", upload.any("files", 50), uploadFile);
router.post("/client-file", upload.any("files", 50), uploadClientFile);
router.post("/share-file", protectRoute, shareFile);
export default router;
