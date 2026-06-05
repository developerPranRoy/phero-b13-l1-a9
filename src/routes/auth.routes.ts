import { Router } from "express";
import {
  register,
  login,
  issueJwt,
  googleMock,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/jwt", issueJwt);
router.post("/google-mock", googleMock);

export default router;
