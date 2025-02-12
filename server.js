import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import { ENV_VARS } from "./config/envVar.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
const app = express();

const PORT = ENV_VARS.PORT;

const corsOptions = {
  origin: "http://localhost:5173", // Allow only your local frontend to access the backend
  credentials: true, // Allow cookies to be sent with requests
};
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Server is ready on 5000");
});

app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`);
  connectDB();
});

// datacoveai
// o5oz9HuaFQYn23qB
