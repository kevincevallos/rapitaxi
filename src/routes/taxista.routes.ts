import { Router } from "express";

import {
  actualizarTaxistaController,
  crearTaxistaController,
  listarTaxistasController,
  loginTaxistaAppController,
  registrarPushTokenTaxistaController,
  validarSesionTaxistaController,
  cambiarEstadoEnLineaTaxistaController,
} from "../controllers/taxista.controller";

const router = Router();

/*
  APP TAXISTA
*/

router.post(
  "/app/login",
  loginTaxistaAppController
);

router.post(
  "/app/push-token",
  registrarPushTokenTaxistaController
);

router.get(
  "/app/session",
  validarSesionTaxistaController
);

router.patch(
  "/app/en-linea",
  cambiarEstadoEnLineaTaxistaController
);
/*
  ADMIN
*/

router.get(
  "/",
  listarTaxistasController
);

router.post(
  "/",
  crearTaxistaController
);

router.patch(
  "/:id",
  actualizarTaxistaController
);

export default router;