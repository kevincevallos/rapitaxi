import {
    registrarMensajeWhatsApp,
} from "./chat.service";


const KAPSO_API_URL =
    "https://api.kapso.ai/meta/whatsapp/v24.0";


function obtenerConfiguracionKapso() {
    const apiKey =
        process.env.KAPSO_API_KEY;

    const phoneNumberId =
        process.env.KAPSO_PHONE_NUMBER_ID;


    if (!apiKey) {
        throw new Error(
            "KAPSO_API_KEY no configurada"
        );
    }


    if (!phoneNumberId) {
        throw new Error(
            "KAPSO_PHONE_NUMBER_ID no configurado"
        );
    }


    return {
        apiKey,
        phoneNumberId,
    };
}


async function enviarMensajeKapso(
    body: any
) {
    const {
        apiKey,
        phoneNumberId,
    } = obtenerConfiguracionKapso();


    const response =
        await fetch(
            `${KAPSO_API_URL}/${phoneNumberId}/messages`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "X-API-Key":
                        apiKey,
                },

                body:
                    JSON.stringify(body),
            }
        );


    const data =
        await response.json();


    if (!response.ok) {
        console.error(
            "Error Kapso:",
            data
        );

        throw new Error(
            "No se pudo enviar mensaje por WhatsApp"
        );
    }


    return data;
}


function obtenerMessageIdKapso(
    data: any
) {
    const id =
        data?.messages?.[0]?.id ||
        data?.message?.id ||
        data?.id ||
        null;

    return id
        ? String(id)
        : null;
}


async function guardarSalidaChat(
    telefono: string,
    tipo: string,
    contenido: string,
    data: any
) {
    try {
        await registrarMensajeWhatsApp({
            telefono,
            direccion:
                "SALIENTE",
            tipo,
            contenido,
            messageId:
                obtenerMessageIdKapso(
                    data
                ),
            leido: true,
        });

    } catch (error) {
        /*
          El mensaje YA salió por Kapso.
          Si falla el historial, no hacemos
          fallar el flujo de WhatsApp.
        */

        console.error(
            "Error guardando mensaje saliente:",
            error
        );
    }
}


export async function enviarTextoWhatsApp(
    telefono: string,
    mensaje: string
) {
    const data =
        await enviarMensajeKapso({
            messaging_product:
                "whatsapp",

            recipient_type:
                "individual",

            to:
                telefono.replace(
                    /\D/g,
                    ""
                ),

            type:
                "text",

            text: {
                body: mensaje,
            },
        });


    await guardarSalidaChat(
        telefono,
        "text",
        mensaje,
        data
    );


    return data;
}


export async function enviarStickerWhatsApp(
    telefono: string
) {
    const data =
        await enviarMensajeKapso({
            messaging_product:
                "whatsapp",

            recipient_type:
                "individual",

            to:
                telefono.replace(
                    /\D/g,
                    ""
                ),

            type:
                "sticker",

            sticker: {
                link:
                    "https://rapitaxi-production.up.railway.app/stickers/rapi_perrito.webp",
            },
        });


    await guardarSalidaChat(
        telefono,
        "sticker",
        "🐶 Sticker enviado",
        data
    );


    return data;
}


export async function solicitarUbicacionWhatsApp(
    telefono: string,
    mensaje:
        string =
        "📍 Envíame tu ubicación actual para solicitar tu taxi."
) {
    const data =
        await enviarMensajeKapso({
            messaging_product:
                "whatsapp",

            recipient_type:
                "individual",

            to:
                telefono.replace(
                    /\D/g,
                    ""
                ),

            type:
                "interactive",

            interactive: {
                type:
                    "location_request_message",

                body: {
                    text: mensaje,
                },

                action: {
                    name:
                        "send_location",
                },
            },
        });


    await guardarSalidaChat(
        telefono,
        "location_request",
        mensaje,
        data
    );


    return data;
}


interface BotonWhatsApp {
    id: string;
    titulo: string;
}


export async function enviarBotonesWhatsApp(
    telefono: string,
    mensaje: string,
    botones: BotonWhatsApp[]
) {
    if (
        botones.length < 1 ||
        botones.length > 3
    ) {
        throw new Error(
            "WhatsApp permite entre 1 y 3 botones"
        );
    }


    const data =
        await enviarMensajeKapso({
            messaging_product:
                "whatsapp",

            recipient_type:
                "individual",

            to:
                telefono.replace(
                    /\D/g,
                    ""
                ),

            type:
                "interactive",

            interactive: {
                type: "button",

                body: {
                    text: mensaje,
                },

                action: {
                    buttons:
                        botones.map(
                            (boton) => ({
                                type: "reply",

                                reply: {
                                    id:
                                        boton.id,

                                    title:
                                        boton.titulo,
                                },
                            })
                        ),
                },
            },
        });


    await guardarSalidaChat(
        telefono,
        "button",
        mensaje,
        data
    );


    return data;
}
