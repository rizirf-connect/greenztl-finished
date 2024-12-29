import express from "express";
import {
  createChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  getRecentlyUpdatedChapters,
  bulkUploadChapters,
  getChapterForRss,
} from "../controllers/Chapter.Controller.js";
import multer from "multer";
import { chapterSchema } from "../schemas/ChapterSchema.js";
import validateSchema from "../middlewares/validateSchema.js";
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chapters
 *   description: Chapter management and CRUD operations
 */

/**
 * @swagger
 * /api/chapters:
 *   post:
 *     summary: Create a new chapter by uploading a document file
 *     tags: [Chapters]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the chapter
 *                 example: "Chapter 1"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The document file containing the chapter content
 *                 required: true
 *               seriesId:
 *                 type: string
 *                 description: ID of the series the chapter belongs to
 *                 example: "60d0fe4f5311236168a109cb"
 *                 required: true
 *               isPremium:
 *                 type: boolean
 *                 description: (Optional) Whether the chapter is premium
 *                 example: false
 *               price:
 *                 type: number
 *                 description: (Optional) Price of the chapter if it is premium
 *                 example: 5.99
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chapter created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cd"
 *                     name:
 *                       type: string
 *                       example: "Chapter 1"
 *                     content:
 *                       type: string
 *                       example: "<p>This is the <strong>content</strong> of the chapter with <em>HTML formatting</em>.</p>"
 *                     seriesId:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109cb"
 *                     isPremium:
 *                       type: boolean
 *                       example: false
 *                     price:
 *                       type: number
 *                       example: 5.99
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request, missing required fields
 */

router.post("/", upload.single("file"), createChapter);



/**
 * @swagger
 * /api/chapters/bulk-upload/{seriesId}:
 *   post:
 *     summary: Bulk upload chapters from an Excel file
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         description: The ID of the series the chapters belong to
 *         schema:
 *           type: string
 *           example: "60d0fe4f5311236168a109cb"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The Excel file containing chapter names and content
 *                 required: true
 *     responses:
 *       201:
 *         description: Chapters uploaded successfully
 *       400:
 *         description: Invalid request, error parsing the file
 *       500:
 *         description: Internal server error
 */
router.post(
  "/bulk-upload/:seriesId",
  upload.single("file"),
  bulkUploadChapters
);

/**
 * @swagger
 * /api/chapters:
 *   get:
 *     summary: Get all chapters
 *     tags: [Chapters]
 *     parameters:
 *       - in: query
 *         name: seriesId
 *         required: false
 *         description: ID of the series to filter chapters by
 *         schema:
 *           type: string
 *           example: "60d0fe4f5311236168a109cb"
 *     responses:
 *       200:
 *         description: A list of all chapters or chapters for a specific series
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllChapters);

/**
 * @swagger
 * /api/chapters/recently-updated:
 *   get:
 *     summary: Get recently updated chapters
 *     tags: [Chapters]
 *     description: Retrieve a list of recently updated chapters, sorted by the latest update date.
 *     responses:
 *       200:
 *         description: A list of recently updated chapters
 *       500:
 *         description: Internal server error
 */
router.get("/recently-updated", getRecentlyUpdatedChapters);

/**
 * @swagger
 * /api/chapters/rss-chapter:
 *   get:
 *     summary: Get recently updated chapters
 *     tags: [Chapters]
 *     description: Retrieve a list of recently updated chapters, sorted by the latest update date.
 *     responses:
 *       200:
 *         description: A list of recently updated chapters
 *       500:
 *         description: Internal server error
 */
router.get("/rss-chapter", getChapterForRss);

/**
 * @swagger
 * /api/chapters/{id}:
 *   get:
 *     summary: Get chapter by ID
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The chapter ID
 *     responses:
 *       200:
 *         description: The chapter details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "60d0fe4f5311236168a109cd"
 *                 title:
 *                   type: string
 *                   example: "Chapter 1"
 *                 content:
 *                   type: string
 *                   example: "This is the content of the chapter."
 *                 seriesId:
 *                   type: string
 *                   example: "60d0fe4f5311236168a109cb"
 *                 isPremium:
 *                   type: boolean
 *                   example: false
 *                 price:
 *                   type: number
 *                   example: 5.99
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getChapterById);

/**
 * @swagger
 * /api/chapters/{id}:
 *   put:
 *     summary: Update a chapter
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Chapter Title"
 *               content:
 *                 type: string
 *                 example: "Updated content for this chapter."
 *               isPremium:
 *                 type: boolean
 *                 example: false
 *               price:
 *                 type: number
 *                 example: 4.99
 *     responses:
 *       200:
 *         description: Chapter updated successfully
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", validateSchema(chapterSchema), updateChapter);

/**
 * @swagger
 * /api/chapters/{id}:
 *   delete:
 *     summary: Delete a chapter
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The chapter ID
 *     responses:
 *       200:
 *         description: Chapter deleted successfully
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteChapter);

export default router;
