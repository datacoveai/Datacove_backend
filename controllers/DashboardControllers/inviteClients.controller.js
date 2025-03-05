import sgMail from "@sendgrid/mail";
import crypto from "crypto";
import { ENV_VARS } from "../../config/envVar.js";
import { User } from "../../model/user.model.js";
import { Org } from "../../model/org.model.js";
import { Client } from "../../model/client.model.js";
import bcryptjs from "bcryptjs";
import { uploadEmptyObject } from "../../s3.js";
import mongoose from "mongoose";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function inviteClients(req, res) {
  try {
    const { email, userId } = req.body;
    console.log("Email from invite", email);
    console.log("userId from invite", userId);

    // Generate a unique invitation token
    const invitationToken = crypto.randomBytes(20).toString("hex");

    // Set expiration date (72 hours from now)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 72);

    // Create invitation link
    const invitationLink = `${ENV_VARS.FRONTEND_URL}/join?token=${invitationToken}`;

    const acc = (await User.findById(userId)) || (await Org.findById(userId));

    if (!acc) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    // Check if client is already in the clients list
    const alreadyClient = acc.clients.some((client) => client.email === email);

    if (alreadyClient) {
      return res
        .status(400)
        .json({ success: false, message: "This user is already your client." });
    }

    // Check if client is already invited
    const existingInvitationIndex = acc.invitations.findIndex(
      (invite) => invite.inviteeEmail === email
    );

    if (existingInvitationIndex !== -1) {
      // Update existing invitation with new token and reset expiration
      acc.invitations[existingInvitationIndex].token = invitationToken;
      acc.invitations[existingInvitationIndex].expiresAt = expirationDate;
      acc.invitations[existingInvitationIndex].status = "pending";
      // Optional: You may want to track that this is a re-invitation
      acc.invitations[existingInvitationIndex].updatedAt = new Date();
    } else {
      // Create new invitation
      acc.invitations.push({
        inviteeEmail: email,
        token: invitationToken,
        status: "pending",
        clientId: `${email}-${Date.now()}`,
        expiresAt: expirationDate,
        createdAt: new Date(),
      });
    }

    await acc.save();

    const msg = {
      to: email,
      from: ENV_VARS.SENDGRID_EMAIL,
      subject: "Join our document sharing platform!",
      text: `${acc.name} invited you to join. Click here: ${invitationLink} (This invitation expires in 72 hours)`,
      html: `
        <div>
          <h2>You've been invited!</h2>
          <p><strong>${acc.name}</strong> has invited you.</p>
          <p>Click the link below to create your account:</p>
          <a href="${invitationLink}">Accept Invitation</a>
          <p><em>This invitation expires in 72 hours.</em></p>
        </div>
      `,
    };

    // Send email using SendGrid
    await sgMail.send(msg);
    res
      .status(200)
      .json({ success: true, message: "Invitation sent successfully" });
  } catch (error) {
    console.log("Error in inviting client", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error in inviting client",
    });
  }
}

export async function getInvitation(req, res) {
  try {
    const { token } = req.query;

    // Find the account that has this invitation token
    const account =
      (await User.findOne({ "invitations.token": token })) ||
      (await Org.findOne({ "invitations.token": token }));

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Invalid invitation token",
      });
    }

    // Find the specific invitation
    const invitation = account.invitations.find((inv) => inv.token === token);

    // Check if invitation has expired
    const now = new Date();
    if (now > new Date(invitation.expiresAt)) {
      // Update status to expired
      invitation.status = "expired";
      await account.save();

      return res.status(400).json({
        success: false,
        message:
          "This invitation has expired. Please request a new invitation.",
        expired: true,
      });
    }

    // Token is valid and not expired
    return res.status(200).json({
      success: true,
      invitation: {
        email: invitation.inviteeEmail,
        name: invitation.inviteeName,
        inviterId: account._id,
        inviterName: account.name,
      },
    });
  } catch (error) {
    console.log("Error verifying invitation token", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error verifying invitation",
    });
  }
}

export async function acceptInvitation(req, res) {
  try {
    const { token, email, name, password } = req.body;

    const formattedName = name.toLowerCase().replace(/\s+/g, "");

    // Find the invitation using the token
    const userInviter = await User.findOne({ "invitations.token": token });
    const orgInviter = await Org.findOne({ "invitations.token": token });

    if (!userInviter && !orgInviter) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired invitation." });
    }

    const inviter = userInviter || orgInviter;

    // Find the specific invitation
    const invitation = inviter.invitations.find((inv) => inv.token === token);

    if (!invitation || invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This invitation has already been used.",
      });
    }

    if (invitation.inviteeEmail !== email) {
      return res.status(400).json({
        success: false,
        message: "Email does not match the invitation.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Generate S3 bucket path for the client within inviter's bucket
    const clientFolderName = `client-${name}-${new mongoose.Types.ObjectId()}`;
    const inviterBucket = inviter.s3Bucket;
    const clientFolderPath = `clients/${clientFolderName}`;

    console.log("Client Folder Path:", clientFolderPath);

    // Upload an empty file to create the folder in S3
    await uploadEmptyObject(inviterBucket, clientFolderPath);

    // Create a new user for the invitee
    const newUser = await Client.create({
      name: formattedName,
      displayName: name,
      email,
      password: hashedPassword, // Hash the password before saving in real use
      userType: "client",
      inviterId: inviter._id,
      folder: clientFolderPath,
      userS3Bucket: inviter.s3Bucket,
      is_email_verified: true,
    });

    // Update the invitation as accepted
    invitation.status = "accepted";
    invitation.clientId = newUser._id;

    // Add the invitee to the inviter's clients list
    inviter.clients.push({
      inviterId: inviter._id,
      name: name,
      email: email,
      folder: clientFolderPath,
      userS3Bucket: inviter.s3Bucket,
    });

    await inviter.save();
    await newUser.save();

    res.status(200).json({
      success: true,
      message: "Invitation accepted successfully!",
    });
  } catch (error) {
    console.log("Error accepting invitation:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getClientsAndInvitations(req, res) {
  try {
    const { userId } = req.query; // Extract from query instead of body
    // console.log("USERid", userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch user or organization
    const acc =
      (await User.findById(userId).select("invitations clients").lean()) ||
      (await Org.findById(userId).select("invitations clients").lean());

    if (!acc) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({
      invitations: acc.invitations || [],
      clients: acc.clients || [],
    });
  } catch (error) {
    console.error("Error fetching invitations and clients:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getUserDocs(req, res) {
  try {
    const userId = req.user; // Extract inviterId from request
    // console.log("userid from getUserDocs", userId);
    const inviterId = userId.inviterId;

    if (!inviterId) {
      return res.status(400).json({ error: "Inviter ID is required" });
    }

    // Find the user who invited the client
    const user = await User.findById(inviterId);
    const org = await Org.findById(inviterId);

    if (!user && !org) {
      return res.status(404).json({ error: "Inviter not found" });
    }

    const acc = user || org;

    // Filter documents with forClient = true
    const clientDocs = acc.docs.filter((doc) => doc.forClient === "true");

    return res.status(200).json({
      success: true,
      documents: clientDocs,
    });
  } catch (error) {
    console.error("Error fetching user documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getClientDocs(req, res) {
  try {
    const userId = req.user._id;
    // console.log(userId);
    // Fetch clients where inviterId matches the current user
    const clients = await Client.find({ inviterId: userId.toString() });

    if (!clients.length) {
      return res.status(404).json({ message: "No clients found" });
    }

    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching client documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
