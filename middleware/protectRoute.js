import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js";
import { Org } from "../model/org.model.js";
import { ENV_VARS } from "../config/envVar.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies["datacove-ai"];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    }

    const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid Token",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");
    const org = await Org.findById(decoded.userId).select("-password");

    if (!user && !org) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const account = user || org;

    req.user = account;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({
      success: false,
      message: "User not found",
    });
  }
};
