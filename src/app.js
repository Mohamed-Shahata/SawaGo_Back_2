import express from "express";
import cors from "cors";

import uploadRoutes from "./routes/upload.routes.js";
import popularityRoutes from "./routes/popularity.routes.js";
import webhooksRoutes from "./routes/Webhooks.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

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

export default app;