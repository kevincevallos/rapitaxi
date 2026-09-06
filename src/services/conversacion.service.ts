import { prisma } from "../config/prisma";

import {
  enviarTextoWhatsApp,
  solicitarUbicacionWhatsApp,
} from "./whatsapp.service";

import {
  crearCarrera,
} from "./carrera.service";


interface MensajeEntrante {
  telefono: string;
  nombre?: string;
  tipo: string;
  texto?: string;
  latitud?: number;
  longitud?: number;
  nombreUbicacion?: string;
  direccionUbicacion?: string;
}


export async function procesarMensajeWhatsApp(
  mensaje: MensajeEntrante
) {
  const telefono =
    mensaje.telefono.replace(
      /\D/g,
      ""
    );


  let conversacion =
    await prisma.conversacionWhatsApp
      .findUnique({
        where: {
          telefono,
        },
      });


  if (!conversacion) {

    conversacion =
      await prisma.conversacionWhatsApp
        .create({
          data: {
            telefono,

            nombre:
              mensaje.nombre ||
              null,

            estado:
              "NUEVO",
          },
        });
  }


  if (
    conversacion.estado ===
    "NUEVO"
  ) {

    await prisma.conversacionWhatsApp
      .update({
        where: {
          telefono,
        },

        data: {
          estado:
            "ESPERANDO_UBICACION",

          nombre:
            mensaje.nombre ||
            conversacion.nombre,
        },
      });


    await enviarTextoWhatsApp(
      telefono,
      `¡Hola${
        mensaje.nombre
          ? `, ${mensaje.nombre}`
          : ""
      }! 👋 Bienvenido a RapiTaxi.`
    );


    await solicitarUbicacionWhatsApp(
      telefono
    );


    return;
  }


  if (
    conversacion.estado ===
    "ESPERANDO_UBICACION"
  ) {

    if (
      mensaje.tipo !== "location" ||
      mensaje.latitud === undefined ||
      mensaje.longitud === undefined
    ) {

      await solicitarUbicacionWhatsApp(
        telefono
      );

      return;
    }


    const referencia =
      mensaje.direccionUbicacion ||
      mensaje.nombreUbicacion ||
      "Ubicación compartida por WhatsApp";


    await prisma.conversacionWhatsApp
      .update({
        where: {
          telefono,
        },

        data: {
          latitud:
            mensaje.latitud,

          longitud:
            mensaje.longitud,

          referencia,

          estado:
            "ESPERANDO_PAGO",
        },
      });


    await enviarTextoWhatsApp(
      telefono,
      [
        "📍 Ubicación recibida.",
        "",
        "¿Cómo deseas pagar al finalizar la carrera?",
        "",
        "1️⃣ Efectivo",
        "2️⃣ Transferencia Banco Pichincha",
        "3️⃣ Transferencia Banco Guayaquil",
        "",
        "Responde solamente 1, 2 o 3."
      ].join("\n")
    );


    return;
  }


  if (
    conversacion.estado ===
    "ESPERANDO_PAGO"
  ) {

    const respuesta =
      (mensaje.texto || "")
        .trim()
        .toLowerCase();


    let formaPago:
      string | null =
      null;


    if (
      respuesta === "1" ||
      respuesta.includes(
        "efectivo"
      )
    ) {
      formaPago =
        "Efectivo";
    }


    if (
      respuesta === "2" ||
      respuesta.includes(
        "pichincha"
      )
    ) {
      formaPago =
        "Transferencia Banco Pichincha";
    }


    if (
      respuesta === "3" ||
      respuesta.includes(
        "guayaquil"
      )
    ) {
      formaPago =
        "Transferencia Banco Guayaquil";
    }


    if (!formaPago) {

      await enviarTextoWhatsApp(
        telefono,
        [
          "Selecciona una opción válida:",
          "",
          "1️⃣ Efectivo",
          "2️⃣ Transferencia Banco Pichincha",
          "3️⃣ Transferencia Banco Guayaquil"
        ].join("\n")
      );

      return;
    }


    if (
      conversacion.latitud === null ||
      conversacion.longitud === null
    ) {

      await prisma.conversacionWhatsApp
        .update({
          where: {
            telefono,
          },

          data: {
            estado:
              "ESPERANDO_UBICACION",
          },
        });


      await solicitarUbicacionWhatsApp(
        telefono
      );

      return;
    }


    const carrera =
      await crearCarrera({
        nombreCliente:
          conversacion.nombre ||
          mensaje.nombre ||
          "Cliente WhatsApp",

        whatsappCliente:
          telefono,

        latitud:
          conversacion.latitud,

        longitud:
          conversacion.longitud,

        referencia:
          conversacion.referencia ||
          "Ubicación compartida",

        formaPago,
      });


    await prisma.conversacionWhatsApp
      .update({
        where: {
          telefono,
        },

        data: {
          estado:
            "CARRERA_CREADA",
        },
      });


    await enviarTextoWhatsApp(
      telefono,
      [
        "✅ ¡Listo!",
        "",
        `🚖 Tu carrera #${carrera.numero} fue creada.`,
        "",
        "Ya estamos buscando un taxi para ti.",
        "",
        "El conductor asignado se comunicará contigo."
      ].join("\n")
    );


    return;
  }


  if (
    conversacion.estado ===
    "CARRERA_CREADA"
  ) {

    await enviarTextoWhatsApp(
      telefono,
      "Ya tienes una carrera activa. 🚖 Estamos buscando un taxi para ti."
    );
  }
}