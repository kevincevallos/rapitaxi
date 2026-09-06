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


export async function enviarTextoWhatsApp(
  telefono: string,
  mensaje: string
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
          JSON.stringify({
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
          }),
      }
    );


  const data =
    await response.json();


  if (!response.ok) {
    console.error(
      "Kapso error:",
      data
    );

    throw new Error(
      "No se pudo enviar el mensaje de WhatsApp"
    );
  }


  return data;
}


export async function solicitarUbicacionWhatsApp(
  telefono: string
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
          JSON.stringify({
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
                text:
                  "📍 Comparte tu ubicación actual para solicitar tu taxi."
              },

              action: {
                name:
                  "send_location"
              }
            }
          }),
      }
    );


  const data =
    await response.json();


  if (!response.ok) {
    console.error(
      "Kapso location error:",
      data
    );

    throw new Error(
      "No se pudo solicitar la ubicación"
    );
  }


  return data;
}