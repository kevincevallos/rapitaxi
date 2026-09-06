import { Router } from "express";

import {
  aceptarCarreraController,
  crearCarreraController,
  listarCarrerasAdminController,
  obtenerCarreraController,
} from "../controllers/carrera.controller";

const router = Router();

router.post("/", crearCarreraController);

router.get(
  "/admin/listado",
  listarCarrerasAdminController
);

router.get("/:token", obtenerCarreraController);

router.post("/:token/aceptar", aceptarCarreraController);

export default router;