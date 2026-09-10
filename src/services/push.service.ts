import { prisma } from "../config/prisma";

type MensajePush = {
    to: string;
    title: string;
    body: string;
    sound: "default";
    priority: "high";
    channelId: string;
    data: {
        tipo: string;
        numero: number;
        token: string;
    };
};


export async function enviarPushNuevaCarrera(
    numero: number,
    tokenCarrera: string,
    referencia: string,
    formaPago: string
) {

    try {

        const dispositivos =
            await prisma.dispositivoTaxista.findMany({
                where: {
                    activo: true,

                    expoPushToken: {
                        not: null,
                    },

                    taxista: {
                        activo: true,
                    },
                },

                select: {
                    expoPushToken: true,
                },
            });


        const tokens =
            dispositivos
                .map(
                    (item) =>
                        item.expoPushToken
                )
                .filter(
                    (token): token is string =>
                        Boolean(token)
                );


        if (
            tokens.length === 0
        ) {

            console.log(
                `Carrera #${numero}: no hay dispositivos push registrados.`
            );

            return;

        }


        const referenciaCorta =
            String(
                referencia || ""
            )
                .trim()
                .slice(
                    0,
                    90
                );


        const mensajes: MensajePush[] =
            tokens.map(
                (expoPushToken) => ({
                    to:
                        expoPushToken,

                    title:
                        `🚕 Nueva carrera #${numero}`,

                    body:
                        `${referenciaCorta} · ${formaPago}`,

                    sound:
                        "default",

                    priority:
                        "high",

                    channelId:
                        "carreras",

                    data: {
                        tipo:
                            "NUEVA_CARRERA",

                        numero,

                        token:
                            tokenCarrera,
                    },
                })
            );


        /*
          Expo admite lotes de hasta 100 mensajes.
        */

        for (
            let i = 0;
            i < mensajes.length;
            i += 100
        ) {

            const lote =
                mensajes.slice(
                    i,
                    i + 100
                );


            const response =
                await fetch(
                    "https://exp.host/--/api/v2/push/send",
                    {
                        method:
                            "POST",

                        headers: {
                            Accept:
                                "application/json",

                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                lote
                            ),
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok
            ) {

                console.error(
                    "Expo Push respondió con error:",
                    data
                );

                continue;

            }


            console.log(
                `Push enviado para carrera #${numero}:`,
                data
            );

        }

    } catch (error) {

        console.error(
            `Error enviando push de carrera #${numero}:`,
            error
        );

        /*
          IMPORTANTE:
          nunca lanzamos error aquí.

          Si Expo Push falla, la carrera igualmente
          debe crearse y el polling de la APK seguirá
          encontrándola.
        */

    }

}