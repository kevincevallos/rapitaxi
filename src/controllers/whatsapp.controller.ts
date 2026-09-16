import {
  Request,
  Response,
} from "express";

import {
  procesarMensajeWhatsApp,
} from "../services/conversacion.service";

import {
  estaEnAtencionManual,
  registrarMensajeWhatsApp,
} from "../services/chat.service";


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


  /*
    Guardamos el mensaje entrante para
    mostrarlo en Admin > Chats.

    Si por cualquier motivo falla este
    registro, NO detenemos el bot.
  */

  let contenidoChat =
    texto
      ? String(texto)
      : undefined;

  if (
    !contenidoChat &&
    botonId
  ) {
    contenidoChat =
      String(
        message.interactive
          ?.button_reply
          ?.title ||
        botonId
      );
  }

  if (
    !contenidoChat &&
    location
  ) {
    const detalle =
      location.name ||
      location.address ||
      `${location.latitude}, ${location.longitude}`;

    contenidoChat =
      `📍 Ubicación compartida: ${detalle}`;
  }

  if (!contenidoChat) {
    contenidoChat =
      `[${String(
        tipo ||
        "mensaje"
      )}]`;
  }

  try {
    await registrarMensajeWhatsApp({
      telefono:
        String(telefono),

      direccion:
        "ENTRANTE",

      tipo:
        String(
          tipo ||
          "text"
        ),

      contenido:
        contenidoChat,

      messageId:
        message.id
          ? String(
              message.id
            )
          : undefined,

      leido:
        false,
    });

  } catch (error) {
    console.error(
      "Error guardando mensaje entrante:",
      error
    );
  }


  /*
    Si el operador activó ATENCIÓN MANUAL,
    guardamos el mensaje pero NO dejamos
    que el bot responda automáticamente.
  */

  try {
    const manual =
      await estaEnAtencionManual(
        String(telefono)
      );

    if (manual) {
      return;
    }

  } catch (error) {
    /*
      Ante un error de lectura del modo
      manual, mantenemos el comportamiento
      actual del bot para no bloquear
      solicitudes de taxi.
    */

    console.error(
      "Error verificando atención manual:",
      error
    );
  }


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