import {
    Router,
} from "express";

import {
    aceptarCarreraController,
    crearCarreraController,
    listarCarrerasAdminController,
    listarCarrerasDisponiblesAppController,
    obtenerCarreraActivaTaxistaController,
    actualizarUbicacionTaxistaController,
    finalizarCarreraTaxistaController,
    obtenerCarreraController,
    cancelarCarreraAdminController,
    obtenerSeguimientoPublicoController
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


router.get(
    "/app/activa/:codigoTaxista",
    obtenerCarreraActivaTaxistaController
);


router.post(
    "/app/:id/ubicacion",
    actualizarUbicacionTaxistaController
);


router.post(
    "/app/:id/finalizar",
    finalizarCarreraTaxistaController
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
  SEGUIMIENTO CLIENTE
  ========================================
*/

router.get(
    "/seguimiento/:trackingToken",
    obtenerSeguimientoPublicoController
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