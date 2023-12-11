import { Router } from "express";
import { protect } from "../middleware/protect.js";

import {
  getGiftTypes,
  getGiftType,
  createGiftType,
  deleteGiftType,
} from "../controller/giftType.js";

const router = Router();

//"/api/v1/GiftTypes"

router.route("/").get(getGiftTypes).post(protect, createGiftType);

router.route("/:id").get(getGiftType).delete(protect, deleteGiftType);

export default router;
