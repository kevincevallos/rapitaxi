import { Router } from "express";

import {
  actualizarTaxistaController,
  crearTaxistaController,
  listarTaxistasController,
  loginTaxistaAppController,
} from "../controllers/taxista.controller";

const router = Router();

/*
  LOGIN APP TAXISTA
*/
router.post(
  "/app/login",
  loginTaxistaAppController
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
