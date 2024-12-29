import CrudService from "./service.js";
import { Comment } from "../models/index.js";

class CommentService extends CrudService {
  constructor() {
    super(Comment);
  }
}

export const commentService = new CommentService();
