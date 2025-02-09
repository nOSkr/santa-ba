import { Router } from "express";
import { protect, authorize } from "../middleware/protect.js";

import {
  register,
  login,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  logout,
  authMeUser,
  allUserNotification,
  chargeTime,
  invoiceCheck,
  invoiceTime,
} from "../controller/users.js";

const router = Router();

//"/api/v1/users"
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/callbacks/:id/:numId").get(chargeTime);
router.route("/check/challbacks/:id/:numId").get(invoiceCheck);
// router.route("/updatePrivacy").post(updatePrivacy);
router.route("/notificationAll").post(protect, allUserNotification);

router.use(protect);
//"/api/v1/users"
router
  .route("/")
  .get(authorize("admin"), getUsers)
  .post(authorize("admin"), createUser);
router.route("/invoice/:id").post(invoiceTime);
router.route("/me").get(protect, authMeUser);
router.route("/:id").get(getUser).put(updateUser).delete(protect, deleteUser);

export default router;
