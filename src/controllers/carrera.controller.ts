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
} from "../services/carrera.service";


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


    /*
      Si aceptarCarrera llegó hasta aquí,
      significa que el taxista ganó
      correctamente la carrera.
    */

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
  req: any,
  res: any
) {

  const carreraId =
    Number(req.params.id);


  if (
    !Number.isInteger(carreraId) ||
    carreraId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "ID de carrera inválido."
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
      carrera: resultado
    });


  } catch (error: any) {

    if (
      error.message ===
      "CARRERA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe."
      });
    }


    if (
      error.message ===
      "CARRERA_YA_CERRADA"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "La carrera ya está completada o cancelada."
      });
    }


    console.error(
      "Error cancelando carrera desde admin:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudo cancelar la carrera."
    });

  }
}