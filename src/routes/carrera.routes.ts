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
    obtenerSeguimientoPublicoController,
    marcarLlegadaTaxistaController,
    obtenerDashboardAdminController,
    obtenerRutaGoogleTaxistaController,
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

router.get(
    "/app/:id/ruta",
    obtenerRutaGoogleTaxistaController
);

router.post(
    "/app/:id/ubicacion",
    actualizarUbicacionTaxistaController
);

router.post(
    "/app/:id/llegue",
    marcarLlegadaTaxistaController
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


router.get(
    "/admin/dashboard",
    obtenerDashboardAdminController
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