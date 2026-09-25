import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import carreraRoutes from "./routes/carrera.routes";
import taxistaRoutes from "./routes/taxista.routes";
import whatsappRoutes from "./routes/whatsapp.routes";
import webPushRoutes from "./routes/web-push.routes";
import adminChatRoutes from "./routes/admin-chat.routes";
import adminAuthRoutes from "./routes/admin-auth.routes";

import {
  requiereAdmin,
  requiereAdminPagina,
} from "./middlewares/admin-auth.middleware";

import {
  vencerUbicacionesPendientes,
} from "./services/conversacion.service";

const app = express();

app.set(
  "trust proxy",
  1
);


/*
  ========================================
  MIDDLEWARES
  ========================================
*/

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(cors());

app.use(express.json());

app.use(morgan("dev"));


/*
  ========================================
  RUTAS API
  ========================================
*/

app.use(
  "/api/admin/auth",
  adminAuthRoutes
);

/*
  Protegemos todas las rutas de administración
  de carreras sin afectar app, seguimiento ni
  endpoints públicos.
*/
app.use(
  "/api/carreras/admin",
  requiereAdmin
);

app.use(
  "/api/carreras",
  carreraRoutes
);

/*
  /api/taxistas contiene endpoints de la APK y
  endpoints administrativos. Dejamos pasar /app
  y exigimos sesión para todo lo demás.
*/
app.use(
  "/api/taxistas",
  (req, res, next) => {
    if (
      req.path === "/app" ||
      req.path.startsWith("/app/")
    ) {
      return next();
    }

    return requiereAdmin(
      req,
      res,
      next
    );
  }
);

app.use(
  "/api/taxistas",
  taxistaRoutes
);

app.use(
  "/api/web-push",
  webPushRoutes
);

app.use(
  "/webhooks",
  whatsappRoutes
);

app.use(
  "/api/admin/chats",
  requiereAdmin,
  adminChatRoutes
);


/*
  ========================================
  ARCHIVOS PÚBLICOS
  ========================================
*/

const publicPath =
  path.join(
    process.cwd(),
    "public"
  );


app.get(
  "/admin.html",
  requiereAdminPagina,
  (_req, res) => {
    res.sendFile(
      path.join(
        publicPath,
        "admin.html"
      )
    );
  }
);


app.use(
  express.static(
    publicPath
  )
);


/*
  ========================================
  PÁGINA DE CARRERA
  ========================================
*/

app.get(
  "/c/:token",
  (_req, res) => {

    res.sendFile(
      path.join(
        publicPath,
        "carrera.html"
      )
    );
  }
);


/*
  ========================================
  SEGUIMIENTO CORTO DEL CLIENTE
  ========================================

  Ejemplo:

  /s/K7p4Xd82Qa9Lm3Rt

  El token real es leído después
  por seguimiento.js desde la URL.

  Seguimiento antiguo también seguirá
  funcionando mediante:

  /seguimiento.html?token=...
  ========================================
*/

app.get(
  "/s/:token",
  (_req, res) => {

    res.sendFile(
      path.join(
        publicPath,
        "seguimiento.html"
      )
    );
  }
);


/*
  ========================================
  RUTAS BÁSICAS
  ========================================
*/

app.get(
  "/",
  (_req, res) => {

    res.json({
      ok: true,
      app: "RapiTaxi",
    });
  }
);


app.get(
  "/health",
  (_req, res) => {

    res.json({
      ok: true,
      status: "healthy",
    });
  }
);

/*
  ========================================
  SERVIDOR
  ========================================
*/

const PORT =
  Number(
    process.env.PORT
  ) || 3000;

let procesandoUbicacionesVencidas =
  false;


async function revisarUbicacionesVencidas() {

  if (
    procesandoUbicacionesVencidas
  ) {
    return;
  }


  procesandoUbicacionesVencidas =
    true;


  try {

    await vencerUbicacionesPendientes();

  } catch (error) {

    console.error(
      "Error revisando ubicaciones vencidas:",
      error
    );

  } finally {

    procesandoUbicacionesVencidas =
      false;
  }
}


setTimeout(
  revisarUbicacionesVencidas,
  10000
);


setInterval(
  revisarUbicacionesVencidas,
  30000
);

app.listen(
  PORT,
  () => {
    console.log(
      `🚖 Rapitaxi ejecutándose en puerto ${PORT}`
    );
  }
);