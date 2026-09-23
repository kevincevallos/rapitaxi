import { prisma } from "../config/prisma";


type MensajePush = {
    to: string;
    title: string;
    body: string;
    sound: string;
    priority: "high";
    data: {
        tipo: string;
        numero: number;
        token: string;
        distanciaKm?: number | null;
        etaMinutos?: number | null;
    };
};


function calcularDistanciaKm(
    latitudOrigen: number,
    longitudOrigen: number,
    latitudDestino: number,
    longitudDestino: number
) {
    const radioTierraKm = 6371;

    const aRadianes =
        (grados: number) =>
            grados * Math.PI / 180;

    const diferenciaLatitud =
        aRadianes(
            latitudDestino - latitudOrigen
        );

    const diferenciaLongitud =
        aRadianes(
            longitudDestino - longitudOrigen
        );

    const latitudOrigenRad =
        aRadianes(latitudOrigen);

    const latitudDestinoRad =
        aRadianes(latitudDestino);

    const haversine =
        Math.sin(diferenciaLatitud / 2) ** 2 +
        Math.cos(latitudOrigenRad) *
        Math.cos(latitudDestinoRad) *
        Math.sin(diferenciaLongitud / 2) ** 2;

    const angulo =
        2 *
        Math.atan2(
            Math.sqrt(haversine),
            Math.sqrt(1 - haversine)
        );

    return radioTierraKm * angulo;
}


function calcularEtaMinutos(
    distanciaKm: number
) {
    const velocidadKmHora =
        25;

    const minutos =
        distanciaKm /
        velocidadKmHora *
        60;

    return Math.max(
        1,
        Math.ceil(minutos)
    );
}


function formatearDistancia(
    distanciaKm: number
) {
    if (distanciaKm < 1) {
        return `${Math.max(
            1,
            Math.round(
                distanciaKm * 1000
            )
        )} m de ti`;
    }

    return `${distanciaKm.toFixed(1)} km de ti`;
}


export async function enviarPushNuevaCarrera(
    numero: number,
    tokenCarrera: string,
    referencia: string,
    formaPago: string,
    nombreCliente: string,
    latitudCliente: number,
    longitudCliente: number
) {

    try {

        const dispositivos =
            await prisma.dispositivoTaxista.findMany({
                where: {
                    activo: true,
                    enLinea: true,

                    expoPushToken: {
                        not: null,
                    },

                    taxista: {
                        activo: true,
                    },
                },

                select: {
                    expoPushToken: true,

                    taxista: {
                        select: {
                            ultimaLatitud: true,
                            ultimaLongitud: true,
                            fechaUltimaUbicacion: true,
                        },
                    },
                },
            });


        if (
            dispositivos.length === 0
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
                    70
                );

        const nombreCorto =
            String(
                nombreCliente ||
                "Cliente"
            )
                .trim()
                .slice(
                    0,
                    40
                );


        const mensajes: MensajePush[] =
            dispositivos
                .filter(
                    item =>
                        Boolean(
                            item.expoPushToken
                        )
                )
                .map(
                    item => {
                        const latitudTaxista =
                            item.taxista
                                .ultimaLatitud;

                        const longitudTaxista =
                            item.taxista
                                .ultimaLongitud;

                        const fechaGps =
                            item.taxista
                                .fechaUltimaUbicacion;

                        const gpsUtil =
                            Boolean(
                                fechaGps &&
                                Date.now() -
                                new Date(
                                    fechaGps
                                ).getTime() <=
                                5 * 60 * 1000
                            );

                        let distanciaKm:
                            number | null =
                            null;

                        let etaMinutos:
                            number | null =
                            null;

                        if (
                            typeof latitudTaxista ===
                            "number" &&
                            typeof longitudTaxista ===
                            "number" &&
                            gpsUtil &&
                            Number.isFinite(
                                latitudCliente
                            ) &&
                            Number.isFinite(
                                longitudCliente
                            )
                        ) {
                            distanciaKm =
                                calcularDistanciaKm(
                                    latitudTaxista,
                                    longitudTaxista,
                                    latitudCliente,
                                    longitudCliente
                                );

                            etaMinutos =
                                calcularEtaMinutos(
                                    distanciaKm
                                );
                        }

                        const distanciaTexto =
                            distanciaKm !== null &&
                            etaMinutos !== null
                                ? `A ${formatearDistancia(
                                    distanciaKm
                                )} • aprox. ${etaMinutos} min`
                                : "Distancia disponible al abrir Rapitaxi";

                        return {
                            to:
                                item.expoPushToken!,

                            title:
                                `🚕 Nueva solicitud #${numero}`,

                            body:
                                `${nombreCorto} · ${distanciaTexto}\n` +
                                `${referenciaCorta} · ${formaPago}`,

                            sound:
                                "un_rapi.wav",

                            priority:
                                "high",

                            data: {
                                tipo:
                                    "NUEVA_CARRERA",

                                numero,

                                token:
                                    tokenCarrera,

                                distanciaKm:
                                    distanciaKm !== null
                                        ? Math.round(
                                            distanciaKm *
                                            100
                                        ) / 100
                                        : null,

                                etaMinutos,
                            },
                        };
                    }
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
                `Push personalizado enviado para carrera #${numero}:`,
                data
            );
        }

    } catch (error) {

        console.error(
            `Error enviando push de carrera #${numero}:`,
            error
        );

        /*
          Si Expo Push falla, la carrera igualmente
          debe crearse y el polling de la APK seguirá
          encontrándola.
        */
    }
}
