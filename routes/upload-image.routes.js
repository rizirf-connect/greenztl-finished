import express from "express";
import upload from "../middlewares/multer.js";
import { uploadImage } from "../controllers/UploadImage.Controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload an image
 *     tags: [Upload]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid input or file not provided
 *       500:
 *         description: Server error
 */
router.post("/", upload.single("image"), uploadImage);

export default router;
