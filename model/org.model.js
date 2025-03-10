import mongoose, { mongo } from "mongoose";

const orgSchema = mongoose.Schema(
  {
    userType: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    s3Bucket: {
      type: String,
      default: null, // Stores the S3 bucket name
    },
    is_email_verified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    notes: [
      {
        title: String,
        content: String,
        date: { type: Date, default: Date.now },
      },
    ],
    docs: [],
    sharedDocs: [
      {
        docId: { type: String, ref: "Document" },
        clientId: { type: String, ref: "Client" },
        docName: { type: String, required: true },
        docUrl: { type: String, required: true },
        sharedAt: { type: Date, default: Date.now },
      },
    ],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    invitations: [
      {
        inviteeEmail: { type: String, required: true },

        token: { type: String, required: true },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        clientId: {
          type: String,
          unique: true,
        },
        invitedAt: { type: Date, default: Date.now },
      },
    ],
    clients: [
      {
        inviterId: { type: String, required: true }, // Who invited them
        name: { type: String, required: true },
        email: { type: String, required: true },
        userS3Bucket: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Org = mongoose.model("Org", orgSchema);
