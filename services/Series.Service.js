import CrudService from "./service.js";
import { Series } from "../models/index.js";

class SeriesService extends CrudService {
  constructor() {
    super(Series);
  }
}

export const seriesService = new SeriesService();
