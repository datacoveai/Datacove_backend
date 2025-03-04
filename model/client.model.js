import mongoose from "mongoose";

const clientSchema = mongoose.Schema(
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
    password: {
      type: String,
      required: true,
    },
    inviterId: {
      type: String,
      required: true,
    },
    folder: {
      type: String,
      required: true,
    },
    userS3Bucket: {
      type: String,
      required: true,
    },
    notes: [
      {
        title: String,
        content: String,
        date: { type: Date, default: Date.now },
      },
    ],
    docs: [],
  },
  {
    timestamps: true,
  }
);

export const Client = mongoose.model("Client", clientSchema);
