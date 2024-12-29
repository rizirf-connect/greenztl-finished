// comment.controller.js
import { commentService } from "../services/Comment.Service.js";
import mongoose from "mongoose";

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const comment = await commentService.create(req.body);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read all comments
export const getAllComments = async (req, res) => {
  try {
    const comments = await commentService.model
      .find({
        chapterId: req.query.chapterId,
      })
      .populate("userId", "name email");
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read a comment by ID
export const getCommentById = async (req, res) => {
  try {
    const comment = await commentService.readById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const comment = await commentService.update(req.params.id, req.body);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const comment = await commentService.delete(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(204).send(); // No content to send back
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLikeDislike = async (req, res) => {
  const { id: commentId } = req.params;
  const { userId, type } = req.body;

  if (!userId || !type || !commentId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const comment = await commentService.readById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Initialize 'likes' and 'dislikes' arrays if they don't exist
    if (!Array.isArray(comment.likes)) {
      comment.likes = [];
    }
    if (!Array.isArray(comment.dislikes)) {
      comment.dislikes = [];
    }

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId); // Create instance using 'new'

    // Handle like
    if (type === "like") {
      if (comment.likes.some((id) => id.equals(userObjectId))) {
        // User wants to "unlike" the comment
        comment.likes = comment.likes.filter((id) => !id.equals(userObjectId));
        await comment.save();
        return res.status(200).json({ message: "Like removed.", comment });
      } else {
        // User likes the comment, remove from dislikes if present
        comment.likes.push(userObjectId);
        comment.dislikes = comment.dislikes.filter(
          (id) => !id.equals(userObjectId)
        );
      }
    }
    // Handle dislike
    else if (type === "dislike") {
      if (comment.dislikes.some((id) => id.equals(userObjectId))) {
        // User wants to "undislike" the comment
        comment.dislikes = comment.dislikes.filter(
          (id) => !id.equals(userObjectId)
        );
        await comment.save();
        return res.status(200).json({ message: "Dislike removed.", comment });
      } else {
        // User dislikes the comment, remove from likes if present
        comment.dislikes.push(userObjectId);
        comment.likes = comment.likes.filter((id) => !id.equals(userObjectId));
      }
    }
    // Invalid type handling
    else {
      return res
        .status(400)
        .json({ message: "Invalid type. Must be 'like' or 'dislike'." });
    }

    // Save the updated comment
    await comment.save();

    res.status(200).json({ message: "Comment updated successfully.", comment });
  } catch (error) {
    console.error("Error in updateLikeDislike:", error.message || error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message || error,
    });
  }
};
