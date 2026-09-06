import { prisma } from "../config/prisma";

interface CrearTaxistaInput {
  codigo: string;
  nombre: string;
  placa: string;
  vehiculo: string;
  telefono?: string;
}

export function normalizarCodigoTaxista(
  codigoRecibido: string
) {
  const limpio = codigoRecibido.trim();

  if (!/^\d{1,3}$/.test(limpio)) {
    throw new Error(
      "El código del conductor debe contener entre 1 y 3 números"
    );
  }

  const numero = Number(limpio);

  if (numero < 1 || numero > 999) {
    throw new Error(
      "El código debe estar entre 001 y 999"
    );
  }

  return limpio.padStart(3, "0");
}

export async function crearTaxista(
  data: CrearTaxistaInput
) {
  const codigo =
    normalizarCodigoTaxista(data.codigo);

  const nombre =
    data.nombre.trim();

  const placa =
    data.placa.trim().toUpperCase();

  const vehiculo =
    data.vehiculo.trim();

  const telefono =
    data.telefono?.trim() || null;


  if (!nombre) {
    throw new Error(
      "El nombre es obligatorio"
    );
  }

  if (!placa) {
    throw new Error(
      "La placa es obligatoria"
    );
  }

  if (!vehiculo) {
    throw new Error(
      "El vehículo es obligatorio"
    );
  }


  const codigoExistente =
    await prisma.taxista.findUnique({
      where: {
        codigo,
      },
    });

  if (codigoExistente) {
    throw new Error(
      `El código ${codigo} ya está registrado`
    );
  }


  const placaExistente =
    await prisma.taxista.findUnique({
      where: {
        placa,
      },
    });

  if (placaExistente) {
    throw new Error(
      `La placa ${placa} ya está registrada`
    );
  }


  return prisma.taxista.create({
    data: {
      codigo,
      nombre,
      placa,
      vehiculo,
      telefono,
    },
  });
}


export async function listarTaxistas() {
  return prisma.taxista.findMany({
    orderBy: {
      codigo: "asc",
    },
  });
}


export async function obtenerTaxistaPorCodigo(
  codigoRecibido: string
) {
  const codigo =
    normalizarCodigoTaxista(codigoRecibido);

  return prisma.taxista.findUnique({
    where: {
      codigo,
    },
  });
}

interface ActualizarTaxistaInput {
  nombre?: string;
  placa?: string;
  vehiculo?: string;
  telefono?: string;
  activo?: boolean;
}

export async function actualizarTaxista(
  id: number,
  data: ActualizarTaxistaInput
) {
  const existente =
    await prisma.taxista.findUnique({
      where: { id },
    });

  if (!existente) {
    throw new Error(
      "Taxista no encontrado"
    );
  }

  let placa = existente.placa;

  if (data.placa !== undefined) {
    placa =
      data.placa.trim().toUpperCase();

    if (!placa) {
      throw new Error(
        "La placa no puede estar vacía"
      );
    }

    const placaExistente =
      await prisma.taxista.findFirst({
        where: {
          placa,
          NOT: {
            id,
          },
        },
      });

    if (placaExistente) {
      throw new Error(
        `La placa ${placa} ya está registrada`
      );
    }
  }

  return prisma.taxista.update({
    where: {
      id,
    },

    data: {
      nombre:
        data.nombre !== undefined
          ? data.nombre.trim()
          : existente.nombre,

      placa,

      vehiculo:
        data.vehiculo !== undefined
          ? data.vehiculo.trim()
          : existente.vehiculo,

      telefono:
        data.telefono !== undefined
          ? data.telefono.trim() || null
          : existente.telefono,

      activo:
        data.activo !== undefined
          ? data.activo
          : existente.activo,
    },
  });
}