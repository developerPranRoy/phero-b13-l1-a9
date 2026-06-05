import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
} from "../controllers/booking.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createBooking);
router.get("/", authenticate, getMyBookings);
router.patch("/:id/cancel", authenticate, cancelBooking);

export default router;
