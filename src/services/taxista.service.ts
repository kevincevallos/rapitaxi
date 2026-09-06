import { prisma } from "../config/prisma";


interface CrearTaxistaInput {
  codigo: string;
  nombre: string;
  placa: string;
  vehiculo: string;
  telefono?: string;

  colorVehiculo?: string;
  cooperativa?: string;

  titularPichincha?: string;
  cuentaPichincha?: string;

  titularGuayaquil?: string;
  cuentaGuayaquil?: string;
}


interface ActualizarTaxistaInput {
  codigo?: string;
  nombre?: string;
  placa?: string;
  vehiculo?: string;
  telefono?: string;
  activo?: boolean;

  colorVehiculo?: string;
  cooperativa?: string;

  titularPichincha?: string;
  cuentaPichincha?: string;

  titularGuayaquil?: string;
  cuentaGuayaquil?: string;
}


/*
  ========================================
  NORMALIZAR CÓDIGO
  ========================================

  Permite escribir:

  1   -> 001
  25  -> 025
  354 -> 354

  Solo admite números entre 001 y 999.
*/

function normalizarCodigo(
  codigo: string
) {
  const limpio =
    String(codigo || "")
      .replace(/\D/g, "");


  if (
    limpio.length < 1 ||
    limpio.length > 3
  ) {
    throw new Error(
      "CODIGO_INVALIDO"
    );
  }


  const numero =
    Number(limpio);


  if (
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 999
  ) {
    throw new Error(
      "CODIGO_INVALIDO"
    );
  }


  return String(numero)
    .padStart(3, "0");
}


/*
  ========================================
  CREAR TAXISTA
  ========================================
*/

export async function crearTaxista(
  data: CrearTaxistaInput
) {
  const codigo =
    normalizarCodigo(
      data.codigo
    );


  const placa =
    data.placa
      .trim()
      .toUpperCase();


  /*
    Comprobar que el código
    no esté siendo utilizado.
  */

  const codigoExistente =
    await prisma.taxista.findUnique({
      where: {
        codigo,
      },
    });


  if (codigoExistente) {
    throw new Error(
      "CODIGO_EXISTENTE"
    );
  }


  /*
    Comprobar que la placa
    no esté registrada.
  */

  const placaExistente =
    await prisma.taxista.findUnique({
      where: {
        placa,
      },
    });


  if (placaExistente) {
    throw new Error(
      "PLACA_EXISTENTE"
    );
  }


  return prisma.taxista.create({
    data: {
      codigo,

      nombre:
        data.nombre.trim(),

      placa,

      vehiculo:
        data.vehiculo.trim(),

      telefono:
        data.telefono?.trim() ||
        null,

      colorVehiculo:
        data.colorVehiculo?.trim() ||
        null,

      cooperativa:
        data.cooperativa?.trim() ||
        null,

      titularPichincha:
        data.titularPichincha?.trim() ||
        null,

      cuentaPichincha:
        data.cuentaPichincha?.trim() ||
        null,

      titularGuayaquil:
        data.titularGuayaquil?.trim() ||
        null,

      cuentaGuayaquil:
        data.cuentaGuayaquil?.trim() ||
        null,

      activo:
        true,
    },
  });
}


/*
  ========================================
  LISTAR TAXISTAS
  ========================================
*/

export async function listarTaxistas() {
  return prisma.taxista.findMany({
    orderBy: {
      codigo:
        "asc",
    },
  });
}


/*
  ========================================
  BUSCAR TAXISTA POR CÓDIGO
  ========================================
*/

export async function obtenerTaxistaPorCodigo(
  codigoTaxista: string
) {
  const codigo =
    normalizarCodigo(
      codigoTaxista
    );


  return prisma.taxista.findUnique({
    where: {
      codigo,
    },
  });
}


/*
  ========================================
  ACTUALIZAR TAXISTA
  ========================================
*/

export async function actualizarTaxista(
  id: number,
  data: ActualizarTaxistaInput
) {
  /*
    Primero comprobamos que
    el taxista realmente exista.
  */

  const existente =
    await prisma.taxista.findUnique({
      where: {
        id,
      },
    });


  if (!existente) {
    throw new Error(
      "TAXISTA_NO_EXISTE"
    );
  }


  /*
    ========================================
    VALIDAR CAMBIO DE CÓDIGO
    ========================================

    Si no se modifica, conserva
    el código actual.

    Si se modifica:
    - debe ser 001 a 999
    - no puede pertenecer a otro taxista
  */

  let nuevoCodigo =
    existente.codigo;


  if (
    data.codigo !== undefined
  ) {
    nuevoCodigo =
      normalizarCodigo(
        data.codigo
      );


    /*
      Solo hacemos la consulta
      si realmente cambió.
    */

    if (
      nuevoCodigo !==
      existente.codigo
    ) {
      const codigoExistente =
        await prisma.taxista.findUnique({
          where: {
            codigo:
              nuevoCodigo,
          },
        });


      if (
        codigoExistente &&
        codigoExistente.id !== id
      ) {
        throw new Error(
          "CODIGO_EXISTENTE"
        );
      }
    }
  }


  /*
    ========================================
    VALIDAR PLACA
    ========================================
  */

  let nuevaPlaca =
    existente.placa;


  if (
    data.placa !== undefined
  ) {
    nuevaPlaca =
      data.placa
        .trim()
        .toUpperCase();


    if (
      nuevaPlaca !==
      existente.placa
    ) {
      const placaExistente =
        await prisma.taxista.findUnique({
          where: {
            placa:
              nuevaPlaca,
          },
        });


      if (
        placaExistente &&
        placaExistente.id !== id
      ) {
        throw new Error(
          "PLACA_EXISTENTE"
        );
      }
    }
  }


  /*
    ========================================
    GUARDAR CAMBIOS
    ========================================
  */

  return prisma.taxista.update({
    where: {
      id,
    },

    data: {
      /*
        Ahora el código SÍ puede
        modificarse.
      */

      codigo:
        nuevoCodigo,


      nombre:
        data.nombre !== undefined
          ? data.nombre.trim()
          : existente.nombre,


      placa:
        nuevaPlaca,


      vehiculo:
        data.vehiculo !== undefined
          ? data.vehiculo.trim()
          : existente.vehiculo,


      telefono:
        data.telefono !== undefined
          ? data.telefono.trim() ||
            null
          : existente.telefono,


      activo:
        data.activo !== undefined
          ? data.activo
          : existente.activo,


      colorVehiculo:
        data.colorVehiculo !== undefined
          ? data.colorVehiculo.trim() ||
            null
          : existente.colorVehiculo,


      cooperativa:
        data.cooperativa !== undefined
          ? data.cooperativa.trim() ||
            null
          : existente.cooperativa,


      titularPichincha:
        data.titularPichincha !== undefined
          ? data.titularPichincha.trim() ||
            null
          : existente.titularPichincha,


      cuentaPichincha:
        data.cuentaPichincha !== undefined
          ? data.cuentaPichincha.trim() ||
            null
          : existente.cuentaPichincha,


      titularGuayaquil:
        data.titularGuayaquil !== undefined
          ? data.titularGuayaquil.trim() ||
            null
          : existente.titularGuayaquil,


      cuentaGuayaquil:
        data.cuentaGuayaquil !== undefined
          ? data.cuentaGuayaquil.trim() ||
            null
          : existente.cuentaGuayaquil,
    },
  });
}