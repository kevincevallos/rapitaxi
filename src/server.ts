import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import carreraRoutes from "./routes/carrera.routes";
import taxistaRoutes from "./routes/taxista.routes";
import whatsappRoutes from "./routes/whatsapp.routes";

import {
  finalizarCarrerasVencidas,
} from "./services/carrera.service";


const app = express();


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
  "/api/carreras",
  carreraRoutes
);

app.use(
  "/api/taxistas",
  taxistaRoutes
);

app.use(
  "/webhooks",
  whatsappRoutes
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
  FINALIZACIÓN AUTOMÁTICA DE CARRERAS
  ========================================

  Cada 15 segundos revisamos si existen
  carreras aceptadas hace 30 minutos o más.

  IMPORTANTE:

  No usamos setTimeout individual por
  carrera.

  Así, si Railway reinicia el servidor,
  al volver a levantar seguirá revisando
  la base de datos y completará cualquier
  carrera pendiente.
  ========================================
*/

let procesandoFinalizaciones =
  false;


async function revisarCarrerasVencidas() {

  /*
    Evita que una ejecución nueva comience
    mientras la anterior todavía sigue
    trabajando.
  */

  if (
    procesandoFinalizaciones
  ) {
    return;
  }


  procesandoFinalizaciones =
    true;


  try {

    const cantidad =
      await finalizarCarrerasVencidas();


    if (
      cantidad > 0
    ) {
      console.log(
        `✅ ${cantidad} carrera(s) finalizada(s) automáticamente.`
      );
    }

  } catch (error) {

    console.error(
      "Error revisando carreras vencidas:",
      error
    );

  } finally {

    procesandoFinalizaciones =
      false;
  }
}


/*
  Ejecutamos una revisión apenas
  levanta el servidor.

  Esto sirve especialmente después
  de un reinicio o redeploy.
*/

setTimeout(
  () => {
    revisarCarrerasVencidas();
  },
  5000
);


/*
  Después revisamos cada 15 segundos.
*/

setInterval(
  () => {
    revisarCarrerasVencidas();
  },
  15000
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


app.listen(
  PORT,
  () => {

    console.log(
      `🚖 RapiTaxi ejecutándose en puerto ${PORT}`
    );

    console.log(
      "⏱️ Finalización automática de carreras activa: 30 minutos."
    );
  }
);