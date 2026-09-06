import {
  prisma,
} from "../config/prisma";

import {
  crearCarrera,
} from "./carrera.service";

import {
  enviarTextoWhatsApp,
  solicitarUbicacionWhatsApp,
  enviarBotonesWhatsApp,
} from "./whatsapp.service";


interface MensajeWhatsAppInput {
  telefono: string;

  nombre?: string;

  tipo?: string;

  texto?: string;

  botonId?: string;

  latitud?: number;

  longitud?: number;

  nombreUbicacion?: string;

  direccionUbicacion?: string;
}


function normalizarTelefono(
  telefono: string
) {
  return telefono.replace(
    /\D/g,
    ""
  );
}


function esCancelar(
  texto?: string,
  botonId?: string
) {
  const t =
    (texto || "")
      .trim()
      .toLowerCase();

  const b =
    (botonId || "")
      .trim()
      .toLowerCase();


  return (
    t === "cancelar" ||
    b === "cancelar_carrera"
  );
}


function obtenerPago(
  texto?: string,
  botonId?: string
) {
  const valor =
    (
      botonId ||
      texto ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    valor ===
      "pago_efectivo" ||
    valor ===
      "efectivo"
  ) {
    return "Efectivo";
  }


  if (
    valor ===
      "pago_pichincha" ||
    valor.includes(
      "pichincha"
    )
  ) {
    return (
      "Transferencia Banco Pichincha"
    );
  }


  if (
    valor ===
      "pago_guayaquil" ||
    valor.includes(
      "guayaquil"
    )
  ) {
    return (
      "Transferencia Banco Guayaquil"
    );
  }


  return null;
}


async function enviarOpcionesPago(
  telefono: string
) {
  await enviarBotonesWhatsApp(
    telefono,

    "¿Cómo deseas pagar al finalizar la carrera?",

    [
      {
        id:
          "pago_efectivo",

        titulo:
          "Efectivo",
      },

      {
        id:
          "pago_pichincha",

        titulo:
          "Pichincha",
      },

      {
        id:
          "pago_guayaquil",

        titulo:
          "Guayaquil",
      },
    ]
  );
}


async function enviarCarreraEnCurso(
  telefono: string,
  nombre: string
) {
  await enviarBotonesWhatsApp(
    telefono,

    `Hola ${nombre}, tienes una carrera en curso.`,

    [
      {
        id:
          "cancelar_carrera",

        titulo:
          "Cancelar",
      },
    ]
  );
}


export async function procesarMensajeWhatsApp(
  input: MensajeWhatsAppInput
) {
  const telefono =
    normalizarTelefono(
      input.telefono
    );


  const cliente =
    await prisma.cliente.findUnique({
      where: {
        whatsapp:
          telefono,
      },
    });


  let conversacion =
    await prisma
      .conversacionWhatsApp
      .findUnique({
        where: {
          telefono,
        },
      });


  /*
    ======================================
    CANCELAR CARRERA
    ======================================
  */

  if (
    conversacion &&
    esCancelar(
      input.texto,
      input.botonId
    )
  ) {
    if (
      conversacion.carreraId
    ) {
      const carrera =
        await prisma.carrera.findUnique({
          where: {
            id:
              conversacion.carreraId,
          },
        });


      if (
        carrera &&
        carrera.estado !==
          "COMPLETADA" &&
        carrera.estado !==
          "CANCELADA"
      ) {
        await prisma.carrera.update({
          where: {
            id:
              carrera.id,
          },

          data: {
            estado:
              "CANCELADA",

            canceladaPor:
              "CLIENTE",
          },
        });
      }
    }


    await prisma
      .conversacionWhatsApp
      .update({
        where: {
          telefono,
        },

        data: {
          estado:
            "NUEVO",

          carreraId:
            null,

          latitud:
            null,

          longitud:
            null,

          referencia:
            null,
        },
      });


    await enviarTextoWhatsApp(
      telefono,

      "Tu carrera fue cancelada. Cuando necesites otro taxi, escríbeme nuevamente. 🚖"
    );


    return;
  }


  /*
    ======================================
    CLIENTE NUEVO
    ======================================
  */

  if (!cliente) {

    /*
      Todavía no existe conversación.
    */

    if (!conversacion) {
      conversacion =
        await prisma
          .conversacionWhatsApp
          .create({
            data: {
              telefono,

              nombre:
                input.nombre ||
                null,

              estado:
                "ESPERANDO_NOMBRE",

              latitud:
                input.latitud ??
                null,

              longitud:
                input.longitud ??
                null,

              referencia:
                input.direccionUbicacion ||
                input.nombreUbicacion ||
                null,
            },
          });


      await enviarTextoWhatsApp(
        telefono,

        "¡Hola! 👋 Bienvenido a RapiTaxi. Antes de continuar, dime tu nombre por favor."
      );


      return;
    }


    /*
      Esperando que escriba su nombre.
    */

    if (
      conversacion.estado ===
      "ESPERANDO_NOMBRE"
    ) {
      const nombre =
        (
          input.texto || ""
        ).trim();


      if (!nombre) {
        await enviarTextoWhatsApp(
          telefono,

          "Por favor escríbeme tu nombre para registrarte."
        );

        return;
      }


      const nuevoCliente =
        await prisma.cliente.create({
          data: {
            whatsapp:
              telefono,

            nombre,
          },
        });


      const yaTieneUbicacion =
        conversacion.latitud !==
          null &&
        conversacion.longitud !==
          null;


      conversacion =
        await prisma
          .conversacionWhatsApp
          .update({
            where: {
              telefono,
            },

            data: {
              nombre,

              clienteId:
                nuevoCliente.id,

              estado:
                yaTieneUbicacion
                  ? "ESPERANDO_PAGO"
                  : "ESPERANDO_UBICACION",
            },
          });


      if (yaTieneUbicacion) {
        await enviarOpcionesPago(
          telefono
        );

        return;
      }


      await solicitarUbicacionWhatsApp(
        telefono,

        `Hola ${nombre} 👋 Envíame tu ubicación actual.`
      );


      return;
    }
  }


  /*
    ======================================
    CLIENTE YA REGISTRADO
    ======================================
  */

  const clienteActual =
    cliente ||
    (
      conversacion?.clienteId
        ? await prisma.cliente
            .findUnique({
              where: {
                id:
                  conversacion.clienteId,
              },
            })
        : null
    );


  if (!clienteActual) {
    return;
  }


  /*
    Si por alguna razón no existe
    conversación, la recreamos.
  */

  if (!conversacion) {
    conversacion =
      await prisma
        .conversacionWhatsApp
        .create({
          data: {
            telefono,

            nombre:
              clienteActual.nombre,

            clienteId:
              clienteActual.id,

            estado:
              "NUEVO",
          },
        });
  }


  /*
    ======================================
    CARRERA EN CURSO
    ======================================
  */

  if (
    conversacion.estado ===
      "BUSCANDO_TAXI" ||
    conversacion.estado ===
      "CARRERA_ACTIVA"
  ) {
    await enviarCarreraEnCurso(
      telefono,
      clienteActual.nombre
    );

    return;
  }


  /*
    ======================================
    ESTADO NUEVO
    ======================================
  */

  if (
    conversacion.estado ===
    "NUEVO"
  ) {

    /*
      El cliente puede mandar
      ubicación directamente.
    */

    if (
      input.tipo ===
        "location" &&
      input.latitud !==
        undefined &&
      input.longitud !==
        undefined
    ) {
      await prisma
        .conversacionWhatsApp
        .update({
          where: {
            telefono,
          },

          data: {
            latitud:
              input.latitud,

            longitud:
              input.longitud,

            referencia:
              input.direccionUbicacion ||
              input.nombreUbicacion ||
              "Ubicación compartida por WhatsApp",

            estado:
              "ESPERANDO_PAGO",
          },
        });


      await enviarOpcionesPago(
        telefono
      );

      return;
    }


    await prisma
      .conversacionWhatsApp
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
      telefono,

      `Hola ${clienteActual.nombre} 👋 Envíame tu ubicación actual.`
    );


    return;
  }


  /*
    ======================================
    ESPERANDO UBICACIÓN
    ======================================
  */

  if (
    conversacion.estado ===
    "ESPERANDO_UBICACION"
  ) {
    if (
      input.tipo !==
        "location" ||
      input.latitud ===
        undefined ||
      input.longitud ===
        undefined
    ) {
      await solicitarUbicacionWhatsApp(
        telefono,

        `${clienteActual.nombre}, necesito que compartas tu ubicación actual.`
      );

      return;
    }


    await prisma
      .conversacionWhatsApp
      .update({
        where: {
          telefono,
        },

        data: {
          latitud:
            input.latitud,

          longitud:
            input.longitud,

          referencia:
            input.direccionUbicacion ||
            input.nombreUbicacion ||
            "Ubicación compartida por WhatsApp",

          estado:
            "ESPERANDO_PAGO",
        },
      });


    await enviarOpcionesPago(
      telefono
    );


    return;
  }


  /*
    ======================================
    ESPERANDO FORMA DE PAGO
    ======================================
  */

  if (
    conversacion.estado ===
    "ESPERANDO_PAGO"
  ) {
    const formaPago =
      obtenerPago(
        input.texto,
        input.botonId
      );


    if (!formaPago) {
      await enviarOpcionesPago(
        telefono
      );

      return;
    }


    const latitud =
      conversacion.latitud;

    const longitud =
      conversacion.longitud;


    if (
      latitud === null ||
      longitud === null
    ) {
      await prisma
        .conversacionWhatsApp
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


    /*
      Bloqueo para impedir carreras
      duplicadas por webhook repetido.
    */

    const bloqueo =
      await prisma
        .conversacionWhatsApp
        .updateMany({
          where: {
            id:
              conversacion.id,

            estado:
              "ESPERANDO_PAGO",
          },

          data: {
            estado:
              "BUSCANDO_TAXI",
          },
        });


    if (
      bloqueo.count === 0
    ) {
      return;
    }


    try {
      const carrera =
        await crearCarrera({
          nombreCliente:
            clienteActual.nombre,

          whatsappCliente:
            telefono,

          latitud,

          longitud,

          referencia:
            conversacion.referencia ||
            "Ubicación compartida por WhatsApp",

          formaPago,
        });


      await prisma.carrera.update({
        where: {
          id:
            carrera.id,
        },

        data: {
          clienteId:
            clienteActual.id,
        },
      });


      await prisma
        .conversacionWhatsApp
        .update({
          where: {
            telefono,
          },

          data: {
            carreraId:
              carrera.id,

            estado:
              "BUSCANDO_TAXI",
          },
        });


      await enviarTextoWhatsApp(
        telefono,

        `✅ Listo ${clienteActual.nombre}, estoy buscando taxi. Enseguida te confirmo. 🚖`
      );


      return;

    } catch (error) {

      console.error(
        "Error creando carrera:",
        error
      );


      await prisma
        .conversacionWhatsApp
        .update({
          where: {
            telefono,
          },

          data: {
            estado:
              "ESPERANDO_PAGO",
          },
        });


      throw error;
    }
  }


  /*
    ======================================
    ESPERANDO CALIFICACIÓN
    ======================================
  */

  if (
    conversacion.estado ===
    "ESPERANDO_CALIFICACION"
  ) {
    return;
  }
}