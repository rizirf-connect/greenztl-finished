// routes/index.js
import express from "express";
import authRoutes from "./Auth.routes.js";
import userRoutes from "./user.routes.js";
import chapterRoutes from "./Chapter.routes.js";
import commentRoutes from "./Comment.routes.js";
import seriesRoutes from "./Series.routes.js";
import uploadImageRoutes from "../routes/upload-image.routes.js";
import notificationRoutes from "./notification.routes.js";
import paymentRoutes from "./payment.routes.js";
import monitorRoutes from './Monitor.routes.js';
import rssRoutes from './Rss.routes.js';

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chapters", chapterRoutes);
router.use("/comments", commentRoutes);
router.use("/series", seriesRoutes);
router.use("/upload", uploadImageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/payment", paymentRoutes);
router.use('/monitor', monitorRoutes);
router.use('/rss', rssRoutes);

export default router;
