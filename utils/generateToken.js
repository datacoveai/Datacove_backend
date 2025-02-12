import jwt from "jsonwebtoken";
import { ENV_VARS } from "../config/envVar.js";

export const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, ENV_VARS.JWT_SECRET, { expiresIn: "15d" });

  res.cookie("datacove-ai", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, //15 days in MS
    httpOnly: true, //prevent xss attacks cross-state scripting attacks, make it not accessed by js
    sameSite: "strict",
  });
  return token;
};
