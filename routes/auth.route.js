import express from "express";
import {
  authCheck,
  individualSignup,
  login,
  logout,
  OrganizationSignUp,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/individual-signup", individualSignup);
router.post("/organization-signup", OrganizationSignUp);
router.post("/logout", logout);
router.post("/login", login);
router.get("/authCheck", protectRoute, authCheck);

export default router;
