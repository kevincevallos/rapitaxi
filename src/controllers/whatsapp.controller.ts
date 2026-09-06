import {
  Request,
  Response,
} from "express";

import {
  procesarMensajeWhatsApp,
} from "../services/conversacion.service";


export async function kapsoWebhookController(
  req: Request,
  res: Response
) {
  try {

    /*
      Respondemos inmediatamente
      para que Kapso no considere
      el webhook fallido.
    */

    res.status(200).send("OK");


    const body =
      req.body;


    console.log(
      "Webhook Kapso:",
      JSON.stringify(
        body,
        null,
        2
      )
    );


    const event =
      body.event;


    if (
      event !==
      "whatsapp.message.received"
    ) {
      return;
    }


    const data =
      body.data || {};


    const telefono =
      data.from ||
      data.message?.from;


    if (!telefono) {
      return;
    }


    const tipo =
      data.type ||
      data.message?.type;


    const texto =
      data.text?.body ||
      data.message?.text?.body;


    const location =
      data.location ||
      data.message?.location;


    const nombre =
      data.kapso?.contact_name ||
      data.contact_name ||
      data.profile?.name;


    await procesarMensajeWhatsApp({
      telefono:
        String(telefono),

      nombre:
        nombre
          ? String(nombre)
          : undefined,

      tipo:
        String(tipo || ""),

      texto:
        texto
          ? String(texto)
          : undefined,

      latitud:
        location?.latitude !== undefined
          ? Number(location.latitude)
          : undefined,

      longitud:
        location?.longitude !== undefined
          ? Number(location.longitude)
          : undefined,

      nombreUbicacion:
        location?.name,

      direccionUbicacion:
        location?.address,
    });


  } catch (error) {

    console.error(
      "Error procesando webhook:",
      error
    );
  }
}