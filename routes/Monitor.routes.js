import express from "express";
import {
  checkMonitorInitialized,
  Str_monitor,
  Stp_monitor,
  Stat_Monitor,
  Update_Monitor,
  New_Folder,
} from "../controllers/Kat.Controller.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MonitorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
 *         status:
 *           type: string
 *           enum: [running, stopped]
 *           example: "running"
 *     MonitorStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [running, stopped]
 *           example: "running"
 *         folderCount:
 *           type: integer
 *           example: 5
 *         processedFiles:
 *           type: integer
 *           example: 42
 *     FolderRequest:
 *       type: object
 *       required:
 *         - folderId
 *         - seriesId
 *       properties:
 *         folderId:
 *           type: string
 *           example: "1234567890abcdef"
 *           description: Google Drive folder ID
 *         seriesId:
 *           type: string
 *           example: "60d0fe4f5311236168a109cb"
 *           description: Associated series ID in the system
 *         isPremium:
 *           type: boolean
 *           default: false
 *           description: Whether the content is premium
 *         price:
 *           type: number
 *           default: 0
 *           description: Price for premium content
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Operation failed"
 *         details:
 *           type: string
 *           example: "Detailed error message"
 */

/**
 * @swagger
 * tags:
 *   name: Monitor
 *   description: Drive folder monitoring and content processing operations
 */

/**
 * @swagger
 * /api/monitor/start:
 *   post:
 *     summary: Start the drive monitor
 *     tags: [Monitor]
 *     responses:
 *       200:
 *         description: Monitor started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonitorResponse'
 *       400:
 *         description: Monitor already running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/start", Str_monitor);

/**
 * @swagger
 * /api/monitor/stop:
 *   post:
 *     summary: Stop the drive monitor
 *     tags: [Monitor]
 *     responses:
 *       200:
 *         description: Monitor stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonitorResponse'
 *       400:
 *         description: Monitor not running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/stop", Stp_monitor);

/**
 * @swagger
 * /api/monitor/status:
 *   get:
 *     summary: Get current monitor status
 *     tags: [Monitor]
 *     responses:
 *       200:
 *         description: Current monitor status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonitorStatus'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/status", Stat_Monitor);

/**
 * @swagger
 * /api/monitor/check-now:
 *   post:
 *     summary: Trigger immediate folder check
 *     tags: [Monitor]
 *     responses:
 *       200:
 *         description: Manual check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Manual folder check completed"
 *                 folderCount:
 *                   type: integer
 *                   example: 5
 *                 processedFiles:
 *                   type: integer
 *                   example: 42
 *                 processed:
 *                   type: object
 *                   properties:
 *                     folders:
 *                       type: integer
 *                       example: 3
 *                     files:
 *                       type: integer
 *                       example: 15
 *                     errors:
 *                       type: integer
 *                       example: 0
 *                     skipped:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Monitor not running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/check-now", checkMonitorInitialized, Update_Monitor);

/**
 * @swagger
 * /api/monitor/add-folder:
 *   post:
 *     summary: Add new folder to monitor
 *     tags: [Monitor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FolderRequest'
 *     responses:
 *       200:
 *         description: Folder added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Folder added successfully"
 *                 folderCount:
 *                   type: integer
 *                   example: 6
 *                 folder:
 *                   $ref: '#/components/schemas/FolderRequest'
 *       400:
 *         description: Invalid request or monitor not running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/add-folder", checkMonitorInitialized, New_Folder);

export default router;