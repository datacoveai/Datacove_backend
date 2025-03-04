import express from "express";
import {
  authCheck,
  forgetPassword,
  individualSignup,
  login,
  logout,
  OrganizationSignUp,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/individual-signup", individualSignup);
router.post("/organization-signup", OrganizationSignUp);
router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.post("/login", login);
router.get("/authCheck", protectRoute, authCheck);

export default router;
