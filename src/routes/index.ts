import { Router } from "express";
import authRoutes from "./auth.routes";
import tutorRoutes from "./tutor.routes";
import bookingRoutes from "./booking.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tutors", tutorRoutes);
router.use("/bookings", bookingRoutes);

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "MediQueue API is running", timestamp: new Date() });
});

export default router;
