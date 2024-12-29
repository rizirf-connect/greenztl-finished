import express from "express";
import connectDB from "./config/db.js";
import requestLogger from "./middlewares/requestLogger.js";
import routes from "./routes/index.js";
import cors from "cors";
import swaggerUI from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";
import basicAuth from "basic-auth";
import bodyParser from "body-parser";
import cron from "node-cron";
import { automateChapters } from "./controllers/Chapter.Controller.js";
import { runBot } from "./bot.js";

const app = express();
connectDB();

// Configure middleware first
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(requestLogger);

// Swagger documentation setup
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

process.env.TZ = "Australia/Sydney";
cron.schedule("0 */2 * * *", () => {
  console.log("Task is running every 2 hours");
  // calling function which controls chapter update
  automateChapters();
});

// Main routes
app.use("/api", routes);

// 404 handler
app.use("*", (req, res) => {
  console.log("[DEBUG] 404 - Route not found:", req.originalUrl);
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware must be last
app.use((err, req, res, next) => {
  console.error("[ERROR] Middleware error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
    path: req.path,
  });
});

// running discord bot
runBot();

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `API Documentation available at: http://localhost:${PORT}/api-docs`
  );
});
