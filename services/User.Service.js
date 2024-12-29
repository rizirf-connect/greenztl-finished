import CrudService from "./service.js";
import { User } from "../models/index.js";

class UserService extends CrudService {
  constructor() {
    super(User);
  }
}

export const userService = new UserService();
