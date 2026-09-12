import webpush from "web-push";

import { prisma } from "../config/prisma";


const publicKey =
    String(
        process.env.VAPID_PUBLIC_KEY || ""
    ).trim();

const privateKey =
    String(
        process.env.VAPID_PRIVATE_KEY || ""
    ).trim();

const subject =
    String(
        process.env.VAPID_SUBJECT ||
        "mailto:admin@rapitaxi.ec"
    ).trim();


if (
    publicKey &&
    privateKey
) {

    webpush.setVapidDetails(
        subject,
        publicKey,
        privateKey
    );

}


export function obtenerVapidPublicKey() {

    return publicKey;

}


export async function enviarWebPushNuevaCarrera(
    numero: number,
    tokenCarrera: string,
    referencia: string,
    formaPago: string
) {

    if (
        !publicKey ||
        !privateKey
    ) {

        console.log(
            "Web Push no configurado: faltan claves VAPID."
        );

        return;

    }


    try {

        const suscripciones =
            await prisma.suscripcionWebPush.findMany({
                where: {
                    activo: true,

                    taxista: {
                        activo: true,

                        dispositivos: {
                            some: {
                                activo: true,
                                enLinea: true,

                                deviceId: {
                                    startsWith:
                                        "web-",
                                },
                            },
                        },
                    },
                },
            });


        if (
            suscripciones.length === 0
        ) {

            console.log(
                `Carrera #${numero}: no hay suscripciones Web Push activas.`
            );

            return;

        }


        const payload =
            JSON.stringify({
                title:
                    `🚕 Nueva carrera #${numero}`,

                body:
                    `${String(
                        referencia || ""
                    )
                        .trim()
                        .slice(
                            0,
                            90
                        )} · ${formaPago}`,

                data: {
                    tipo:
                        "NUEVA_CARRERA",

                    numero,

                    token:
                        tokenCarrera,

                    url:
                        "/taxista/",
                },
            });


        for (
            const suscripcion
            of suscripciones
        ) {

            try {

                await webpush.sendNotification(
                    {
                        endpoint:
                            suscripcion.endpoint,

                        keys: {
                            p256dh:
                                suscripcion.p256dh,

                            auth:
                                suscripcion.auth,
                        },
                    },

                    payload
                );

            } catch (
            error: any
            ) {

                const statusCode =
                    Number(
                        error?.statusCode ||
                        0
                    );


                console.error(
                    "Error Web Push:",
                    statusCode,
                    error?.body ||
                    error?.message
                );


                /*
                  Suscripción expirada/eliminada
                  por el navegador.
                */

                if (
                    statusCode === 404 ||
                    statusCode === 410
                ) {

                    await prisma
                        .suscripcionWebPush
                        .update({
                            where: {
                                id:
                                    suscripcion.id,
                            },

                            data: {
                                activo:
                                    false,
                            },
                        })
                        .catch(
                            () => { }
                        );

                }

            }

        }

    } catch (error) {

        console.error(
            `Error enviando Web Push carrera #${numero}:`,
            error
        );

        /*
          No lanzamos error:
          la creación de la carrera
          nunca debe fallar por Push.
        */

    }

}