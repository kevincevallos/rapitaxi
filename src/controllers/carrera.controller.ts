import {
  Request,
  Response,
} from "express";

import {
  crearCarrera,
  cancelarCarreraAdmin,
  obtenerCarreraPublica,
  aceptarCarrera,
  listarCarrerasAdmin,
  obtenerCarreraActivaTaxista,
  actualizarUbicacionTaxista,
  finalizarCarreraTaxista,
  obtenerSeguimientoPublico,
  marcarLlegadaTaxista,
} from "../services/carrera.service";

import {
  prisma,
} from "../config/prisma";


function calcularDistanciaKm(
  latitudOrigen: number,
  longitudOrigen: number,
  latitudDestino: number,
  longitudDestino: number
) {
  const radioTierraKm = 6371;

  const aRadianes =
    (grados: number) =>
      grados * Math.PI / 180;

  const diferenciaLatitud =
    aRadianes(latitudDestino - latitudOrigen);

  const diferenciaLongitud =
    aRadianes(longitudDestino - longitudOrigen);

  const latitudOrigenRad =
    aRadianes(latitudOrigen);

  const latitudDestinoRad =
    aRadianes(latitudDestino);

  const haversine =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(latitudOrigenRad) *
    Math.cos(latitudDestinoRad) *
    Math.sin(diferenciaLongitud / 2) ** 2;

  const angulo =
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    );

  return radioTierraKm * angulo;
}


async function guardarUltimaUbicacionTaxista(
  codigoTaxista: string,
  latitud: number,
  longitud: number
) {
  const codigo =
    String(codigoTaxista || "")
      .replace(/\D/g, "")
      .padStart(3, "0");

  if (
    !codigo ||
    codigo === "000" ||
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud) ||
    latitud < -90 ||
    latitud > 90 ||
    longitud < -180 ||
    longitud > 180
  ) {
    return;
  }

  try {
    await prisma.taxista.updateMany({
      where: {
        codigo,
        activo: true,
      },
      data: {
        ultimaLatitud: latitud,
        ultimaLongitud: longitud,
        fechaUltimaUbicacion: new Date(),
      },
    });
  } catch (error) {
    console.error(
      "No se pudo guardar la última ubicación general del taxista:",
      error
    );
  }
}


/*
  ========================================
  DASHBOARD ADMIN - UTILIDADES
  ========================================

  Ecuador continental utiliza UTC-5 todo el año.
  Convertimos los límites de día de Ecuador a UTC
  antes de consultar SQLite/Prisma.
*/

type PeriodoDashboard =
  | "hoy"
  | "ayer"
  | "7d"
  | "30d";

const HORA_ECUADOR_MS =
  5 * 60 * 60 * 1000;

function inicioDiaEcuadorUtc(
  fecha: Date
) {
  const localEcuador =
    new Date(
      fecha.getTime() -
      HORA_ECUADOR_MS
    );

  return new Date(
    Date.UTC(
      localEcuador.getUTCFullYear(),
      localEcuador.getUTCMonth(),
      localEcuador.getUTCDate()
    ) + HORA_ECUADOR_MS
  );
}

function obtenerRangoDashboard(
  periodo: PeriodoDashboard,
  ahora = new Date()
) {
  const inicioHoy =
    inicioDiaEcuadorUtc(ahora);

  let inicio: Date;
  let fin: Date;

  if (periodo === "ayer") {
    inicio = new Date(
      inicioHoy.getTime() -
      24 * 60 * 60 * 1000
    );
    fin = inicioHoy;

  } else if (periodo === "7d") {
    inicio = new Date(
      inicioHoy.getTime() -
      6 * 24 * 60 * 60 * 1000
    );
    fin = ahora;

  } else if (periodo === "30d") {
    inicio = new Date(
      inicioHoy.getTime() -
      29 * 24 * 60 * 60 * 1000
    );
    fin = ahora;

  } else {
    inicio = inicioHoy;
    fin = ahora;
  }

  const duracion =
    fin.getTime() -
    inicio.getTime();

  const inicioAnterior =
    new Date(
      inicio.getTime() -
      duracion
    );

  return {
    inicio,
    fin,
    inicioAnterior,
    finAnterior: inicio,
  };
}

function horaEcuador(
  fecha: Date
) {
  const texto =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Guayaquil",
        hour:
          "2-digit",
        hour12:
          false,
      }
    ).format(fecha);

  return Number(texto) % 24;
}

function variacionPorcentual(
  actual: number,
  anterior: number
) {
  if (anterior === 0) {
    return actual === 0
      ? 0
      : null;
  }

  return Math.round(
    ((actual - anterior) /
      anterior) *
    1000
  ) / 10;
}

function esEstadoActivoDashboard(
  estado: string
) {
  return [
    "BUSCANDO",
    "ASIGNADA",
    "EN_CAMINO",
    "CERCA",
    "LLEGO",
  ].includes(estado);
}

function resumenCarrerasDashboard(
  carreras: Array<{
    estado: string;
    whatsappCliente: string;
    taxistaId: number | null;
    calificacion: string | null;
  }>
) {
  const solicitudes =
    carreras.length;

  const completadas =
    carreras.filter(
      carrera =>
        carrera.estado ===
        "COMPLETADA"
    ).length;

  const canceladas =
    carreras.filter(
      carrera =>
        carrera.estado ===
        "CANCELADA"
    ).length;

  const activas =
    carreras.filter(
      carrera =>
        esEstadoActivoDashboard(
          carrera.estado
        )
    ).length;

  const clientesAtendidos =
    new Set(
      carreras
        .filter(
          carrera =>
            carrera.estado ===
            "COMPLETADA"
        )
        .map(
          carrera =>
            carrera.whatsappCliente
        )
    ).size;

  const taxistasTrabajaron =
    new Set(
      carreras
        .filter(
          carrera =>
            carrera.taxistaId !==
            null
        )
        .map(
          carrera =>
            carrera.taxistaId
        )
    ).size;

  return {
    solicitudes,
    completadas,
    canceladas,
    activas,
    clientesAtendidos,
    taxistasTrabajaron,
    porcentajeFinalizacion:
      solicitudes > 0
        ? Math.round(
          (completadas /
            solicitudes) *
          1000
        ) / 10
        : 0,
  };
}


export async function crearCarreraController(
  req: Request,
  res: Response
) {
  try {
    const {
      nombreCliente,
      whatsappCliente,
      latitud,
      longitud,
      referencia,
      formaPago,
    } = req.body;


    if (
      !nombreCliente ||
      !whatsappCliente ||
      latitud === undefined ||
      longitud === undefined ||
      !referencia ||
      !formaPago
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Faltan datos para crear la carrera.",
      });
    }


    const carrera =
      await crearCarrera({
        nombreCliente:
          String(nombreCliente),

        whatsappCliente:
          String(whatsappCliente),

        latitud:
          Number(latitud),

        longitud:
          Number(longitud),

        referencia:
          String(referencia),

        formaPago:
          String(formaPago),
      });


    return res.status(201).json({
      success: true,
      carrera,
    });

  } catch (error) {

    console.error(
      "Error creando carrera:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudo crear la carrera.",
    });
  }
}


/*
  ========================================
  APP TAXISTAS - DISPONIBLES
  ========================================
*/

export async function listarCarrerasDisponiblesAppController(
  req: Request,
  res: Response
) {
  try {

    const codigoTaxista =
      String(
        req.query.codigoTaxista ||
        ""
      )
        .replace(/\D/g, "")
        .padStart(3, "0");


    const latitudTaxista =
      Number(
        req.query.latitud
      );


    const longitudTaxista =
      Number(
        req.query.longitud
      );


    const tieneGpsValido =
      req.query.latitud !== undefined &&
      req.query.longitud !== undefined &&
      Number.isFinite(latitudTaxista) &&
      Number.isFinite(longitudTaxista) &&
      latitudTaxista >= -90 &&
      latitudTaxista <= 90 &&
      longitudTaxista >= -180 &&
      longitudTaxista <= 180;


    let taxistaValido =
      false;


    if (
      codigoTaxista &&
      codigoTaxista !== "000"
    ) {
      const taxista =
        await prisma.taxista.findUnique({
          where: {
            codigo:
              codigoTaxista,
          },

          select: {
            id: true,
            activo: true,
          },
        });


      taxistaValido =
        Boolean(
          taxista?.activo
        );

      if (
        taxistaValido &&
        tieneGpsValido
      ) {
        await guardarUltimaUbicacionTaxista(
          codigoTaxista,
          latitudTaxista,
          longitudTaxista
        );
      }
    }


    const carreras =
      await prisma.carrera.findMany({
        where: {
          estado:
            "BUSCANDO",
        },

        orderBy: {
          fechaCreacion:
            "desc",
        },

        select: {
          id: true,
          numero: true,
          token: true,
          referencia: true,
          formaPago: true,
          fechaCreacion: true,
          latitud: true,
          longitud: true,
        },
      });


    const carrerasConDistancia =
      carreras
        .map(
          carrera => {

            let distanciaKm:
              number | null =
              null;


            if (
              tieneGpsValido &&
              taxistaValido &&
              Number.isFinite(carrera.latitud) &&
              Number.isFinite(carrera.longitud)
            ) {
              const distancia =
                calcularDistanciaKm(
                  latitudTaxista,
                  longitudTaxista,
                  carrera.latitud,
                  carrera.longitud
                );


              distanciaKm =
                Math.round(
                  distancia * 100
                ) / 100;
            }


            return {
              id:
                carrera.id,

              numero:
                carrera.numero,

              token:
                carrera.token,

              referencia:
                carrera.referencia,

              formaPago:
                carrera.formaPago,

              fechaCreacion:
                carrera.fechaCreacion,

              distanciaKm,
            };
          }
        )
        .sort(
          (
            a,
            b
          ) => {

            /*
              Si ambos tienen distancia,
              siempre mostramos primero la
              carrera más cercana a ESTE
              taxista.
            */
            if (
              typeof a.distanciaKm ===
              "number" &&
              typeof b.distanciaKm ===
              "number"
            ) {
              const diferencia =
                a.distanciaKm -
                b.distanciaKm;


              if (
                Math.abs(
                  diferencia
                ) > 0.001
              ) {
                return diferencia;
              }
            }


            /*
              Una carrera con distancia válida
              va antes que una sin distancia.
            */
            if (
              typeof a.distanciaKm ===
              "number" &&
              typeof b.distanciaKm !==
              "number"
            ) {
              return -1;
            }


            if (
              typeof a.distanciaKm !==
              "number" &&
              typeof b.distanciaKm ===
              "number"
            ) {
              return 1;
            }


            /*
              Empate de distancia, o APK vieja
              sin GPS: conservamos prioridad a
              la solicitud más reciente.
            */
            return (
              new Date(
                b.fechaCreacion
              ).getTime() -
              new Date(
                a.fechaCreacion
              ).getTime()
            );
          }
        );


    return res.json({
      success:
        true,

      carreras:
        carrerasConDistancia,
    });

  } catch (error) {

    console.error(
      "Error cargando carreras disponibles para app:",
      error
    );


    return res.status(500).json({
      success:
        false,

      message:
        "No se pudieron cargar las carreras disponibles.",
    });
  }
}


/*
  ========================================
  APP TAXISTAS - CARRERA ACTIVA
  ========================================
*/

export async function obtenerCarreraActivaTaxistaController(
  req: Request,
  res: Response
) {
  try {

    const codigoTaxista =
      String(
        req.params.codigoTaxista || ""
      );


    const carrera =
      await obtenerCarreraActivaTaxista(
        codigoTaxista
      );


    return res.json({
      success: true,
      carrera,
    });

  } catch (error: any) {

    console.error(
      "Error obteniendo carrera activa:",
      error
    );


    if (
      error?.message ===
      "CODIGO_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El código de conductor no es válido.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El taxista no existe.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_INACTIVO"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Este taxista se encuentra inactivo.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "No se pudo consultar la carrera activa.",
    });
  }
}


/*
  ========================================
  APP TAXISTAS - GPS
  ========================================
*/

export async function actualizarUbicacionTaxistaController(
  req: Request,
  res: Response
) {
  try {

    const carreraId =
      Number(
        req.params.id
      );


    const codigoTaxista =
      String(
        req.body.codigoTaxista || ""
      );


    const latitud =
      Number(
        req.body.latitud
      );


    const longitud =
      Number(
        req.body.longitud
      );


    if (
      !Number.isInteger(carreraId) ||
      carreraId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "ID de carrera inválido.",
      });
    }


    if (!codigoTaxista) {
      return res.status(400).json({
        success: false,
        message:
          "Falta identificar al taxista.",
      });
    }


    if (
      req.body.latitud === undefined ||
      req.body.longitud === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Falta la ubicación del taxista.",
      });
    }


    const carrera =
      await actualizarUbicacionTaxista(
        carreraId,
        codigoTaxista,
        latitud,
        longitud
      );


    await guardarUltimaUbicacionTaxista(
      codigoTaxista,
      latitud,
      longitud
    );


    return res.json({
      success: true,
      message:
        "Ubicación actualizada.",
      carrera,
    });

  } catch (error: any) {

    console.error(
      "Error actualizando ubicación del taxista:",
      error
    );


    if (
      error?.message ===
      "CODIGO_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El código de conductor no es válido.",
      });
    }


    if (
      error?.message ===
      "UBICACION_INVALIDA"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La ubicación recibida no es válida.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El taxista no existe.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_INACTIVO"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Este taxista se encuentra inactivo.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_PERTENECE_TAXISTA"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Esta carrera no pertenece a este taxista.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_ACTIVA"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "La carrera ya no está activa.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "No se pudo actualizar la ubicación.",
    });
  }
}


/*
  ========================================
  APP TAXISTAS - FINALIZAR
  ========================================
*/

export async function finalizarCarreraTaxistaController(
  req: Request,
  res: Response
) {
  try {

    const carreraId =
      Number(
        req.params.id
      );


    const codigoTaxista =
      String(
        req.body.codigoTaxista || ""
      );


    if (
      !Number.isInteger(carreraId) ||
      carreraId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "ID de carrera inválido.",
      });
    }


    if (!codigoTaxista) {
      return res.status(400).json({
        success: false,
        message:
          "Falta identificar al taxista.",
      });
    }


    const carrera =
      await finalizarCarreraTaxista(
        carreraId,
        codigoTaxista
      );


    return res.json({
      success: true,
      message:
        "Carrera finalizada correctamente.",
      carrera,
    });

  } catch (error: any) {

    console.error(
      "Error finalizando carrera desde app:",
      error
    );


    if (
      error?.message ===
      "CODIGO_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El código de conductor no es válido.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El taxista no existe.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_INACTIVO"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Este taxista se encuentra inactivo.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_PERTENECE_TAXISTA"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Esta carrera no pertenece a este taxista.",
      });
    }


    if (
      error?.message ===
      "CARRERA_YA_CERRADA"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "La carrera ya está finalizada o cancelada.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "No se pudo finalizar la carrera.",
    });
  }
}
export async function marcarLlegadaTaxistaController(
  req: Request,
  res: Response
) {
  try {

    const carreraId =
      Number(
        req.params.id
      );


    if (
      !Number.isInteger(
        carreraId
      ) ||
      carreraId <= 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Carrera inválida.",
      });
    }


    const codigoTaxista =
      String(
        req.body.codigoTaxista ||
        ""
      );


    if (
      !codigoTaxista.trim()
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Falta el código del taxista.",
      });
    }


    const resultado =
      await marcarLlegadaTaxista(
        carreraId,
        codigoTaxista
      );


    return res.json({
      success: true,
      carrera:
        resultado,
    });

  } catch (error: any) {

    console.error(
      "Error marcando llegada del taxista:",
      error
    );


    if (
      error?.message ===
      "TAXISTA_NO_EXISTE"
    ) {

      return res.status(404).json({
        success: false,
        message:
          "Taxista no encontrado.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_INACTIVO"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "El taxista está inactivo.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_EXISTE"
    ) {

      return res.status(404).json({
        success: false,
        message:
          "Carrera no encontrada.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_PERTENECE_TAXISTA"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "La carrera no pertenece a este taxista.",
      });
    }


    if (
      error?.message ===
      "CARRERA_YA_CERRADA"
    ) {

      return res.status(409).json({
        success: false,
        message:
          "La carrera ya está cerrada.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_ACTIVA"
    ) {

      return res.status(409).json({
        success: false,
        message:
          "La carrera ya no está activa.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "No se pudo marcar la llegada.",
    });
  }
}

/*
  ========================================
  CARRERA PÚBLICA
  ========================================
*/

export async function obtenerCarreraController(
  req: Request,
  res: Response
) {
  try {

    const token =
      String(
        req.params.token || ""
      );


    const carrera =
      await obtenerCarreraPublica(
        token
      );


    if (!carrera) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    return res.json({
      success: true,
      carrera,
    });

  } catch (error) {

    console.error(
      "Error obteniendo carrera:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudo cargar la carrera.",
    });
  }
}


export async function aceptarCarreraController(
  req: Request,
  res: Response
) {
  try {

    const token =
      String(
        req.params.token || ""
      );


    const codigoTaxista =
      String(
        req.body.codigoTaxista || ""
      );


    if (!codigoTaxista) {
      return res.status(400).json({
        success: false,
        message:
          "Debes ingresar tu código de conductor.",
      });
    }


    const respuesta =
      await aceptarCarrera(
        token,
        codigoTaxista
      );


    return res.json({
      success: true,

      message:
        "Carrera asignada correctamente.",

      carrera:
        respuesta.carrera,

      taxista:
        respuesta.taxista,
    });

  } catch (error: any) {

    console.error(
      "Error aceptando carrera:",
      error
    );


    if (
      error?.message ===
      "CODIGO_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El código de conductor no es válido.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El código no corresponde a un taxista registrado.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_INACTIVO"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Este taxista se encuentra inactivo.",
      });
    }


    if (
      error?.message ===
      "TAXISTA_OCUPADO"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Ya tienes una carrera activa. Finalízala antes de aceptar otra.",
      });
    }


    if (
      error?.message ===
      "CARRERA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    if (
      error?.message ===
      "YA_ASIGNADA"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Esta carrera ya fue asignada a otro taxista.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "No se pudo aceptar la carrera.",
    });
  }
}


/*
  ========================================
  ADMIN
  ========================================
*/

export async function listarCarrerasAdminController(
  _req: Request,
  res: Response
) {
  try {

    const carreras =
      await listarCarrerasAdmin();


    return res.json({
      success: true,
      carreras,
    });

  } catch (error) {

    console.error(
      "Error listando carreras:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudieron cargar las carreras.",
    });
  }
}



/*
  ========================================
  ADMIN - DASHBOARD ESTADÍSTICO
  ========================================
*/
export async function obtenerDashboardAdminController(
  req: Request,
  res: Response
) {
  try {
    const periodoSolicitado =
      String(
        req.query.periodo ||
        "hoy"
      ).toLowerCase();

    const periodosValidos:
      PeriodoDashboard[] = [
        "hoy",
        "ayer",
        "7d",
        "30d",
      ];

    const periodo =
      periodosValidos.includes(
        periodoSolicitado as
        PeriodoDashboard
      )
        ? periodoSolicitado as
        PeriodoDashboard
        : "hoy";

    const rango =
      obtenerRangoDashboard(
        periodo
      );

    const [
      carreras,
      carrerasAnteriores,
      taxistasParaConexion,
      totalTaxistasActivos,
    ] = await Promise.all([

      prisma.carrera.findMany({
        where: {
          fechaCreacion: {
            gte: rango.inicio,
            lt: rango.fin,
          },
        },
        orderBy: {
          fechaCreacion:
            "desc",
        },
        select: {
          id: true,
          numero: true,
          estado: true,
          nombreCliente: true,
          whatsappCliente: true,
          referencia: true,
          formaPago: true,
          fechaCreacion: true,
          fechaAceptacion: true,
          fechaLlegada: true,
          fechaFin: true,
          calificacion: true,
          canceladaPor: true,
          taxistaId: true,
          taxista: {
            select: {
              codigo: true,
              nombre: true,
              placa: true,
            },
          },
        },
      }),

      prisma.carrera.findMany({
        where: {
          fechaCreacion: {
            gte:
              rango.inicioAnterior,
            lt:
              rango.finAnterior,
          },
        },
        select: {
          estado: true,
          whatsappCliente: true,
          taxistaId: true,
          calificacion: true,
        },
      }),

      prisma.taxista.findMany({
        where: {
          activo: true,
        },
        select: {
          id: true,
          fechaUltimaUbicacion: true,
          dispositivos: {
            select: {
              activo: true,
              enLinea: true,
            },
          },
        },
      }),

      prisma.taxista.count({
        where: {
          activo: true,
        },
      }),
    ]);

    const resumen =
      resumenCarrerasDashboard(
        carreras
      );

    const resumenAnterior =
      resumenCarrerasDashboard(
        carrerasAnteriores
      );

    const limiteConexion =
      Date.now() -
      90 * 1000;

    const taxistasEnLinea =
      taxistasParaConexion.filter(
        taxista => {
          const dispositivo =
            taxista.dispositivos[0];

          return Boolean(
            dispositivo?.activo &&
            dispositivo?.enLinea &&
            taxista.fechaUltimaUbicacion &&
            new Date(
              taxista.fechaUltimaUbicacion
            ).getTime() >= limiteConexion
          );
        }
      ).length;

    const porHora =
      Array.from(
        { length: 24 },
        (_, hora) => ({
          hora,
          etiqueta:
            `${String(hora)
              .padStart(2, "0")}:00`,
          solicitudes: 0,
          completadas: 0,
        })
      );

    for (
      const carrera
      of carreras
    ) {
      const hora =
        horaEcuador(
          carrera.fechaCreacion
        );

      porHora[hora].solicitudes++;

      if (
        carrera.estado ===
        "COMPLETADA"
      ) {
        porHora[hora].completadas++;
      }
    }

    const calificaciones = {
      excelente: 0,
      bueno: 0,
      malo: 0,
      total: 0,
      promedio: null as
        number | null,
    };

    let sumaCalificacion = 0;

    for (
      const carrera
      of carreras
    ) {
      if (
        carrera.calificacion ===
        "Excelente"
      ) {
        calificaciones.excelente++;
        sumaCalificacion += 5;

      } else if (
        carrera.calificacion ===
        "Bueno"
      ) {
        calificaciones.bueno++;
        sumaCalificacion += 3;

      } else if (
        carrera.calificacion ===
        "Malo"
      ) {
        calificaciones.malo++;
        sumaCalificacion += 1;
      }
    }

    calificaciones.total =
      calificaciones.excelente +
      calificaciones.bueno +
      calificaciones.malo;

    if (
      calificaciones.total > 0
    ) {
      calificaciones.promedio =
        Math.round(
          (sumaCalificacion /
            calificaciones.total) *
          10
        ) / 10;
    }

    const comparacion = {
      solicitudes:
        variacionPorcentual(
          resumen.solicitudes,
          resumenAnterior.solicitudes
        ),
      completadas:
        variacionPorcentual(
          resumen.completadas,
          resumenAnterior.completadas
        ),
      canceladas:
        variacionPorcentual(
          resumen.canceladas,
          resumenAnterior.canceladas
        ),
    };

    const ultimasCarreras =
      carreras
        .slice(0, 8)
        .map(
          carrera => ({
            id:
              carrera.id,
            numero:
              carrera.numero,
            estado:
              carrera.estado,
            cliente:
              carrera.nombreCliente,
            referencia:
              carrera.referencia,
            fechaCreacion:
              carrera.fechaCreacion,
            taxista:
              carrera.taxista
                ? {
                  codigo:
                    carrera.taxista.codigo,
                  nombre:
                    carrera.taxista.nombre,
                  placa:
                    carrera.taxista.placa,
                }
                : null,
          })
        );

    return res.json({
      success: true,
      periodo,
      zonaHoraria:
        "America/Guayaquil",
      rango: {
        inicio:
          rango.inicio,
        fin:
          rango.fin,
      },
      metricas: {
        ...resumen,
        taxistasEnLinea,
        totalTaxistasActivos,
        calificacionPromedio:
          calificaciones.promedio,
        calificacionesRecibidas:
          calificaciones.total,
      },
      comparacion,
      calificaciones,
      escalaCalificacion: {
        Excelente: 5,
        Bueno: 3,
        Malo: 1,
      },
      porHora,
      ultimasCarreras,
    });

  } catch (error) {
    console.error(
      "Error cargando dashboard admin:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "No se pudo cargar el dashboard.",
    });
  }
}


export async function cancelarCarreraAdminController(
  req: Request,
  res: Response
) {

  const carreraId =
    Number(
      req.params.id
    );


  if (
    !Number.isInteger(carreraId) ||
    carreraId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "ID de carrera inválido.",
    });
  }


  try {

    const resultado =
      await cancelarCarreraAdmin(
        carreraId
      );


    return res.json({
      success: true,
      message:
        "Carrera cancelada correctamente.",
      carrera:
        resultado,
    });


  } catch (error: any) {

    if (
      error.message ===
      "CARRERA_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "La carrera no existe.",
      });
    }


    if (
      error.message ===
      "CARRERA_YA_CERRADA"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "La carrera ya está completada o cancelada.",
      });
    }


    console.error(
      "Error cancelando carrera desde admin:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudo cancelar la carrera.",
    });
  }
}
/*
  ========================================
  SEGUIMIENTO PUBLICO
  ========================================
*/

export async function obtenerSeguimientoPublicoController(
  req: Request,
  res: Response
) {
  try {

    const trackingToken =
      String(
        req.params.trackingToken || ""
      );


    const seguimiento =
      await obtenerSeguimientoPublico(
        trackingToken
      );


    return res.json({
      success: true,
      seguimiento,
    });

  } catch (error: any) {

    if (
      error?.message ===
      "TRACKING_TOKEN_INVALIDO"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enlace de seguimiento inválido.",
      });
    }


    if (
      error?.message ===
      "SEGUIMIENTO_NO_EXISTE"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "El seguimiento no existe.",
      });
    }


    console.error(
      "Error obteniendo seguimiento:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "No se pudo cargar el seguimiento.",
    });
  }
}