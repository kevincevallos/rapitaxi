import {
  Request,
  Response,
} from "express";

import {
  crearCarrera,
  cancelarCarreraAdmin,
  obtenerCarreraPublica,
  aceptarCarrera,
  listarCarrerasAdmin,
  obtenerCarreraActivaTaxista,
  actualizarUbicacionTaxista,
  finalizarCarreraTaxista,
  obtenerSeguimientoPublico,
} from "../services/carrera.service";

import {
  prisma,
} from "../config/prisma";


export async function crearCarreraController(
  req: Request,
  res: Response
) {
  try {
    const {
      nombreCliente,
      whatsappCliente,
      latitud,
      longitud,
      referencia,
      formaPago,
    } = req.body;


    if (
      !nombreCliente ||
      !whatsappCliente ||
      latitud === undefined ||
      longitud === undefined ||
      !referencia ||
      !formaPago
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Faltan datos para crear la carrera.",
      });
    }


    const carrera =
      await crearCarrera({
        nombreCliente:
          String(nombreCliente),

        whatsappCliente:
          String(whatsappCliente),

        latitud:
          Number(latitud),

        longitud:
          Number(longitud),

        referencia:
          String(referencia),

        formaPago:
          String(formaPago),
      });


    return res.status(201).json({
      success: true,
      carrera,
    });

  } catch (error) {

    console.error(
      "Error creando carrera:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudo crear la carrera.",
    });
  }
}


/*
  ========================================
  APP TAXISTAS - DISPONIBLES
  ========================================
*/

export async function listarCarrerasDisponiblesAppController(
  _req: Request,
  res: Response
) {
  try {

    const carreras =
      await prisma.carrera.findMany({
        where: {
          estado: "BUSCANDO",
        },

        orderBy: {
          fechaCreacion: "desc",
        },

        select: {
          id: true,
          numero: true,
          token: true,
          referencia: true,
          formaPago: true,
          fechaCreacion: true,
        },
      });


    return res.json({
      success: true,
      carreras,
    });

  } catch (error) {

    console.error(
      "Error cargando carreras disponibles para app:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudieron cargar las carreras disponibles.",
    });
  }
}


/*
  ========================================
  APP TAXISTAS - CARRERA ACTIVA
  ========================================
*/

export async function obtenerCarreraActivaTaxistaController(
  req: Request,
  res: Response
) {
  try {

    const codigoTaxista =
      String(
        req.params.codigoTaxista || ""
      );


    const carrera =
      await obtenerCarreraActivaTaxista(
        codigoTaxista
      );


    return res.json({
      success: true,
      carrera,
    });

  } catch (error: any) {

    console.error(
      "Error obteniendo carrera activa:",
      error
    );


    if (
      error?.message ===
      "CODIGO_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El código de conductor no es válido.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El taxista no existe.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_INACTIVO"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Este taxista se encuentra inactivo.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "No se pudo consultar la carrera activa.",
    });
  }
}


/*
  ========================================
  APP TAXISTAS - GPS
  ========================================
*/

export async function actualizarUbicacionTaxistaController(
  req: Request,
  res: Response
) {
  try {

    const carreraId =
      Number(
        req.params.id
      );


    const codigoTaxista =
      String(
        req.body.codigoTaxista || ""
      );


    const latitud =
      Number(
        req.body.latitud
      );


    const longitud =
      Number(
        req.body.longitud
      );


    if (
      !Number.isInteger(carreraId) ||
      carreraId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "ID de carrera inválido.",
      });
    }


    if (!codigoTaxista) {
      return res.status(400).json({
        success: false,
        message:
          "Falta identificar al taxista.",
      });
    }


    if (
      req.body.latitud === undefined ||
      req.body.longitud === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Falta la ubicación del taxista.",
      });
    }


    const carrera =
      await actualizarUbicacionTaxista(
        carreraId,
        codigoTaxista,
        latitud,
        longitud
      );


    return res.json({
      success: true,
      message:
        "Ubicación actualizada.",
      carrera,
    });

  } catch (error: any) {

    console.error(
      "Error actualizando ubicación del taxista:",
      error
    );


    if (
      error?.message ===
      "CODIGO_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El código de conductor no es válido.",
      });
    }


    if (
      error?.message ===
      "UBICACION_INVALIDA"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La ubicación recibida no es válida.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El taxista no existe.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_INACTIVO"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Este taxista se encuentra inactivo.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_PERTENECE_TAXISTA"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Esta carrera no pertenece a este taxista.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_ACTIVA"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "La carrera ya no está activa.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "No se pudo actualizar la ubicación.",
    });
  }
}


/*
  ========================================
  APP TAXISTAS - FINALIZAR
  ========================================
*/

export async function finalizarCarreraTaxistaController(
  req: Request,
  res: Response
) {
  try {

    const carreraId =
      Number(
        req.params.id
      );


    const codigoTaxista =
      String(
        req.body.codigoTaxista || ""
      );


    if (
      !Number.isInteger(carreraId) ||
      carreraId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "ID de carrera inválido.",
      });
    }


    if (!codigoTaxista) {
      return res.status(400).json({
        success: false,
        message:
          "Falta identificar al taxista.",
      });
    }


    const carrera =
      await finalizarCarreraTaxista(
        carreraId,
        codigoTaxista
      );


    return res.json({
      success: true,
      message:
        "Carrera finalizada correctamente.",
      carrera,
    });

  } catch (error: any) {

    console.error(
      "Error finalizando carrera desde app:",
      error
    );


    if (
      error?.message ===
      "CODIGO_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El código de conductor no es válido.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El taxista no existe.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_INACTIVO"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Este taxista se encuentra inactivo.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_PERTENECE_TAXISTA"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Esta carrera no pertenece a este taxista.",
      });
    }


    if (
      error?.message ===
      "CARRERA_YA_CERRADA"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "La carrera ya está finalizada o cancelada.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "No se pudo finalizar la carrera.",
    });
  }
}


/*
  ========================================
  CARRERA PÚBLICA
  ========================================
*/

export async function obtenerCarreraController(
  req: Request,
  res: Response
) {
  try {

    const token =
      String(
        req.params.token || ""
      );


    const carrera =
      await obtenerCarreraPublica(
        token
      );


    if (!carrera) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    return res.json({
      success: true,
      carrera,
    });

  } catch (error) {

    console.error(
      "Error obteniendo carrera:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudo cargar la carrera.",
    });
  }
}


export async function aceptarCarreraController(
  req: Request,
  res: Response
) {
  try {

    const token =
      String(
        req.params.token || ""
      );


    const codigoTaxista =
      String(
        req.body.codigoTaxista || ""
      );


    if (!codigoTaxista) {
      return res.status(400).json({
        success: false,
        message:
          "Debes ingresar tu código de conductor.",
      });
    }


    const respuesta =
      await aceptarCarrera(
        token,
        codigoTaxista
      );


    return res.json({
      success: true,

      message:
        "Carrera asignada correctamente.",

      carrera:
        respuesta.carrera,

      taxista:
        respuesta.taxista,
    });

  } catch (error: any) {

    console.error(
      "Error aceptando carrera:",
      error
    );


    if (
      error?.message ===
      "CODIGO_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El código de conductor no es válido.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El código no corresponde a un taxista registrado.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_INACTIVO"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Este taxista se encuentra inactivo.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_OCUPADO"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Ya tienes una carrera activa. Finalízala antes de aceptar otra.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    if (
      error?.message ===
      "YA_ASIGNADA"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Esta carrera ya fue asignada a otro taxista.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "No se pudo aceptar la carrera.",
    });
  }
}


/*
  ========================================
  ADMIN
  ========================================
*/

export async function listarCarrerasAdminController(
  _req: Request,
  res: Response
) {
  try {

    const carreras =
      await listarCarrerasAdmin();


    return res.json({
      success: true,
      carreras,
    });

  } catch (error) {

    console.error(
      "Error listando carreras:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudieron cargar las carreras.",
    });
  }
}


export async function cancelarCarreraAdminController(
  req: Request,
  res: Response
) {

  const carreraId =
    Number(
      req.params.id
    );


  if (
    !Number.isInteger(carreraId) ||
    carreraId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "ID de carrera inválido.",
    });
  }


  try {

    const resultado =
      await cancelarCarreraAdmin(
        carreraId
      );


    return res.json({
      success: true,
      message:
        "Carrera cancelada correctamente.",
      carrera:
        resultado,
    });


  } catch (error: any) {

    if (
      error.message ===
      "CARRERA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    if (
      error.message ===
      "CARRERA_YA_CERRADA"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "La carrera ya está completada o cancelada.",
      });
    }


    console.error(
      "Error cancelando carrera desde admin:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudo cancelar la carrera.",
    });
  }
}
/*
  ========================================
  SEGUIMIENTO PUBLICO
  ========================================
*/

export async function obtenerSeguimientoPublicoController(
  req: Request,
  res: Response
) {
  try {

    const trackingToken =
      String(
        req.params.trackingToken || ""
      );


    const seguimiento =
      await obtenerSeguimientoPublico(
        trackingToken
      );


    return res.json({
      success: true,
      seguimiento,
    });

  } catch (error: any) {

    if (
      error?.message ===
      "TRACKING_TOKEN_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enlace de seguimiento inválido.",
      });
    }


    if (
      error?.message ===
      "SEGUIMIENTO_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El seguimiento no existe.",
      });
    }


    console.error(
      "Error obteniendo seguimiento:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudo cargar el seguimiento.",
    });
  }
}