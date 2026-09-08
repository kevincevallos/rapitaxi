import {
  Router,
} from "express";

import {
  aceptarCarreraController,
  crearCarreraController,
  listarCarrerasAdminController,
  listarCarrerasDisponiblesAppController,
  obtenerCarreraController,
  cancelarCarreraAdminController,
} from "../controllers/carrera.controller";


const router =
  Router();


router.post(
  "/",
  crearCarreraController
);


/*
  ========================================
  APP TAXISTAS
  ========================================
*/

router.get(
  "/app/disponibles",
  listarCarrerasDisponiblesAppController
);


/*
  ========================================
  ADMIN
  ========================================
*/

router.get(
  "/admin/listado",
  listarCarrerasAdminController
);


router.post(
  "/admin/:id/cancelar",
  cancelarCarreraAdminController
);


/*
  ========================================
  CARRERA PUBLICA
  ========================================
*/

router.get(
  "/:token",
  obtenerCarreraController
);


router.post(
  "/:token/aceptar",
  aceptarCarreraController
);


export default router;