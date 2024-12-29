import express from "express";
import {
  createComment,
  getAllComments,
  getCommentById,
  updateComment,
  deleteComment,
  updateLikeDislike,
} from "../controllers/Comment.Controller.js";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../schemas/CommentSchemas.js";
import validateSchema from "../middlewares/validateSchema.js";
import { requireUser } from "../middlewares/requireUser.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comments management and CRUD operations
 */

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "I loved this part where the hero saved the village!"
 *               userId:
 *                 type: string
 *                 description: ID of the user who wrote the comment
 *                 example: "60d0fe4f5311236168a109ca"
 *               chapterId:
 *                 type: string
 *                 description: ID of the chapter the comment is related to
 *                 example: "60d0fe4f5311236168a109cb"
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Invalid request, missing required fields
 */
router.post(
  "/",
  validateSchema(createCommentSchema),
  requireUser,
  createComment
);

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get all comments
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         schema:
 *           type: string
 *         required: true
 *         description: The chapter ID
 *     responses:
 *       200:
 *         description: A list of all comments
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllComments);

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Get comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: The comment details
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getCommentById);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "I changed my mind about the hero's actions."
 *               likes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "60d0fe4f5311236168a109ca"
 *               dislikes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "60d0fe4f5311236168a109cb"
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error

 */
router.put(
  "/:id",
  validateSchema(updateCommentSchema),
  requireUser,
  updateComment
);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteComment);

/**
 * @swagger
 * /api/comments/{id}/like-dislike:
 *   post:
 *     summary: Like or dislike a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user liking/disliking the comment
 *               type:
 *                 type: string
 *                 description: Either 'like' or 'dislike'
 *                 example: 'like'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Invalid request or already liked/disliked
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/like-dislike", requireUser, updateLikeDislike);

export default router;
