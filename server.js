import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import dashboard from "./routes/dashboard.route.js";
import upload from "./routes/upload.route.js";
import { ENV_VARS } from "./config/envVar.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";

const app = express();

const PORT = ENV_VARS.PORT;

const corsOptions = {
  origin: "https://cove-genai.netlify.app",
  credentials: true, // Allow cookies to be sent with requests
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

app.use(cors(corsOptions));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboard);
app.use("/api/v1/upload", upload);

app.get("/", (req, res) => {
  res.send("Server is ready on 5000");
});

app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`);
  connectDB();
});

// datacoveai
// o5oz9HuaFQYn23qB

// export const generateTokenAndSetCookie = (userId, res) => {
//   const token = jwt.sign({ userId }, ENV_VARS.JWT_SECRET, { expiresIn: "15d" });

//   res.cookie("datacove-ai", token, {
//     maxAge: 15 * 24 * 60 * 60 * 1000, //15 days in MS
//     httpOnly: true, // Prevent XSS attacks, make it not accessible by JS
//     sameSite: "None", // Allow the cookie to be sent in cross-origin requests
//     secure: true,
//   });
//   return token;
// };

// app.post("/api/upload", upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;
//     console.log("FILE", file);
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     req.file.buffer;
//     const params = {
//       Bucket: bucketName,
//       Key: req.file.originalname,
//       Body: req.file.buffer,
//       ContentType: req.file.mimetype,
//     };
//     const command = new PutObjectCommand(params);

//     await s3.send(command);
//     const fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${file.originalname}`;
//     console.log("URL", fileUrl);

//     res
//       .status(200)
//       .json({ sucess: true, message: "File uploaded successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Upload failed" });
//   }
// });
