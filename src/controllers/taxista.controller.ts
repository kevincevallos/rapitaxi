import crypto from "crypto";
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
                    telefono: true,
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


        /*
          COMPATIBILIDAD TEMPORAL

          La APK que ya está instalada actualmente
          todavía puede iniciar sesión enviando solo
          el código.

          Cuando llegue deviceId se activa el nuevo
          sistema de sesión única.
        */

        const deviceId =
            String(
                req.body.deviceId || ""
            )
                .trim();


        if (!deviceId) {

            return res.json({
                success: true,
                taxista,
                sessionToken: null,
                sessionMode: "legacy",
            });

        }


        if (
            deviceId.length < 10 ||
            deviceId.length > 200
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Identificador de dispositivo inválido.",
            });
        }


        const sessionToken =
            crypto
                .randomBytes(32)
                .toString("hex");


        const dispositivo =
            await prisma.$transaction(
                async (tx) => {

                    /*
                      Si este mismo teléfono estaba
                      vinculado a otro taxista, se libera.
                    */

                    await tx.dispositivoTaxista.deleteMany({
                        where: {
                            deviceId,
                            taxistaId: {
                                not:
                                    taxista.id,
                            },
                        },
                    });


                    /*
                      taxistaId es UNIQUE.

                      Si el taxista inicia sesión
                      desde otro celular, actualizamos
                      este mismo registro.

                      El sessionToken anterior deja
                      de ser válido inmediatamente.
                    */

                    return await tx.dispositivoTaxista.upsert({
                        where: {
                            taxistaId:
                                taxista.id,
                        },

                        create: {
                            taxistaId:
                                taxista.id,

                            deviceId,

                            sessionToken,

                            expoPushToken:
                                null,

                            activo:
                                true,
                        },

                        update: {
                            deviceId,

                            sessionToken,

                            expoPushToken:
                                null,

                            activo:
                                true,
                        },

                        select: {
                            id: true,
                            deviceId: true,
                            sessionToken: true,
                            enLinea: true,
                        },
                    });

                }
            );


        return res.json({
            success: true,

            taxista,

            sessionToken:
                dispositivo.sessionToken,

            sessionMode:
                "device",

            enLinea:
                dispositivo.enLinea,
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
export async function registrarPushTokenTaxistaController(
    req: Request,
    res: Response
) {
    try {

        const authorization =
            String(
                req.headers.authorization || ""
            );


        const sessionToken =
            authorization
                .replace(
                    /^Bearer\s+/i,
                    ""
                )
                .trim();


        if (!sessionToken) {
            return res.status(401).json({
                success: false,
                message:
                    "Sesión no válida.",
                code:
                    "SESION_INVALIDA",
            });
        }


        const expoPushToken =
            String(
                req.body.expoPushToken || ""
            )
                .trim();


        if (
            !expoPushToken ||
            !/^Expo(nent)?PushToken\[.+\]$/.test(
                expoPushToken
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Push token inválido.",
            });
        }


        const dispositivo =
            await prisma.dispositivoTaxista.findUnique({
                where: {
                    sessionToken,
                },

                include: {
                    taxista: {
                        select: {
                            id: true,
                            activo: true,
                        },
                    },
                },
            });


        if (
            !dispositivo ||
            !dispositivo.activo ||
            !dispositivo.taxista.activo
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "La sesión ya no es válida.",
                code:
                    "SESION_INVALIDA",
            });
        }


        /*
          Un ExpoPushToken pertenece solo a
          un dispositivo activo.
        */

        await prisma.dispositivoTaxista.updateMany({
            where: {
                expoPushToken,
                id: {
                    not:
                        dispositivo.id,
                },
            },

            data: {
                expoPushToken:
                    null,
            },
        });


        const actualizado =
            await prisma.dispositivoTaxista.update({
                where: {
                    id:
                        dispositivo.id,
                },

                data: {
                    expoPushToken,
                },

                select: {
                    id: true,
                    expoPushToken: true,
                },
            });


        return res.json({
            success: true,

            dispositivo: {
                id:
                    actualizado.id,

                pushRegistrado:
                    Boolean(
                        actualizado.expoPushToken
                    ),
            },
        });


    } catch (error) {

        console.error(
            "Error registrando push token:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "No se pudo registrar el dispositivo para notificaciones.",
        });
    }
}


export async function validarSesionTaxistaController(
    req: Request,
    res: Response
) {
    try {

        const authorization =
            String(
                req.headers.authorization || ""
            );


        const sessionToken =
            authorization
                .replace(
                    /^Bearer\s+/i,
                    ""
                )
                .trim();


        if (!sessionToken) {
            return res.status(401).json({
                success: false,
                message:
                    "La sesión no es válida.",
                code:
                    "SESION_INVALIDA",
            });
        }


        const dispositivo =
            await prisma.dispositivoTaxista.findUnique({
                where: {
                    sessionToken,
                },

                include: {
                    taxista: {
                        select: {
                            id: true,
                            nombre: true,
                            activo: true,
                        },
                    },
                },
            });


        if (
            !dispositivo ||
            !dispositivo.activo ||
            !dispositivo.taxista.activo
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Tu sesión fue cerrada porque este taxista inició sesión en otro dispositivo.",
                code:
                    "SESION_REEMPLAZADA",
            });
        }


        return res.json({
            success: true,

            session: {
                activa: true,

                taxistaId:
                    dispositivo.taxista.id,

                enLinea:
                    dispositivo.enLinea,
            },
        });


    } catch (error) {

        console.error(
            "Error validando sesión:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "No se pudo validar la sesión.",
        });
    }
}

export async function cambiarEstadoEnLineaTaxistaController(
    req: Request,
    res: Response
) {
    try {

        const authorization =
            String(
                req.headers.authorization || ""
            );


        const sessionToken =
            authorization
                .replace(
                    /^Bearer\s+/i,
                    ""
                )
                .trim();


        if (!sessionToken) {

            return res.status(401).json({
                success: false,

                message:
                    "La sesión no es válida.",

                code:
                    "SESION_INVALIDA",
            });
        }


        if (
            typeof req.body.enLinea !==
            "boolean"
        ) {

            return res.status(400).json({
                success: false,

                message:
                    "El estado enLinea debe ser verdadero o falso.",
            });
        }


        const dispositivo =
            await prisma.dispositivoTaxista.findUnique({
                where: {
                    sessionToken,
                },

                include: {
                    taxista: {
                        select: {
                            id: true,
                            activo: true,
                        },
                    },
                },
            });


        if (
            !dispositivo ||
            !dispositivo.activo ||
            !dispositivo.taxista.activo
        ) {

            return res.status(401).json({
                success: false,

                message:
                    "La sesión ya no es válida.",

                code:
                    "SESION_INVALIDA",
            });
        }


        const nuevoEstado =
            req.body.enLinea;


        /*
          No permitimos desconectarse
          mientras tenga una carrera activa.
        */

        if (
            nuevoEstado === false
        ) {

            const carreraActiva =
                await prisma.carrera.findFirst({
                    where: {
                        taxistaId:
                            dispositivo.taxista.id,

                        fechaFin:
                            null,

                        estado: {
                            in: [
                                "ASIGNADA",
                                "EN_CAMINO",
                                "CERCA",
                                "LLEGO",
                            ],
                        },
                    },

                    select: {
                        id: true,
                        numero: true,
                    },
                });


            if (
                carreraActiva
            ) {

                return res.status(409).json({
                    success: false,

                    message:
                        `Finaliza primero la carrera #${carreraActiva.numero}.`,
                });
            }
        }


        const actualizado =
            await prisma.dispositivoTaxista.update({
                where: {
                    id:
                        dispositivo.id,
                },

                data: {
                    enLinea:
                        nuevoEstado,
                },

                select: {
                    id: true,
                    enLinea: true,
                },
            });


        return res.json({
            success: true,

            enLinea:
                actualizado.enLinea,
        });


    } catch (error) {

        console.error(
            "Error cambiando estado en línea:",
            error
        );


        return res.status(500).json({
            success: false,

            message:
                "No se pudo cambiar el estado del taxista.",
        });
    }
}