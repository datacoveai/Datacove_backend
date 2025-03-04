import express from "express";
import { User } from "../model/user.model.js";
import { Org } from "../model/org.model.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import { createUserBucket } from "../s3.js";
import crypto from "crypto";
import { ENV_VARS } from "../config/envVar.js";
import sgMail from "@sendgrid/mail";
import { Client } from "../model/client.model.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function individualSignup(req, res) {
  try {
    const { name, email, phone, password } = req.body;
    // console.log("BODY", req.body);

    if (!name || !password || !email || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const formattedName = name.toLowerCase().replace(/\s+/g, "");
    console.log("Formatted-Name", formattedName);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Phonenumber must be at least 10 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUserByEmail = await User.findOne({ email: email });

    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: "You already created an individual account with this email.",
      });
    }

    const existingOrgByEmail = await Org.findOne({ email: email });

    if (existingOrgByEmail) {
      return res.status(400).json({
        success: false,
        message: "You already created an organization account with this email.",
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const PROFILE_PICS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];

    const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)];

    const newUser = new User({
      name: formattedName,
      displayName: name,
      email,
      password: hashedPassword,
      phoneNumber: phone,
      image,
      userType: "individual",
    });

    // Create an S3 bucket for the user
    const bucketName = await createUserBucket(newUser._id, newUser.name);

    // Update user with bucket info
    newUser.s3Bucket = bucketName;
    await newUser.save();

    generateTokenAndSetCookie(newUser._id, res);

    res.status(201).json({
      success: true,
      user: {
        ...newUser._doc,
        password: "",
        s3Bucket: bucketName,
      },
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function OrganizationSignUp(req, res) {
  try {
    const { name, email, phone, password, organizationName } = req.body;

    if (!name || !password || !email || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const formattedName = name.toLowerCase().replace(/\s+/g, "");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUserByEmail = await User.findOne({ email: email });

    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: "You already created an individual account with this email.",
      });
    }

    const existingOrgByEmail = await Org.findOne({ email: email });

    if (existingOrgByEmail) {
      return res.status(400).json({
        success: false,
        message: "You already created an organization account with this email.",
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const PROFILE_PICS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];

    const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)];

    const orgUser = new Org({
      name: formattedName,
      displayName: name,
      organizationName,
      email,
      password: hashedPassword,
      phoneNumber: phone,
      image,
      userType: "Organization",
    });

    // Create an S3 bucket for the user
    const bucketName = await createUserBucket(orgUser._id, orgUser.name);

    // Update user with bucket info
    orgUser.s3Bucket = bucketName;
    await orgUser.save();

    generateTokenAndSetCookie(orgUser._id, res);

    res.status(201).json({
      success: true,
      user: {
        ...orgUser._doc,
        password: "",
        s3Bucket: bucketName,
      },
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function logout(req, res) {
  try {
    console.log("Logout request received, Cookies:", req.cookies);
    res.clearCookie("datacove-ai", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/", // Match with cookie path
      domain: ".netlify.app", // Matches frontend domain
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Error in logout controller", error.messge);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    // console.log("BODY-LOGIN", req.body);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter both email and password",
      });
    }

    const user = await User.findOne({ email: email });
    const org = await Org.findOne({ email: email });
    const client = await Client.findOne({ email: email });

    if (!user && !org && !client) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid credentials" });
    }

    const account = user || org || client; // Pick whichever exists
    // console.log("ACC", account);

    const isPasswordCorrect = await bcryptjs.compare(
      password,
      account.password
    );
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(account._id, res);
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        ...account._doc,
        password: "", // Remove password from response
      },
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function forgetPassword(req, res) {
  try {
    const { email } = req.body;
    console.log("EMAIL", email);

    const user = await User.findOne({ email });
    const org = await Org.findOne({ email });

    if (!user && !org) {
      return res
        .status(404)
        .json({ success: false, message: "incorrect email" });
    }

    const account = user || org;

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token (for security) before storing in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token in DB with expiration time (1 hour)
    account.resetPasswordToken = hashedToken;
    account.resetPasswordExpires = Date.now() + 3600000;

    await account.save();

    // Create reset link
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    // Define the email content
    const msg = {
      to: account.email, // Recipient's email
      from: ENV_VARS.SENDGRID_EMAIL, // Your verified SendGrid email
      subject: "Password Reset Request",
      text: `Click the link below to reset your password:\n\n${resetLink}`,
      html: `<p>Click the link below to reset your password:</p>
               <a href="${resetLink}" target="_blank">${resetLink}</a>`,
    };

    // Send email using SendGrid
    await sgMail.send(msg);
    res
      .status(200)
      .json({ success: true, message: "Password reset link sent to email." });
  } catch (error) {
    console.log("Error in forget password controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.body;
    const { newPassword } = req.body;

    console.log("Token", token);
    console.log("newPassword", newPassword);

    // Hash the received token (to match the stored hashed token)
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with the valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is expired
    });

    const org = await Org.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is expired
    });

    if (!user && !org) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token." });
    }

    // Hash the new password
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(newPassword, salt);

    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export async function authCheck(req, res) {
  try {
    // console.log(req.user);
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.log("Error in authCheck controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
