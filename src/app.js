import express from "express";
import cors from "cors";

import uploadRoutes from "./routes/upload.routes.js";
import popularityRoutes from "./routes/popularity.routes.js";
import webhooksRoutes from "./routes/Webhooks.routes.js";
import emailRoutes from "./routes/send_email.routes.js";

const app = express();

// ====================================================
// مهم جداً على Railway/Heroku/أي reverse proxy:
// بيخلي req.protocol يرجع https بدل http
// ====================================================
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

// Serve static files
app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SAWAGO Backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/uploads", uploadRoutes);
app.use("/api/popularity", popularityRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/email", emailRoutes);

export default app;
