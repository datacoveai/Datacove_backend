import express from "express";
import s3, { getPresignedUrl } from "../s3.js";
import { ENV_VARS } from "../config/envVar.js";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Org } from "../model/org.model.js";
import { User } from "../model/user.model.js";
import shortenUrl from "../utils/shortenUrl.js";
import formatDate from "../utils/formatDate.js";
import { Client } from "../model/client.model.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export async function uploadFile(req, res) {
  const { userId, forClient } = req.body;
  // console.log("USER", userId);
  // const bucketName = ENV_VARS.BUCKET_NAME;
  const bucketRegion = ENV_VARS.BUCKET_REGION;

  try {
    // console.log("FILES", req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Find user or organization
    const user = await User.findById(userId);
    const org = await Org.findById(userId);

    if (!user && !org) {
      return res
        .status(404)
        .json({ message: "User or organization not found" });
    }

    const acc = user || org; // console.log("ACC", acc.s3Bucket);
    const userBucketName = acc.s3Bucket;

    // Handle the uploaded files
    const fileUrls = [];
    for (const file of req.files) {
      const fileName = `private/${Date.now()}-${file.originalname}`;
      const params = {
        Bucket: userBucketName,
        Key: fileName,
        Body: file.buffer,
      };

      const command = new PutObjectCommand(params);

      await s3.send(command);

      // const fileUrl = `https://${userBucketName}.s3.${userBucketRegion}.amazonaws.com/${fileName}`;
      const fileUrl = `https://${userBucketName}.s3.amazonaws.com/${fileName}`;

      console.log("LINK", fileUrl);
      fileUrls.push(fileUrl);
    }

    if (!acc.docs) {
      acc.docs = [];
    }

    // Add uploaded files to the docs array
    req.files.forEach((file, index) => {
      const docNumber = acc.docs.length + 1;
      const docName = `doc${docNumber}`;

      acc.docs.push({
        date: formatDate(new Date()),
        SrNo: docName,
        Name: file.originalname,
        fileUrl: fileUrls[index], // Map the file URL for each file
        forClient: forClient || false,
      });
    });

    await acc.save();

    res.status(200).json({
      success: true,
      message: "Docs uploaded successfully",
      user: {
        ...acc._doc, // Spread the user document to include all user fields
        password: "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
}

export async function uploadClientFile(req, res) {
  try {
    const { userId } = req.body;
    // console.log("client id", userId);
    // const clientFound = req.user;
    // console.log("Client using middleware:", clientFound);

    const client = await Client.findById(userId);

    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const clientFolder = client.folder; // Client's folder inside inviter’s bucket
    const bucketName = client.userS3Bucket; // Inviter’s bucket
    const uploadedFiles = [];

    // Upload each file to S3 inside client's folder
    for (const file of req.files) {
      const fileName = `${clientFolder}/${Date.now()}-${file.originalname}`;
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      const fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
      uploadedFiles.push(fileUrl);
    }

    // Save uploaded files in the client's database
    if (!client.docs) {
      client.docs = [];
    }

    req.files.forEach((file, index) => {
      client.docs.push({
        date: formatDate(new Date()),
        SrNo: `doc${client.docs.length + 1}`,
        Name: file.originalname,
        fileUrl: uploadedFiles[index],
      });
    });

    await client.save();

    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      uploadedFiles,
    });
  } catch (error) {
    console.error("Client Upload Error:", error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
}
