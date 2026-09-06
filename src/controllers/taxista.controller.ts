import { Request, Response } from "express";

import {
  actualizarTaxista,
  crearTaxista,
  listarTaxistas,
} from "../services/taxista.service";


export async function crearTaxistaController(
  req: Request,
  res: Response
) {
  try {
    const {
      codigo,
      nombre,
      placa,
      vehiculo,
      telefono,
    } = req.body;

    if (
      codigo === undefined ||
      !nombre ||
      !placa ||
      !vehiculo
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Código, nombre, placa y vehículo son obligatorios",
      });
    }


    const taxista =
      await crearTaxista({
        codigo: String(codigo),
        nombre: String(nombre),
        placa: String(placa),
        vehiculo: String(vehiculo),
        telefono:
          telefono
            ? String(telefono)
            : undefined,
      });


    return res.status(201).json({
      success: true,
      message:
        "Taxista registrado correctamente",
      taxista,
    });

  } catch (error) {

    console.error(
      "Error registrando taxista:",
      error
    );

    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo registrar el taxista";

    return res.status(400).json({
      success: false,
      message: mensaje,
    });
  }
}


export async function listarTaxistasController(
  _req: Request,
  res: Response
) {
  try {

    const taxistas =
      await listarTaxistas();

    return res.json({
      success: true,
      taxistas,
    });

  } catch (error) {

    console.error(
      "Error listando taxistas:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "No se pudieron cargar los taxistas",
    });
  }
}
export async function actualizarTaxistaController(
  req: Request,
  res: Response
) {
  try {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "ID de taxista inválido",
      });
    }

    const taxista =
      await actualizarTaxista(
        id,
        {
          nombre:
            req.body.nombre !== undefined
              ? String(req.body.nombre)
              : undefined,

          placa:
            req.body.placa !== undefined
              ? String(req.body.placa)
              : undefined,

          vehiculo:
            req.body.vehiculo !== undefined
              ? String(req.body.vehiculo)
              : undefined,

          telefono:
            req.body.telefono !== undefined
              ? String(req.body.telefono)
              : undefined,

          activo:
            req.body.activo !== undefined
              ? Boolean(req.body.activo)
              : undefined,
        }
      );

    return res.json({
      success: true,
      message:
        "Taxista actualizado correctamente",
      taxista,
    });

  } catch (error) {
    console.error(
      "Error actualizando taxista:",
      error
    );

    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar el taxista";

    return res.status(400).json({
      success: false,
      message: mensaje,
    });
  }
}