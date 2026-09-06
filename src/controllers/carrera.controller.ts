import { Request, Response } from "express";
import {
  aceptarCarrera,
  crearCarrera,
  listarCarrerasAdmin,
  obtenerCarreraPublica,
} from "../services/carrera.service";

export async function crearCarreraController(req: Request, res: Response) {
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
      typeof latitud !== "number" ||
      typeof longitud !== "number" ||
      !referencia ||
      !formaPago
    ) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios para crear la carrera",
      });
    }

    const carrera = await crearCarrera({
      nombreCliente,
      whatsappCliente,
      latitud,
      longitud,
      referencia,
      formaPago,
    });

    return res.status(201).json({
      success: true,
      message: "Carrera creada correctamente",

      carrera: {
        numero: carrera.numero,
        token: carrera.token,
        referencia: carrera.referencia,
        formaPago: carrera.formaPago,
        estado: carrera.estado,
        fechaCreacion: carrera.fechaCreacion,
      },

    enlacePublico: `${req.protocol}://${req.get("host")}/c/${carrera.token}`,    });

  } catch (error) {
    console.error("Error creando carrera:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al crear la carrera",
    });
  }
}

export async function obtenerCarreraController(
  req: Request,
  res: Response
) {
  try {
    const token = String(req.params.token);
    const carrera = await obtenerCarreraPublica(token);

    if (!carrera) {
      return res.status(404).json({
        success: false,
        message: "Carrera no encontrada",
      });
    }

    return res.json({
      success: true,
      carrera,
    });
  } catch (error) {
    console.error("Error obteniendo carrera:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
}

export async function aceptarCarreraController(
  req: Request,
  res: Response
) {
  try {
    const token =
      String(req.params.token);

    const codigoTaxista =
      String(
        req.body.codigoTaxista || ""
      );


    if (!codigoTaxista) {
      return res.status(400).json({
        success: false,
        estado: "CODIGO_REQUERIDO",
        message:
          "Debes ingresar tu código de conductor",
      });
    }


    const respuesta =
      await aceptarCarrera(
        token,
        codigoTaxista
      );


    if (
      respuesta.resultado ===
      "CODIGO_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        estado: "CODIGO_INVALIDO",
        message:
          "El código debe ser de 3 dígitos",
      });
    }


    if (
      respuesta.resultado ===
      "TAXISTA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        estado: "TAXISTA_NO_EXISTE",
        message:
          "Código de conductor no registrado",
      });
    }


    if (
      respuesta.resultado ===
      "TAXISTA_INACTIVO"
    ) {
      return res.status(403).json({
        success: false,
        estado: "TAXISTA_INACTIVO",
        message:
          "Este conductor no está habilitado",
      });
    }


    if (
      respuesta.resultado ===
      "NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        estado: "NO_EXISTE",
        message:
          "Carrera no encontrada",
      });
    }


    if (
      respuesta.resultado ===
      "YA_ASIGNADA"
    ) {
      return res.status(409).json({
        success: false,
        estado: "YA_ASIGNADA",
        message:
          "Esta carrera ya fue asignada",
      });
    }


    return res.json({
      success: true,
      estado: "ASIGNADA",
      message:
        "Carrera asignada correctamente",
      carrera: respuesta.carrera,
    });

  } catch (error) {

    console.error(
      "Error aceptando carrera:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error interno del servidor",
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
        "No se pudieron cargar las carreras",
    });
  }
}