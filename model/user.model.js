import mongoose, { mongo } from "mongoose";

const userSchema = mongoose.Schema(
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
    notes: [
      {
        title: String,
        content: String,
        date: { type: Date, default: Date.now },
      },
    ],
    docs: [],
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
        folder: { type: String, required: true },
        userS3Bucket: { type: String, required: true },
      },
    ],

    // folders: [
    //   {
    //     name: { type: String, required: true },
    //     displayName: { type: String, required: true },
    //     // accessType: { type: String, enum: ["private", "public"], default: "private" }
    //   },
    // ],
  },

  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
