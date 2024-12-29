import CrudService from "./service.js";
import { Notification } from "../models/index.js";

class NotificationService extends CrudService {
  constructor() {
    super(Notification);
  }
}

export const notificationService = new NotificationService();
