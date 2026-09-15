import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import loginRouter from "./routes/login.js";
import candidateAuthRouter from "./routes/candidate-auth.js";
import assessmentRouter from "./routes/assessment.js";
import taskRouter from "./routes/task.js";
import offerLetterRouter from "./routes/offerLetter.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const app = express();

const allowedOrigins = [
  "https://candidates.infogenx.com",
  "https://infogenx-candidates-onboarding.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:5000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for onboarding client
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.get(["/", "/api", "/api/"], (req, res) => {
  res.json({
    success: true,
    message: "Infogenx Candidate Portal API Running Successfully",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", loginRouter);
app.use("/api/candidate-auth", candidateAuthRouter);
app.use("/api/assessment", assessmentRouter);
app.use("/api/task", taskRouter);
app.use("/api/offer-letter", offerLetterRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});