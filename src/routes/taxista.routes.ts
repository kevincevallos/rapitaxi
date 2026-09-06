import { Router } from "express";

import {
  actualizarTaxistaController,
  crearTaxistaController,
  listarTaxistasController,
} from "../controllers/taxista.controller";

const router = Router();

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