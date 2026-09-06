import {
  Request,
  Response,
} from "express";

import {
  procesarMensajeWhatsApp,
} from "../services/conversacion.service";


async function procesarPayload(
  payload: any
) {
  /*
    Kapso puede entregar el mensaje
    directamente o dentro de message.
  */

  const message =
    payload.message ||
    payload;


  const telefono =
    message.from ||
    payload.from ||
    payload.conversation
      ?.phone_number;


  if (!telefono) {
    console.log(
      "Webhook sin teléfono:",
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    return;
  }


  const tipo =
    message.type ||
    "";


  const texto =
    message.text?.body ||
    message.text ||
    undefined;


  /*
    Respuesta de botón interactivo.
  */

  const botonId =
    message.interactive
      ?.button_reply
      ?.id ||
    message.button
      ?.payload ||
    undefined;


  const location =
    message.location ||
    undefined;


  const nombre =
    payload.conversation
      ?.contact_name ||
    payload.kapso
      ?.contact_name ||
    message.profile
      ?.name ||
    undefined;


  await procesarMensajeWhatsApp({
    telefono:
      String(telefono),

    nombre:
      nombre
        ? String(nombre)
        : undefined,

    tipo:
      String(tipo),

    texto:
      texto
        ? String(texto)
        : undefined,

    botonId:
      botonId
        ? String(botonId)
        : undefined,

    latitud:
      location?.latitude !==
        undefined
        ? Number(
            location.latitude
          )
        : undefined,

    longitud:
      location?.longitude !==
        undefined
        ? Number(
            location.longitude
          )
        : undefined,

    nombreUbicacion:
      location?.name
        ? String(
            location.name
          )
        : undefined,

    direccionUbicacion:
      location?.address
        ? String(
            location.address
          )
        : undefined,
  });
}


export async function kapsoWebhookController(
  req: Request,
  res: Response
) {
  /*
    Respondemos inmediatamente
    para evitar reintentos.
  */

  res.status(200).send(
    "OK"
  );


  try {
    console.log(
      "Webhook Kapso recibido:"
    );


    console.log(
      JSON.stringify(
        req.body,
        null,
        2
      )
    );


    /*
      Algunos webhooks pueden
      venir en batch.
    */

    if (
      Array.isArray(
        req.body?.data
      )
    ) {
      for (
        const payload
        of req.body.data
      ) {
        await procesarPayload(
          payload
        );
      }

      return;
    }


    await procesarPayload(
      req.body
    );

  } catch (error) {

    console.error(
      "Error webhook Kapso:",
      error
    );
  }
}