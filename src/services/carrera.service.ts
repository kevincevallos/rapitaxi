import crypto from "crypto";
import { prisma } from "../config/prisma";

interface CrearCarreraInput {
  nombreCliente: string;
  whatsappCliente: string;
  latitud: number;
  longitud: number;
  referencia: string;
  formaPago: string;
}

export async function crearCarrera(data: CrearCarreraInput) {
  const ultimaCarrera = await prisma.carrera.findFirst({
    orderBy: {
      numero: "desc",
    },
  });

  const numero = ultimaCarrera ? ultimaCarrera.numero + 1 : 100;

  const token = crypto.randomBytes(24).toString("hex");

  return prisma.carrera.create({
    data: {
      numero,
      token,
      nombreCliente: data.nombreCliente,
      whatsappCliente: data.whatsappCliente,
      latitud: data.latitud,
      longitud: data.longitud,
      referencia: data.referencia,
      formaPago: data.formaPago,
      estado: "BUSCANDO",
    },
  });
}

export async function obtenerCarreraPublica(token: string) {
  const carrera = await prisma.carrera.findUnique({
    where: {
      token,
    },
  });

  if (!carrera) {
    return null;
  }

  return {
    numero: carrera.numero,
    referencia: carrera.referencia,
    formaPago: carrera.formaPago,
    estado: carrera.estado,
    fechaCreacion: carrera.fechaCreacion,
  };
}

export async function aceptarCarrera(
  token: string,
  codigoTaxista: string
) {
  const codigo =
    codigoTaxista.trim().padStart(3, "0");


  if (!/^\d{3}$/.test(codigo)) {
    return {
      resultado: "CODIGO_INVALIDO" as const,
    };
  }


  const numeroCodigo =
    Number(codigo);

  if (
    numeroCodigo < 1 ||
    numeroCodigo > 999
  ) {
    return {
      resultado: "CODIGO_INVALIDO" as const,
    };
  }


  const taxista =
    await prisma.taxista.findUnique({
      where: {
        codigo,
      },
    });


  if (!taxista) {
    return {
      resultado: "TAXISTA_NO_EXISTE" as const,
    };
  }


  if (!taxista.activo) {
    return {
      resultado: "TAXISTA_INACTIVO" as const,
    };
  }


  const resultado =
    await prisma.carrera.updateMany({
      where: {
        token,
        estado: "BUSCANDO",
      },

      data: {
        estado: "ASIGNADA",
        fechaAceptacion: new Date(),
        taxistaId: taxista.id,
      },
    });


  if (resultado.count === 0) {

    const existente =
      await prisma.carrera.findUnique({
        where: {
          token,
        },

        select: {
          id: true,
          estado: true,
        },
      });


    if (!existente) {
      return {
        resultado: "NO_EXISTE" as const,
      };
    }


    return {
      resultado: "YA_ASIGNADA" as const,
    };
  }


  const carrera =
    await prisma.carrera.findUnique({
      where: {
        token,
      },
    });


  if (!carrera) {
    return {
      resultado: "NO_EXISTE" as const,
    };
  }


  const telefono =
    carrera.whatsappCliente.replace(
      /\D/g,
      ""
    );


  const mensaje =
    encodeURIComponent(
      `Hola, soy el taxi asignado a tu carrera #${carrera.numero}. Mi código RapiTaxi es ${taxista.codigo}.`
    );


  const enlaceWhatsapp =
    `https://wa.me/${telefono}?text=${mensaje}`;


  return {
    resultado: "ASIGNADA" as const,

    carrera: {
      numero: carrera.numero,
      referencia: carrera.referencia,
      formaPago: carrera.formaPago,
      enlaceWhatsapp,

      taxista: {
        codigo: taxista.codigo,
        nombre: taxista.nombre,
        placa: taxista.placa,
        vehiculo: taxista.vehiculo,
      },
    },
  };
}
export async function listarCarrerasAdmin() {
  return prisma.carrera.findMany({
    orderBy: {
      fechaCreacion: "desc",
    },

    include: {
      taxista: {
        select: {
          codigo: true,
          nombre: true,
          placa: true,
          vehiculo: true,
        },
      },
    },
  });
}