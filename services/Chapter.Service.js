import CrudService from "./service.js";
import { Chapter } from "../models/index.js";

class ChapterService extends CrudService {
  constructor() {
    super(Chapter);
  }
}

export const chapterService = new ChapterService();
