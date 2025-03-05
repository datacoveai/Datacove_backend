import express from "express";
import {
  authCheck,
  forgetPassword,
  individualSignup,
  login,
  logout,
  OrganizationSignUp,
  resendOTP,
  resetPassword,
  verifyOTP,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/individual-signup", individualSignup);
router.post("/organization-signup", OrganizationSignUp);
router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.get("/authCheck", protectRoute, authCheck);

export default router;
