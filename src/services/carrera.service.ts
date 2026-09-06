import crypto from "crypto";

import {
  prisma,
} from "../config/prisma";

import {
  enviarTextoWhatsApp,
} from "./whatsapp.service";


interface CrearCarreraInput {
  nombreCliente: string;
  whatsappCliente: string;
  latitud: number;
  longitud: number;
  referencia: string;
  formaPago: string;
}


function normalizarCodigoTaxista(
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


function construirWhatsappTaxista(
  telefonoCliente: string,
  numeroCarrera: number,
  codigoTaxista: string
) {
  const telefono =
    telefonoCliente.replace(
      /\D/g,
      ""
    );


  const mensaje =
    encodeURIComponent(
      `Hola, soy el taxi asignado a tu carrera #${numeroCarrera}. Mi código RapiTaxi es ${codigoTaxista}.`
    );


  return (
    `https://wa.me/${telefono}` +
    `?text=${mensaje}`
  );
}


export async function crearCarrera(
  data: CrearCarreraInput
) {
  /*
    Buscamos el número de carrera
    más alto y generamos el siguiente.
  */

  const ultimaCarrera =
    await prisma.carrera.findFirst({
      orderBy: {
        numero:
          "desc",
      },

      select: {
        numero:
          true,
      },
    });


  const numero =
    ultimaCarrera
      ? ultimaCarrera.numero + 1
      : 100;


  const token =
    crypto
      .randomBytes(24)
      .toString("hex");


  const carrera =
    await prisma.carrera.create({
      data: {
        numero,
        token,

        nombreCliente:
          data.nombreCliente.trim(),

        whatsappCliente:
          data.whatsappCliente.replace(
            /\D/g,
            ""
          ),

        latitud:
          data.latitud,

        longitud:
          data.longitud,

        referencia:
          data.referencia.trim(),

        formaPago:
          data.formaPago,

        estado:
          "BUSCANDO",
      },
    });


  return carrera;
}


export async function obtenerCarreraPublica(
  token: string
) {
  const carrera =
    await prisma.carrera.findUnique({
      where: {
        token,
      },

      select: {
        numero:
          true,

        referencia:
          true,

        formaPago:
          true,

        estado:
          true,

        fechaCreacion:
          true,
      },
    });


  return carrera;
}


export async function aceptarCarrera(
  token: string,
  codigoTaxista: string
) {
  /*
    Validamos y normalizamos
    el código del conductor.
  */

  const codigo =
    normalizarCodigoTaxista(
      codigoTaxista
    );


  /*
    Comprobamos que el taxista
    exista.
  */

  const taxista =
    await prisma.taxista.findUnique({
      where: {
        codigo,
      },
    });


  if (!taxista) {
    throw new Error(
      "TAXISTA_NO_EXISTE"
    );
  }


  if (!taxista.activo) {
    throw new Error(
      "TAXISTA_INACTIVO"
    );
  }


  /*
    Aceptación atómica.

    Solamente cambia a ASIGNADA
    si sigue en BUSCANDO.

    Así, aunque dos taxistas
    pulsen aceptar al mismo tiempo,
    solamente uno puede ganar.
  */

  const resultado =
    await prisma.carrera.updateMany({
      where: {
        token,
        estado:
          "BUSCANDO",
      },

      data: {
        estado:
          "ASIGNADA",

        fechaAceptacion:
          new Date(),

        taxistaId:
          taxista.id,
      },
    });


  if (
    resultado.count === 0
  ) {
    const existente =
      await prisma.carrera.findUnique({
        where: {
          token,
        },

        select: {
          id:
            true,

          estado:
            true,
        },
      });


    if (!existente) {
      throw new Error(
        "CARRERA_NO_EXISTE"
      );
    }


    throw new Error(
      "YA_ASIGNADA"
    );
  }


  /*
    Obtenemos la carrera ya
    asignada.
  */

  const carrera =
    await prisma.carrera.findUnique({
      where: {
        token,
      },
    });


  if (!carrera) {
    throw new Error(
      "CARRERA_NO_EXISTE"
    );
  }


  /*
    Link que verá el taxista ganador
    para contactar directamente
    al cliente.
  */

  const enlaceWhatsapp =
    construirWhatsappTaxista(
      carrera.whatsappCliente,
      carrera.numero,
      taxista.codigo
    );


  /*
    ======================================
    NOTIFICACIÓN AUTOMÁTICA AL CLIENTE
    ======================================
  */

  const descripcionVehiculo =
    [
      taxista.vehiculo,
      taxista.colorVehiculo,
    ]
      .filter(Boolean)
      .join(" ");


  let datosPago = "";


  /*
    Si el cliente escogió
    Banco Pichincha, mostramos
    únicamente los datos Pichincha
    de ese taxista.
  */

  if (
    carrera.formaPago ===
    "Transferencia Banco Pichincha"
  ) {
    if (
      taxista.titularPichincha &&
      taxista.cuentaPichincha
    ) {
      datosPago =
        `\n\n💳 Transferencia - Banco Pichincha` +
        `\nTitular: ${taxista.titularPichincha}` +
        `\nCuenta: ${taxista.cuentaPichincha}`;
    }
  }


  /*
    Si el cliente escogió
    Banco Guayaquil, mostramos
    únicamente los datos Guayaquil.
  */

  if (
    carrera.formaPago ===
    "Transferencia Banco Guayaquil"
  ) {
    if (
      taxista.titularGuayaquil &&
      taxista.cuentaGuayaquil
    ) {
      datosPago =
        `\n\n💳 Transferencia - Banco Guayaquil` +
        `\nTitular: ${taxista.titularGuayaquil}` +
        `\nCuenta: ${taxista.cuentaGuayaquil}`;
    }
  }


  const mensajeCliente =
    `✅ ¡Listo! ${taxista.nombre} va en camino a recogerte.` +

    `\n\n🚖 Vehículo: ${
      descripcionVehiculo ||
      taxista.vehiculo
    }` +

    `\n🏢 Cooperativa: ${
      taxista.cooperativa ||
      "RapiTaxi"
    }` +

    `\n🔢 Código de unidad: ${
      taxista.codigo
    }` +

    `\n📞 Teléfono: ${
      taxista.telefono ||
      "No disponible"
    }` +

    `\n💳 Pago: ${
      carrera.formaPago
    }` +

    datosPago;


  /*
    La aceptación de la carrera
    NO debe fallar aunque Kapso
    tenga temporalmente un error.

    Por eso WhatsApp va dentro
    de try/catch.
  */

  try {
    await enviarTextoWhatsApp(
      carrera.whatsappCliente,
      mensajeCliente
    );


    /*
      Mensaje adicional con enlace
      directo al WhatsApp del
      taxista.
    */

    if (taxista.telefono) {
      let telefonoTaxista =
        taxista.telefono.replace(
          /\D/g,
          ""
        );


      /*
        Si el compañero guarda
        números ecuatorianos como
        0999999999, los convertimos
        a 593999999999.
      */

      if (
        telefonoTaxista.startsWith(
          "0"
        )
      ) {
        telefonoTaxista =
          "593" +
          telefonoTaxista.substring(
            1
          );
      }


      await enviarTextoWhatsApp(
        carrera.whatsappCliente,

        `💬 Escribe directamente a tu taxista:\nhttps://wa.me/${telefonoTaxista}`
      );
    }


    /*
      La conversación pasa a
      carrera activa.
    */

    await prisma
      .conversacionWhatsApp
      .updateMany({
        where: {
          telefono:
            carrera.whatsappCliente,
        },

        data: {
          estado:
            "CARRERA_ACTIVA",

          carreraId:
            carrera.id,
        },
      });

  } catch (error) {

    console.error(
      "Carrera asignada correctamente, pero no se pudo notificar al cliente por WhatsApp:",
      error
    );
  }


  /*
    Respuesta para la pantalla
    del taxista ganador.
  */

  return {
    carrera: {
      numero:
        carrera.numero,

      referencia:
        carrera.referencia,

      formaPago:
        carrera.formaPago,

      enlaceWhatsapp,
    },

    taxista: {
      codigo:
        taxista.codigo,

      nombre:
        taxista.nombre,

      placa:
        taxista.placa,

      vehiculo:
        taxista.vehiculo,

      colorVehiculo:
        taxista.colorVehiculo,

      cooperativa:
        taxista.cooperativa,

      telefono:
        taxista.telefono,
    },
  };
}


export async function listarCarrerasAdmin() {
  return prisma.carrera.findMany({
    orderBy: {
      fechaCreacion:
        "desc",
    },

    include: {
      cliente:
        true,

      taxista: {
        select: {
          id:
            true,

          codigo:
            true,

          nombre:
            true,

          placa:
            true,

          vehiculo:
            true,

          colorVehiculo:
            true,

          cooperativa:
            true,

          telefono:
            true,

          activo:
            true,
        },
      },
    },
  });
}