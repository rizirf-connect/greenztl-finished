import CrudService from "./service.js";
import { Monitor } from "../models/index.js";

class MonitorService extends CrudService {
  constructor() {
    super(Monitor);
  }
}

export const monitorService = new MonitorService();
