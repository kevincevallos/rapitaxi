import { prisma } from "../config/prisma";


export function normalizarTelefonoChat(
  telefono: string
) {
  const limpio =
    String(telefono || "")
      .replace(/\D/g, "");

  if (!limpio) {
    return "";
  }

  if (limpio.startsWith("593")) {
    return limpio;
  }

  if (limpio.startsWith("0")) {
    return (
      "593" +
      limpio.substring(1)
    );
  }

  return limpio;
}


interface RegistrarMensajeInput {
  telefono: string;
  direccion: "ENTRANTE" | "SALIENTE";
  tipo?: string;
  contenido?: string | null;
  messageId?: string | null;
  leido?: boolean;
}


export async function registrarMensajeWhatsApp(
  input: RegistrarMensajeInput
) {
  const telefono =
    normalizarTelefonoChat(
      input.telefono
    );

  if (!telefono) {
    return null;
  }

  const messageId =
    input.messageId
      ? String(input.messageId)
      : null;

  if (messageId) {
    const existente =
      await prisma.mensajeWhatsApp
        .findUnique({
          where: {
            messageId,
          },
        });

    if (existente) {
      return existente;
    }
  }

  return prisma.mensajeWhatsApp.create({
    data: {
      telefono,
      direccion:
        input.direccion,
      tipo:
        input.tipo || "text",
      contenido:
        input.contenido || null,
      messageId,
      leido:
        input.leido ??
        input.direccion ===
          "SALIENTE",
    },
  });
}


export async function estaEnAtencionManual(
  telefonoInput: string
) {
  const telefono =
    normalizarTelefonoChat(
      telefonoInput
    );

  if (!telefono) {
    return false;
  }

  const conversacion =
    await prisma.conversacionWhatsApp
      .findUnique({
        where: {
          telefono,
        },
        select: {
          atencionManual: true,
        },
      });

  return Boolean(
    conversacion?.atencionManual
  );
}


export async function cambiarAtencionManual(
  telefonoInput: string,
  activo: boolean
) {
  const telefono =
    normalizarTelefonoChat(
      telefonoInput
    );

  if (!telefono) {
    throw new Error(
      "TELEFONO_INVALIDO"
    );
  }

  return prisma.conversacionWhatsApp
    .upsert({
      where: {
        telefono,
      },
      create: {
        telefono,
        estado: "NUEVO",
        atencionManual:
          activo,
      },
      update: {
        atencionManual:
          activo,
      },
      select: {
        telefono: true,
        nombre: true,
        estado: true,
        atencionManual: true,
      },
    });
}


export async function listarChatsAdmin() {
  const mensajes =
    await prisma.mensajeWhatsApp
      .findMany({
        orderBy: {
          fechaCreacion:
            "desc",
        },
        take: 1000,
      });

  const telefonos =
    Array.from(
      new Set(
        mensajes.map(
          mensaje =>
            mensaje.telefono
        )
      )
    );

  if (telefonos.length === 0) {
    return [];
  }

  const [
    conversaciones,
    clientes,
  ] = await Promise.all([
    prisma.conversacionWhatsApp
      .findMany({
        where: {
          telefono: {
            in: telefonos,
          },
        },
        select: {
          telefono: true,
          nombre: true,
          estado: true,
          atencionManual: true,
        },
      }),

    prisma.cliente.findMany({
      where: {
        whatsapp: {
          in: telefonos,
        },
      },
      select: {
        whatsapp: true,
        nombre: true,
      },
    }),
  ]);

  const conversacionPorTelefono =
    new Map(
      conversaciones.map(
        item => [
          item.telefono,
          item,
        ]
      )
    );

  const clientePorTelefono =
    new Map(
      clientes.map(
        item => [
          item.whatsapp,
          item,
        ]
      )
    );

  const chats =
    new Map<string, any>();

  for (const mensaje of mensajes) {
    let chat =
      chats.get(
        mensaje.telefono
      );

    if (!chat) {
      const conversacion =
        conversacionPorTelefono
          .get(
            mensaje.telefono
          );

      const cliente =
        clientePorTelefono
          .get(
            mensaje.telefono
          );

      chat = {
        telefono:
          mensaje.telefono,
        nombre:
          cliente?.nombre ||
          conversacion?.nombre ||
          mensaje.telefono,
        estadoBot:
          conversacion?.estado ||
          "NUEVO",
        atencionManual:
          Boolean(
            conversacion
              ?.atencionManual
          ),
        ultimoMensaje:
          mensaje.contenido ||
          `[${mensaje.tipo}]`,
        ultimaFecha:
          mensaje.fechaCreacion,
        ultimaDireccion:
          mensaje.direccion,
        noLeidos: 0,
      };

      chats.set(
        mensaje.telefono,
        chat
      );
    }

    if (
      mensaje.direccion ===
        "ENTRANTE" &&
      !mensaje.leido
    ) {
      chat.noLeidos++;
    }
  }

  return Array.from(
    chats.values()
  );
}


export async function obtenerMensajesChat(
  telefonoInput: string
) {
  const telefono =
    normalizarTelefonoChat(
      telefonoInput
    );

  if (!telefono) {
    throw new Error(
      "TELEFONO_INVALIDO"
    );
  }

  await prisma.mensajeWhatsApp
    .updateMany({
      where: {
        telefono,
        direccion:
          "ENTRANTE",
        leido: false,
      },
      data: {
        leido: true,
      },
    });

  const mensajes =
    await prisma.mensajeWhatsApp
      .findMany({
        where: {
          telefono,
        },
        orderBy: {
          fechaCreacion:
            "desc",
        },
        take: 300,
      });

  mensajes.reverse();

  const [
    conversacion,
    cliente,
  ] = await Promise.all([
    prisma.conversacionWhatsApp
      .findUnique({
        where: {
          telefono,
        },
        select: {
          nombre: true,
          estado: true,
          atencionManual: true,
        },
      }),

    prisma.cliente.findUnique({
      where: {
        whatsapp: telefono,
      },
      select: {
        nombre: true,
      },
    }),
  ]);

  return {
    telefono,
    nombre:
      cliente?.nombre ||
      conversacion?.nombre ||
      telefono,
    estadoBot:
      conversacion?.estado ||
      "NUEVO",
    atencionManual:
      Boolean(
        conversacion
          ?.atencionManual
      ),
    mensajes,
  };
}
