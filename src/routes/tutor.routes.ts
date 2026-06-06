import { Router } from "express";
import {
  getTutors,
  getTutorById,
  createTutor,
  updateTutor,
  deleteTutor,
} from "../controllers/tutor.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getTutors);
router.get("/:id", getTutorById);
router.post("/", authenticate, createTutor);
router.put("/:id", authenticate, updateTutor);
router.delete("/:id", authenticate, deleteTutor);

export default router;
