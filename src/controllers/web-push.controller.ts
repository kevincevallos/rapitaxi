import {
    Request,
    Response,
} from "express";

import { prisma } from "../config/prisma";

import {
    obtenerVapidPublicKey,
} from "../services/web-push.service";


function obtenerBearer(
    req: Request
) {

    return String(
        req.headers.authorization ||
        ""
    )
        .replace(
            /^Bearer\s+/i,
            ""
        )
        .trim();

}


async function obtenerSesion(
    sessionToken: string
) {

    if (!sessionToken) {
        return null;
    }


    return prisma
        .dispositivoTaxista
        .findUnique({
            where: {
                sessionToken,
            },

            include: {
                taxista: true,
            },
        });

}


export async function vapidPublicKeyController(
    _req: Request,
    res: Response
) {

    const publicKey =
        obtenerVapidPublicKey();


    if (!publicKey) {

        return res
            .status(503)
            .json({
                success:
                    false,

                message:
                    "Web Push no está configurado.",
            });

    }


    return res.json({
        success:
            true,

        publicKey,
    });

}


export async function registrarWebPushController(
    req: Request,
    res: Response
) {

    try {

        const sessionToken =
            obtenerBearer(
                req
            );


        const dispositivo =
            await obtenerSesion(
                sessionToken
            );


        if (
            !dispositivo ||
            !dispositivo.activo ||
            !dispositivo.taxista.activo
        ) {

            return res
                .status(401)
                .json({
                    success:
                        false,

                    message:
                        "La sesión ya no es válida.",

                    code:
                        "SESION_INVALIDA",
                });

        }


        const subscription =
            req.body?.subscription;


        const endpoint =
            String(
                subscription?.endpoint ||
                ""
            ).trim();

        const p256dh =
            String(
                subscription
                    ?.keys
                    ?.p256dh ||
                ""
            ).trim();

        const auth =
            String(
                subscription
                    ?.keys
                    ?.auth ||
                ""
            ).trim();


        if (
            !endpoint ||
            !p256dh ||
            !auth
        ) {

            return res
                .status(400)
                .json({
                    success:
                        false,

                    message:
                        "Suscripción Web Push inválida.",
                });

        }


        /*
          Si ese endpoint ya estaba
          vinculado a otro taxista,
          lo eliminamos primero.
        */

        await prisma
            .suscripcionWebPush
            .deleteMany({
                where: {
                    endpoint,

                    taxistaId: {
                        not:
                            dispositivo.taxistaId,
                    },
                },
            });


        const suscripcion =
            await prisma
                .suscripcionWebPush
                .upsert({
                    where: {
                        endpoint,
                    },

                    create: {
                        endpoint,
                        p256dh,
                        auth,

                        activo:
                            true,

                        taxistaId:
                            dispositivo.taxistaId,
                    },

                    update: {
                        p256dh,
                        auth,

                        activo:
                            true,

                        taxistaId:
                            dispositivo.taxistaId,
                    },
                });


        return res.json({
            success:
                true,

            subscriptionId:
                suscripcion.id,
        });

    } catch (error) {

        console.error(
            "Error registrando Web Push:",
            error
        );


        return res
            .status(500)
            .json({
                success:
                    false,

                message:
                    "No se pudo registrar Web Push.",
            });

    }

}