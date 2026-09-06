import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import carreraRoutes from "./routes/carrera.routes";
import path from "path";
import taxistaRoutes from "./routes/taxista.routes";
import whatsappRoutes from "./routes/whatsapp.routes";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/carreras", carreraRoutes);
app.use(express.static(path.resolve(process.cwd(), "public")));
app.get("/c/:token", (_req, res) => {
  res.sendFile(
    path.resolve(
      process.cwd(),
      "public",
      "carrera.html"
    )
  );
});
app.use("/api/carreras", carreraRoutes);
app.use("/api/taxistas", taxistaRoutes);
app.use(
  "/webhooks",
  whatsappRoutes
);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Rapi Taxi API funcionando 🚕",
    version: "1.0.0"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "online",
    service: "rapi-taxi-backend"
  });
});

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log("       🚕 RAPI TAXI API");
  console.log("=================================");
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`Estado:   ONLINE`);
  console.log("=================================");
  console.log("");
});