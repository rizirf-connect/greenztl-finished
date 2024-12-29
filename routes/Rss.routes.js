import express from "express";
import { generateRssFeed, getRssFeed } from "../controllers/Rss.Controller.js";

const router = express.Router();

router.get("/getRssFeed", getRssFeed);

router.get("/", generateRssFeed);

export default router;
