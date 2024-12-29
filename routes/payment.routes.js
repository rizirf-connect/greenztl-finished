import express from "express";
import {
  capturePayment,
  createPayment,
} from "../controllers/payment.controller.js";
const router = express.Router();

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     summary: Create a payment order
 *     description: Generates a client token and amount for a chapter purchase.
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chapterId:
 *                 type: string
 *                 description: The ID of the chapter being purchased.
 *                 example: "615d9c28c25e5e0016b9a3b1"
 *     responses:
 *       200:
 *         description: Client token and amount for the payment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientToken:
 *                   type: string
 *                   description: The client token for payment.
 *                 amount:
 *                   type: number
 *                   description: The price of the chapter.
 *       404:
 *         description: Chapter not found.
 *       500:
 *         description: Error generating token.
 */
router.post("/create", createPayment);

/**
 * @swagger
 * /api/payment/capture:
 *   post:
 *     summary: Capture a payment
 *     description: Captures the payment and marks the chapter as purchased by the user.
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethodNonce:
 *                 type: string
 *                 description: The payment method nonce.
 *                 example: "fake-valid-nonce"
 *               amount:
 *                 type: number
 *                 description: The amount to be captured.
 *                 example: 10.00
 *               userId:
 *                 type: string
 *                 description: The ID of the user making the purchase.
 *                 example: "615d9c28c25e5e0016b9a3b2"
 *               chapterId:
 *                 type: string
 *                 description: The ID of the chapter being purchased.
 *                 example: "615d9c28c25e5e0016b9a3b1"
 *     responses:
 *       200:
 *         description: Payment successful and chapter added.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       400:
 *         description: Payment failed.
 *       500:
 *         description: Error capturing payment.
 */
router.post("/capture", capturePayment);

export default router;
