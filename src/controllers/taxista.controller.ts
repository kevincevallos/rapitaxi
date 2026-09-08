import {
    Request,
    Response,
} from "express";

import { prisma } from "../config/prisma";

import {
    crearTaxista,
    listarTaxistas,
    actualizarTaxista,
} from "../services/taxista.service";


export async function crearTaxistaController(
    req: Request,
    res: Response
) {
    try {
        const taxista =
            await crearTaxista({
                codigo:
                    String(
                        req.body.codigo || ""
                    ),

                nombre:
                    String(
                        req.body.nombre || ""
                    ),

                placa:
                    String(
                        req.body.placa || ""
                    ),

                vehiculo:
                    String(
                        req.body.vehiculo || ""
                    ),

                telefono:
                    req.body.telefono !== undefined
                        ? String(
                            req.body.telefono
                        )
                        : undefined,

                colorVehiculo:
                    req.body.colorVehiculo !== undefined
                        ? String(
                            req.body.colorVehiculo
                        )
                        : undefined,

                cooperativa:
                    req.body.cooperativa !== undefined
                        ? String(
                            req.body.cooperativa
                        )
                        : undefined,

                titularPichincha:
                    req.body.titularPichincha !== undefined
                        ? String(
                            req.body.titularPichincha
                        )
                        : undefined,

                cuentaPichincha:
                    req.body.cuentaPichincha !== undefined
                        ? String(
                            req.body.cuentaPichincha
                        )
                        : undefined,

                titularGuayaquil:
                    req.body.titularGuayaquil !== undefined
                        ? String(
                            req.body.titularGuayaquil
                        )
                        : undefined,

                cuentaGuayaquil:
                    req.body.cuentaGuayaquil !== undefined
                        ? String(
                            req.body.cuentaGuayaquil
                        )
                        : undefined,
            });


        return res.status(201).json({
            success: true,
            taxista,
        });

    } catch (error: any) {

        console.error(
            "Error creando taxista:",
            error
        );


        if (
            error?.message ===
            "CODIGO_INVALIDO"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "El código debe ser un número entre 001 y 999.",
            });
        }


        if (
            error?.message ===
            "CODIGO_EXISTENTE"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Ese código ya está registrado.",
            });
        }


        if (
            error?.message ===
            "PLACA_EXISTENTE"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Esa placa ya está registrada.",
            });
        }


        return res.status(500).json({
            success: false,
            message:
                "No se pudo registrar el taxista.",
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
                "No se pudieron cargar los taxistas.",
        });
    }
}


export async function actualizarTaxistaController(
    req: Request,
    res: Response
) {
    try {
        const id =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "ID de taxista inválido.",
            });
        }


        const taxista =
            await actualizarTaxista(
                id,
                {
                    codigo:
                        req.body.codigo !== undefined
                            ? String(
                                req.body.codigo
                            )
                            : undefined,
                    nombre:
                        req.body.nombre !== undefined
                            ? String(
                                req.body.nombre
                            )
                            : undefined,

                    placa:
                        req.body.placa !== undefined
                            ? String(
                                req.body.placa
                            )
                            : undefined,

                    vehiculo:
                        req.body.vehiculo !== undefined
                            ? String(
                                req.body.vehiculo
                            )
                            : undefined,

                    telefono:
                        req.body.telefono !== undefined
                            ? String(
                                req.body.telefono
                            )
                            : undefined,

                    activo:
                        req.body.activo !== undefined
                            ? Boolean(
                                req.body.activo
                            )
                            : undefined,

                    colorVehiculo:
                        req.body.colorVehiculo !== undefined
                            ? String(
                                req.body.colorVehiculo
                            )
                            : undefined,

                    cooperativa:
                        req.body.cooperativa !== undefined
                            ? String(
                                req.body.cooperativa
                            )
                            : undefined,

                    titularPichincha:
                        req.body.titularPichincha !== undefined
                            ? String(
                                req.body.titularPichincha
                            )
                            : undefined,

                    cuentaPichincha:
                        req.body.cuentaPichincha !== undefined
                            ? String(
                                req.body.cuentaPichincha
                            )
                            : undefined,

                    titularGuayaquil:
                        req.body.titularGuayaquil !== undefined
                            ? String(
                                req.body.titularGuayaquil
                            )
                            : undefined,

                    cuentaGuayaquil:
                        req.body.cuentaGuayaquil !== undefined
                            ? String(
                                req.body.cuentaGuayaquil
                            )
                            : undefined,
                }
            );


        return res.json({
            success: true,
            taxista,
        });

    } catch (error: any) {

        console.error(
            "Error actualizando taxista:",
            error
        );


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
            "PLACA_EXISTENTE"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Esa placa ya está registrada por otro taxista.",
            });
        }

        if (
            error?.message ===
            "CODIGO_INVALIDO"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "El código debe ser un número entre 001 y 999.",
            });
        }

        if (
            error?.message ===
            "CODIGO_EXISTENTE"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Ese código ya está asignado a otro taxista.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "No se pudo actualizar el taxista.",
        });
    }
}


export async function loginTaxistaAppController(
    req: Request,
    res: Response
) {
    try {

        const codigoEntrada =
            String(
                req.body.codigo || ""
            )
            .replace(
                /\D/g,
                ""
            );


        if (
            codigoEntrada.length < 1 ||
            codigoEntrada.length > 3
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Código de taxista inválido.",
            });
        }


        const codigo =
            codigoEntrada.padStart(
                3,
                "0"
            );


        const taxista =
            await prisma.taxista.findUnique({
                where: {
                    codigo,
                },
                select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    placa: true,
                    vehiculo: true,
                    colorVehiculo: true,
                    cooperativa: true,
                    activo: true,
                },
            });


        if (!taxista) {
            return res.status(404).json({
                success: false,
                message:
                    "No existe un taxista con ese código.",
            });
        }


        if (!taxista.activo) {
            return res.status(403).json({
                success: false,
                message:
                    "Este taxista se encuentra desactivado.",
            });
        }


        return res.json({
            success: true,
            taxista,
        });

    } catch (error) {

        console.error(
            "Error iniciando sesión de taxista:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "No se pudo iniciar sesión.",
        });
    }
}
