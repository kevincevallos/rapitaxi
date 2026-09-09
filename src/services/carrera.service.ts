import crypto from "crypto";

import { prisma } from "../config/prisma";

import {
    enviarBotonesWhatsApp,
    enviarTextoWhatsApp,
} from "./whatsapp.service";


/*
  ========================================
  TIPOS
  ========================================
*/

interface CrearCarreraInput {
    nombreCliente: string;
    whatsappCliente: string;

    latitud: number;
    longitud: number;

    referencia: string;
    formaPago: string;
}


/*
  ========================================
  UTILIDADES
  ========================================
*/

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


function normalizarTelefono(
    telefono: string
) {
    const limpio =
        String(telefono || "")
            .replace(/\D/g, "");


    /*
      Si ya viene como:
      59399...
    */
    if (
        limpio.startsWith("593")
    ) {
        return limpio;
    }


    /*
      Si viene como:
      099...
    */
    if (
        limpio.startsWith("0")
    ) {
        return (
            "593" +
            limpio.substring(1)
        );
    }


    return limpio;
}


/*
  Convierte cualquier texto saliente de WhatsApp
  a caracteres ASCII seguros.

  Esto evita problemas de codificacion con emojis,
  tildes o caracteres especiales en produccion.
*/
function textoSeguroWhatsApp(
    valor: unknown
) {
    return String(
        valor ?? ""
    )
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7E\n\r\t]/g, "");
}


/*
  ========================================
  CREAR CARRERA
  ========================================
*/

export async function crearCarrera(
    data: CrearCarreraInput
) {
    const ultimaCarrera =
        await prisma.carrera.findFirst({
            orderBy: {
                numero: "desc",
            },

            select: {
                numero: true,
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


    return prisma.carrera.create({
        data: {
            numero,
            token,

            nombreCliente:
                data.nombreCliente.trim(),

            whatsappCliente:
                normalizarTelefono(
                    data.whatsappCliente
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
}


/*
  ========================================
  INFORMACIÓN PÚBLICA
  ========================================

  Esta es la información que ve el
  taxista antes de aceptar.
  No exponemos el teléfono del cliente.
*/

export async function obtenerCarreraPublica(
    token: string
) {
    return prisma.carrera.findUnique({
        where: {
            token,
        },

        select: {
            numero: true,
            referencia: true,
            formaPago: true,
            estado: true,
            fechaCreacion: true,
        },
    });
}


/*
  ========================================
  ACEPTAR CARRERA
  ========================================
*/

export async function aceptarCarrera(
    token: string,
    codigoTaxista: string
) {
    const codigo =
        normalizarCodigoTaxista(
            codigoTaxista
        );


    /*
      Buscar taxista por su código único.
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
      ========================================
      ACEPTACIÓN SEGURA DE CARRERA
      ========================================

      Reglas:

      1. Un taxista solamente puede tener
         UNA carrera activa.

      2. Solamente el primer taxista puede
         aceptar una carrera BUSCANDO.

      Ambas comprobaciones se hacen dentro
      de una transacción.
    */

    await prisma.$transaction(
        async tx => {

            /*
              Primero comprobamos si este
              taxista ya tiene una carrera
              activa.
            */

            const carreraActiva =
                await tx.carrera.findFirst({
                    where: {
                        taxistaId:
                            taxista.id,

                        fechaFin:
                            null,

                        estado: {
                            in: [
                                "ASIGNADA",
                                "EN_CAMINO",
                                "CERCA",
                                "LLEGO",
                            ],
                        },
                    },

                    select: {
                        id: true,
                        numero: true,
                        estado: true,
                    },
                });


            if (carreraActiva) {
                throw new Error(
                    "TAXISTA_OCUPADO"
                );
            }


            /*
              Ahora intentamos adjudicar
              esta carrera.

              updateMany garantiza que solo
              se modifica si todavía está
              BUSCANDO.
            */

            const resultado =
                await tx.carrera.updateMany({
                    where: {
                        token,
                        estado:
                            "BUSCANDO",
                    },

                    data: {
                        estado:
                            "ASIGNADA",

                        taxistaId:
                            taxista.id,

                        fechaAceptacion:
                            new Date(),

                        trackingToken:
                            crypto
                                .randomBytes(24)
                                .toString("hex"),
                    },
                });


            /*
              Si count = 0:

              - la carrera no existe, o
              - otro taxista ya la aceptó.
            */

            if (
                resultado.count === 0
            ) {

                const carreraExistente =
                    await tx.carrera.findUnique({
                        where: {
                            token,
                        },
                    });


                if (!carreraExistente) {
                    throw new Error(
                        "CARRERA_NO_EXISTE"
                    );
                }


                throw new Error(
                    "YA_ASIGNADA"
                );
            }

        }
    );


    /*
      Recuperamos la carrera ya asignada.
    */

    const carrera =
        await prisma.carrera.findUnique({
            where: {
                token,
            },

            include: {
                taxista: true,
            },
        });


    if (!carrera) {
        throw new Error(
            "CARRERA_NO_EXISTE"
        );
    }


    /*
      ========================================
      NOTIFICAR AL CLIENTE
      ========================================
  
      Aquí NO enviamos todavía datos
      bancarios.
  
      El taxista ya aceptó y el cliente
      recibe los datos del vehículo.
    */

    const publicUrl =
        String(
            process.env.PUBLIC_URL ||
            "http://localhost:3000"
        )
            .replace(/\/+$/, "");


    const enlaceSeguimiento =
        carrera.trackingToken &&
            publicUrl

            ? `${publicUrl}/seguimiento.html?token=${carrera.trackingToken}`

            : null;

    const descripcionVehiculo =
        [
            taxista.vehiculo,
            taxista.colorVehiculo,
        ]
            .filter(Boolean)
            .join(" ");


    let mensajeCliente =

        `Ok ${taxista.nombre} ira a recogerte.\n` +

        `Vehiculo: ${descripcionVehiculo}\n` +

        `Placa: ${taxista.placa}\n` +

        `WhatsApp: ${taxista.telefono || "No registrado"}\n` +

        `Pago: ${carrera.formaPago}` +

        (
            enlaceSeguimiento
                ? `\n\nSigue la llegada de tu taxi aqui:\n${enlaceSeguimiento}`
                : ""
        );

    if (
        taxista.cooperativa
    ) {
        mensajeCliente +=

            `\nCoop: ${taxista.cooperativa}`;
    }


    /*
      ========================================
      DATOS DE TRANSFERENCIA
      ========================================
    */

    if (
        carrera.formaPago ===
        "Transferencia Banco Pichincha"
    ) {
        mensajeCliente +=

            `\n\nBanco Pichincha`;


        if (
            taxista.titularPichincha
        ) {
            mensajeCliente +=

                `\nTitular: ${taxista.titularPichincha}`;
        }


        if (
            taxista.cuentaPichincha
        ) {
            mensajeCliente +=

                `\nCuenta: ${taxista.cuentaPichincha}`;
        }
    }


    if (
        carrera.formaPago ===
        "Transferencia Banco Guayaquil"
    ) {
        mensajeCliente +=

            `\n\nBanco Guayaquil`;


        if (
            taxista.titularGuayaquil
        ) {
            mensajeCliente +=

                `\nTitular: ${taxista.titularGuayaquil}`;
        }


        if (
            taxista.cuentaGuayaquil
        ) {
            mensajeCliente +=

                `\nCuenta: ${taxista.cuentaGuayaquil}`;
        }
    }

    /*
      Intentamos enviar WhatsApp.
  
      Si WhatsApp tiene un problema,
      NO deshacemos la aceptación.
    */

    try {
        await enviarTextoWhatsApp(
            carrera.whatsappCliente,
            textoSeguroWhatsApp(
                mensajeCliente
            )
        );

    } catch (error) {

        console.error(
            "Error notificando al cliente después de aceptar carrera:",
            error
        );
    }


    /*
      ========================================
      ENLACE PARA ESCRIBIR AL CLIENTE
      ========================================
    */

    const telefonoCliente =
        normalizarTelefono(
            carrera.whatsappCliente
        );


    const mensajeParaCliente =
        encodeURIComponent(
            textoSeguroWhatsApp(
                `Hola ${carrera.nombreCliente}, soy ${taxista.nombre}, el taxista asignado a tu carrera #${carrera.numero}.`
            )
        );


    const enlaceWhatsAppCliente =
        `https://wa.me/${telefonoCliente}?text=${mensajeParaCliente}`;


    /*
      ========================================
      ACTUALIZAR CONVERSACIÓN DEL CLIENTE
      ========================================
    */

    try {
        await prisma
            .conversacionWhatsApp
            .updateMany({

                where: {
                    telefono:
                        telefonoCliente,
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
            "Error actualizando conversación del cliente:",
            error
        );
    }


    /*
      ========================================
      RESPUESTA PARA LA PÁGINA DEL TAXISTA
      ========================================
    */


    return {
        carrera: {
            id:
                carrera.id,

            numero:
                carrera.numero,

            estado:
                carrera.estado,

            nombreCliente:
                carrera.nombreCliente,

            referencia:
                carrera.referencia,

            formaPago:
                carrera.formaPago,

            whatsappCliente:
                carrera.whatsappCliente,

            enlaceWhatsAppCliente,
            enlaceSeguimiento,
            latitud: carrera.latitud,
            longitud: carrera.longitud,
            enlaceGoogleMaps:
                `https://www.google.com/maps/dir/?api=1&destination=${carrera.latitud},${carrera.longitud}`,
        },

        taxista: {
            id:
                taxista.id,

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


/*
  ========================================
  FINALIZACIÓN AUTOMÁTICA
  ========================================

  Esta función será llamada por server.ts.

  Busca carreras que fueron aceptadas
  hace 30 minutos o más.

  Luego:

  1. Marca la carrera COMPLETADA.
  2. Guarda fechaFin.
  3. Libera inmediatamente al cliente.
  4. Envía la calificación como algo
     OPCIONAL.

  Aunque el cliente nunca califique,
  podrá solicitar otro taxi.
  ========================================
*/

export async function finalizarCarrerasVencidas() {
    const ahora =
        new Date();


    const limite =
        new Date(
            ahora.getTime() -
            30 * 60 * 1000
        );


    /*
      Buscamos cualquier carrera activa
      que ya haya cumplido los 30 minutos.
    */

    const carreras =
        await prisma.carrera.findMany({
            where: {
                fechaAceptacion: {
                    lte: limite,
                },

                fechaFin: null,

                estado: {
                    in: [
                        "ASIGNADA",
                        "EN_CAMINO",
                        "CERCA",
                        "LLEGO",
                    ],
                },
            },

            include: {
                taxista: true,
            },
        });


    if (
        carreras.length === 0
    ) {
        return 0;
    }


    let finalizadas = 0;


    for (
        const carrera
        of carreras
    ) {
        try {

            /*
              Volvemos a comprobar el estado
              mediante updateMany.
      
              Esto evita que dos ejecuciones
              del temporizador finalicen la
              misma carrera dos veces.
            */

            const resultado =
                await prisma.carrera.updateMany({
                    where: {
                        id:
                            carrera.id,

                        fechaFin:
                            null,

                        estado: {
                            in: [
                                "ASIGNADA",
                                "EN_CAMINO",
                                "CERCA",
                                "LLEGO",
                            ],
                        },
                    },

                    data: {
                        estado:
                            "COMPLETADA",

                        fechaFin:
                            new Date(),
                    },
                });


            if (
                resultado.count === 0
            ) {
                continue;
            }


            finalizadas++;


            /*
              ==================================
              LIBERAR CLIENTE PRIMERO
              ==================================
      
              Esto es lo más importante.
      
              No esperamos a que califique.
            */

            const telefonoCliente =
                normalizarTelefono(
                    carrera.whatsappCliente
                );


            try {
                await prisma
                    .conversacionWhatsApp
                    .updateMany({

                        where: {
                            telefono:
                                telefonoCliente,
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

            } catch (error) {

                console.error(
                    `Error liberando conversación de carrera #${carrera.numero}:`,
                    error
                );
            }


            /*
              ==================================
              ENVIAR CALIFICACIÓN OPCIONAL
              ==================================
      
              El ID de la carrera va dentro
              del ID del botón.
      
              Así podremos saber después qué
              carrera está calificando aunque
              la conversación ya esté NUEVO.
            */

            try {

                await enviarTextoWhatsApp(
                    telefonoCliente,

                    textoSeguroWhatsApp(
                        `Tu carrera #${carrera.numero} ha finalizado.\nGracias por viajar con Rapitaxi!`
                    )
                );


                await enviarBotonesWhatsApp(
                    telefonoCliente,

                    "Que tal estuvo tu taxista?",

                    [
                        {
                            id:
                                `rating_excelente_${carrera.id}`,

                            titulo:
                                "Excelente",
                        },

                        {
                            id:
                                `rating_bueno_${carrera.id}`,

                            titulo:
                                "Bueno",
                        },

                        {
                            id:
                                `rating_malo_${carrera.id}`,

                            titulo:
                                "Malo",
                        },
                    ]
                );

            } catch (error) {

                /*
                  IMPORTANTE:
        
                  Si Kapso / WhatsApp falla,
                  la carrera YA está completada
                  y el cliente YA está liberado.
        
                  El servicio no queda bloqueado.
                */

                console.error(
                    `Error enviando calificación de carrera #${carrera.numero}:`,
                    error
                );
            }


            console.log(
                `Carrera #${carrera.numero} finalizada automáticamente después de 30 minutos.`
            );

        } catch (error) {

            console.error(
                `Error finalizando automáticamente carrera #${carrera.numero}:`,
                error
            );
        }
    }


    return finalizadas;
}


/*
  ========================================
  LISTADO PARA ADMIN
  ========================================
*/

export async function listarCarrerasAdmin() {
    return prisma.carrera.findMany({
        orderBy: {
            fechaCreacion:
                "desc",
        },

        include: {
            cliente: {
                select: {
                    id:
                        true,

                    nombre:
                        true,

                    whatsapp:
                        true,
                },
            },

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
                },
            },
        },
    });
}

export async function cancelarCarreraAdmin(
    carreraId: number
) {

    const carrera =
        await prisma.carrera.findUnique({
            where: {
                id: carreraId
            }
        });


    if (!carrera) {
        throw new Error(
            "CARRERA_NO_EXISTE"
        );
    }


    if (
        carrera.estado === "COMPLETADA" ||
        carrera.estado === "CANCELADA"
    ) {
        throw new Error(
            "CARRERA_YA_CERRADA"
        );
    }


    await prisma.$transaction(
        async tx => {

            await tx.carrera.update({
                where: {
                    id: carrera.id
                },

                data: {
                    estado: "CANCELADA",
                    canceladaPor: "ADMIN",
                    fechaFin: new Date()
                }
            });


            const telefono =
                carrera.whatsappCliente
                    .replace(/\D/g, "");


            const conversacion =
                await tx.conversacionWhatsApp
                    .findUnique({
                        where: {
                            telefono
                        }
                    });


            if (
                conversacion &&
                conversacion.carreraId ===
                carrera.id
            ) {

                await tx.conversacionWhatsApp
                    .update({
                        where: {
                            telefono
                        },

                        data: {
                            estado: "NUEVO",
                            carreraId: null,
                            latitud: null,
                            longitud: null,
                            referencia: null
                        }
                    });

            }

        }
    );


    return {
        success: true,
        carreraId: carrera.id,
        numero: carrera.numero,
        estado: "CANCELADA"
    };
}

/*
  ========================================
  APP TAXISTA - CARRERA ACTIVA
  ========================================
*/

export async function obtenerCarreraActivaTaxista(
    codigoTaxista: string
) {

    const codigo =
        normalizarCodigoTaxista(
            codigoTaxista
        );


    const taxista =
        await prisma.taxista.findUnique({
            where: {
                codigo,
            },

            select: {
                id: true,
                activo: true,
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


    const carrera =
        await prisma.carrera.findFirst({
            where: {
                taxistaId:
                    taxista.id,

                fechaFin:
                    null,

                estado: {
                    in: [
                        "ASIGNADA",
                        "EN_CAMINO",
                        "CERCA",
                        "LLEGO",
                    ],
                },
            },

            orderBy: {
                fechaAceptacion:
                    "desc",
            },
        });


    if (!carrera) {
        return null;
    }


    const telefonoCliente =
        normalizarTelefono(
            carrera.whatsappCliente
        );


    const mensajeParaCliente =
        encodeURIComponent(
            textoSeguroWhatsApp(
                `Hola ${carrera.nombreCliente}, soy tu taxista asignado a la carrera #${carrera.numero}.`
            )
        );

    const publicUrl =
        String(
            process.env.PUBLIC_URL ||
            "http://localhost:3000"
        )
            .replace(/\/+$/, "");


    const enlaceSeguimiento =
        carrera.trackingToken &&
            publicUrl

            ? `${publicUrl}/seguimiento.html?token=${carrera.trackingToken}`

            : null;

    return {
        id:
            carrera.id,

        numero:
            carrera.numero,

        estado:
            carrera.estado,

        referencia:
            carrera.referencia,

        formaPago:
            carrera.formaPago,

        latitud:
            carrera.latitud,

        longitud:
            carrera.longitud,

        fechaAceptacion:
            carrera.fechaAceptacion,

        enlaceSeguimiento,

        enlaceGoogleMaps:
            `https://www.google.com/maps/dir/?api=1&destination=${carrera.latitud},${carrera.longitud}`,

        enlaceWhatsAppCliente:
            `https://wa.me/${telefonoCliente}?text=${mensajeParaCliente}`,
    };
}


/*
  ========================================
  APP TAXISTA - ACTUALIZAR GPS
  ========================================
*/

export async function actualizarUbicacionTaxista(
    carreraId: number,
    codigoTaxista: string,
    latitud: number,
    longitud: number
) {

    const codigo =
        normalizarCodigoTaxista(
            codigoTaxista
        );


    if (
        !Number.isFinite(latitud) ||
        !Number.isFinite(longitud) ||
        latitud < -90 ||
        latitud > 90 ||
        longitud < -180 ||
        longitud > 180
    ) {
        throw new Error(
            "UBICACION_INVALIDA"
        );
    }


    const taxista =
        await prisma.taxista.findUnique({
            where: {
                codigo,
            },

            select: {
                id: true,
                activo: true,
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


    const carrera =
        await prisma.carrera.findUnique({
            where: {
                id: carreraId,
            },

            select: {
                id: true,
                numero: true,

                taxistaId: true,

                estado: true,
                fechaFin: true,

                latitud: true,
                longitud: true,

                whatsappCliente: true,

                ultimaNotificacionSeguimiento:
                    true,
            },
        });


    if (!carrera) {
        throw new Error(
            "CARRERA_NO_EXISTE"
        );
    }


    if (
        carrera.taxistaId !==
        taxista.id
    ) {
        throw new Error(
            "CARRERA_NO_PERTENECE_TAXISTA"
        );
    }


    if (
        carrera.fechaFin ||
        ![
            "ASIGNADA",
            "EN_CAMINO",
            "CERCA",
            "LLEGO",
        ].includes(
            carrera.estado
        )
    ) {
        throw new Error(
            "CARRERA_NO_ACTIVA"
        );
    }


    const ahora =
        new Date();


    /*
      Distancia en línea recta entre
      el taxi y la ubicación del cliente.
    */

    const distanciaKm =
        calcularDistanciaKm(
            latitud,
            longitud,
            carrera.latitud,
            carrera.longitud
        );


    const etaMinutos =
        calcularEtaAproximadaMinutos(
            distanciaKm
        );


    /*
      ========================================
      ESTADO AUTOMATICO SEGUN DISTANCIA
      ========================================

      > 700 m  -> EN_CAMINO
      <= 700 m -> CERCA
      <= 200 m -> LLEGO

      El taxista NO pulsa botones.
    */

    let nuevoEstado:
        "EN_CAMINO" |
        "CERCA" |
        "LLEGO";


    if (
        distanciaKm <= 0.2
    ) {

        nuevoEstado =
            "LLEGO";

    } else if (
        distanciaKm <= 0.7
    ) {

        nuevoEstado =
            "CERCA";

    } else {

        /*
          Nunca hacemos retroceder CERCA
          o LLEGO si el GPS fluctúa.
        */

        if (
            carrera.estado ===
            "CERCA" ||
            carrera.estado ===
            "LLEGO"
        ) {

            nuevoEstado =
                carrera.estado;

        } else {

            nuevoEstado =
                "EN_CAMINO";
        }
    }


    /*
      Tampoco permitimos:
      LLEGO -> CERCA
    */

    if (
        carrera.estado ===
        "LLEGO"
    ) {
        nuevoEstado =
            "LLEGO";
    }


    const dataActualizacion: any = {

        latitudTaxista:
            latitud,

        longitudTaxista:
            longitud,

        fechaUbicacionTaxista:
            ahora,

        estado:
            nuevoEstado,
    };


    if (
        carrera.estado ===
        "ASIGNADA"
    ) {

        dataActualizacion
            .fechaEnCamino =
            ahora;
    }


    if (
        nuevoEstado ===
        "CERCA" &&
        carrera.estado !==
        "CERCA" &&
        carrera.estado !==
        "LLEGO"
    ) {

        dataActualizacion
            .fechaCerca =
            ahora;
    }


    if (
        nuevoEstado ===
        "LLEGO" &&
        carrera.estado !==
        "LLEGO"
    ) {

        dataActualizacion
            .fechaLlegada =
            ahora;
    }


    /*
      ========================================
      MENSAJES AUTOMATICOS
      ========================================
    */

    const entroEnCerca =
        nuevoEstado ===
        "CERCA" &&
        carrera.estado !==
        "CERCA" &&
        carrera.estado !==
        "LLEGO";


    const entroEnLlegando =
        nuevoEstado ===
        "LLEGO" &&
        carrera.estado !==
        "LLEGO";


    const hanPasadoCincoMinutos =
        !carrera
            .ultimaNotificacionSeguimiento ||

        (
            ahora.getTime() -
            carrera
                .ultimaNotificacionSeguimiento
                .getTime()
        ) >=
        5 * 60 * 1000;


    let mensajeAutomatico:
        string | null =
        null;


    if (
        entroEnLlegando
    ) {

        mensajeAutomatico =
            `Tu taxi esta llegando. ` +
            `Se encuentra a aproximadamente ` +
            `${Math.round(distanciaKm * 1000)} metros de tu ubicacion.`;

    } else if (
        entroEnCerca
    ) {

        mensajeAutomatico =
            `Tu taxi esta cerca. ` +
            `Se encuentra a aproximadamente ` +
            `${Math.round(distanciaKm * 1000)} metros de tu ubicacion.`;

    } else if (
        hanPasadoCincoMinutos
    ) {

        mensajeAutomatico =
            `Actualizacion Rapitaxi: ` +
            `tu taxi se encuentra a aproximadamente ` +
            `${distanciaKm.toFixed(1)} km ` +
            `y ${etaMinutos} min de tu ubicacion.`;
    }


    /*
      Si vamos a enviar un aviso,
      guardamos el momento.

      Esto evita mandar mensajes con
      cada actualización GPS.
    */

    if (
        mensajeAutomatico
    ) {

        dataActualizacion
            .ultimaNotificacionSeguimiento =
            ahora;
    }


    const actualizada =
        await prisma.carrera.update({
            where: {
                id:
                    carrera.id,
            },

            data:
                dataActualizacion,

            select: {
                id: true,
                numero: true,
                estado: true,

                latitudTaxista:
                    true,

                longitudTaxista:
                    true,

                fechaUbicacionTaxista:
                    true,

                ultimaNotificacionSeguimiento:
                    true,
            },
        });


    /*
      WhatsApp es secundario.

      Si Kapso falla, NO hacemos fallar
      el GPS ni deshacemos la ubicación.
    */

    if (
        mensajeAutomatico
    ) {

        enviarTextoWhatsApp(
            normalizarTelefono(
                carrera.whatsappCliente
            ),

            textoSeguroWhatsApp(
                mensajeAutomatico
            )
        )
            .catch(
                error => {

                    console.error(
                        `Error enviando seguimiento de carrera #${carrera.numero}:`,
                        error
                    );
                }
            );
    }


    return {
        ...actualizada,

        distanciaKm:
            Number(
                distanciaKm.toFixed(2)
            ),

        etaMinutos,
    };
}


/*
  ========================================
  APP TAXISTA - FINALIZAR CARRERA
  ========================================
*/

export async function finalizarCarreraTaxista(
    carreraId: number,
    codigoTaxista: string
) {

    const codigo =
        normalizarCodigoTaxista(
            codigoTaxista
        );


    const taxista =
        await prisma.taxista.findUnique({
            where: {
                codigo,
            },

            select: {
                id: true,
                activo: true,
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


    const carrera =
        await prisma.carrera.findUnique({
            where: {
                id:
                    carreraId,
            },
        });


    if (!carrera) {
        throw new Error(
            "CARRERA_NO_EXISTE"
        );
    }


    if (
        carrera.taxistaId !==
        taxista.id
    ) {
        throw new Error(
            "CARRERA_NO_PERTENECE_TAXISTA"
        );
    }


    if (
        carrera.fechaFin ||
        carrera.estado ===
        "COMPLETADA" ||
        carrera.estado ===
        "CANCELADA"
    ) {
        throw new Error(
            "CARRERA_YA_CERRADA"
        );
    }


    const ahora =
        new Date();


    const resultado =
        await prisma.carrera.updateMany({
            where: {
                id:
                    carrera.id,

                taxistaId:
                    taxista.id,

                fechaFin:
                    null,

                estado: {
                    in: [
                        "ASIGNADA",
                        "EN_CAMINO",
                        "CERCA",
                        "LLEGO",
                    ],
                },
            },

            data: {
                estado:
                    "COMPLETADA",

                fechaFin:
                    ahora,
            },
        });


    if (
        resultado.count === 0
    ) {
        throw new Error(
            "CARRERA_YA_CERRADA"
        );
    }


    const telefonoCliente =
        normalizarTelefono(
            carrera.whatsappCliente
        );


    /*
      Liberamos inmediatamente al cliente.

      No depende de que WhatsApp funcione.
    */

    try {

        await prisma
            .conversacionWhatsApp
            .updateMany({

                where: {
                    telefono:
                        telefonoCliente,
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

    } catch (error) {

        console.error(
            `Error liberando conversación de carrera #${carrera.numero}:`,
            error
        );

    }


    /*
      El mensaje es secundario.
      Si Kapso falla, la carrera ya quedó
      correctamente finalizada.
    */

    try {

        await enviarTextoWhatsApp(
            telefonoCliente,

            textoSeguroWhatsApp(
                `Tu carrera #${carrera.numero} ha finalizado.\nGracias por viajar con Rapitaxi!`
            )
        );


        await enviarBotonesWhatsApp(
            telefonoCliente,

            "Que tal estuvo tu taxista?",

            [
                {
                    id:
                        `rating_excelente_${carrera.id}`,

                    titulo:
                        "Excelente",
                },

                {
                    id:
                        `rating_bueno_${carrera.id}`,

                    titulo:
                        "Bueno",
                },

                {
                    id:
                        `rating_malo_${carrera.id}`,

                    titulo:
                        "Malo",
                },
            ]
        );

    } catch (error) {

        console.error(
            `Error enviando cierre de carrera #${carrera.numero}:`,
            error
        );

    }


    return {
        id:
            carrera.id,

        numero:
            carrera.numero,

        estado:
            "COMPLETADA",

        fechaFin:
            ahora,
    };
}
/*
  ========================================
  SEGUIMIENTO PUBLICO DEL CLIENTE
  ========================================
*/

function calcularDistanciaKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {

    const radioTierraKm =
        6371;


    const gradosARadianes =
        (grados: number) =>
            grados * Math.PI / 180;


    const dLat =
        gradosARadianes(
            lat2 - lat1
        );


    const dLon =
        gradosARadianes(
            lon2 - lon1
        );


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            gradosARadianes(lat1)
        ) *

        Math.cos(
            gradosARadianes(lat2)
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return radioTierraKm * c;
}


function calcularEtaAproximadaMinutos(
    distanciaKm: number
) {

    /*
      Para el MVP usamos una velocidad
      urbana promedio de 25 km/h.

      Luego podremos reemplazar esto
      por Google Routes u otro proveedor.
    */

    if (
        distanciaKm <= 0.15
    ) {
        return 1;
    }


    const velocidadKmHora =
        25;


    const minutos =
        (
            distanciaKm /
            velocidadKmHora
        ) * 60;


    return Math.max(
        1,
        Math.ceil(minutos)
    );
}


export async function obtenerSeguimientoPublico(
    trackingToken: string
) {

    const token =
        String(
            trackingToken || ""
        ).trim();


    if (
        token.length < 20
    ) {
        throw new Error(
            "TRACKING_TOKEN_INVALIDO"
        );
    }


    const carrera =
        await prisma.carrera.findUnique({
            where: {
                trackingToken:
                    token,
            },

            select: {
                numero: true,
                estado: true,

                latitud: true,
                longitud: true,

                latitudTaxista: true,
                longitudTaxista: true,
                fechaUbicacionTaxista:
                    true,

                fechaAceptacion: true,
                fechaFin: true,

                taxista: {
                    select: {
                        nombre: true,
                        vehiculo: true,
                        colorVehiculo: true,
                        placa: true,
                        cooperativa: true,
                    },
                },
            },
        });


    if (!carrera) {
        throw new Error(
            "SEGUIMIENTO_NO_EXISTE"
        );
    }


    /*
      Si la carrera ya terminó, dejamos
      de entregar la posición del taxi.
    */

    if (
        carrera.estado ===
        "COMPLETADA" ||
        carrera.estado ===
        "CANCELADA" ||
        carrera.fechaFin
    ) {

        return {
            numero:
                carrera.numero,

            estado:
                carrera.estado,

            activa:
                false,

            mensaje:
                "Esta carrera ha finalizado.",
        };
    }


    let distanciaKm:
        number | null =
        null;


    let etaMinutos:
        number | null =
        null;


    if (
        carrera.latitudTaxista !==
        null &&
        carrera.longitudTaxista !==
        null
    ) {

        distanciaKm =
            calcularDistanciaKm(
                carrera.latitudTaxista,
                carrera.longitudTaxista,
                carrera.latitud,
                carrera.longitud
            );


        etaMinutos =
            calcularEtaAproximadaMinutos(
                distanciaKm
            );
    }


    return {
        numero:
            carrera.numero,

        estado:
            carrera.estado,

        activa:
            true,

        destino: {
            latitud:
                carrera.latitud,

            longitud:
                carrera.longitud,
        },

        taxi:
            carrera.latitudTaxista !==
                null &&
                carrera.longitudTaxista !==
                null

                ? {
                    latitud:
                        carrera.latitudTaxista,

                    longitud:
                        carrera.longitudTaxista,

                    ultimaActualizacion:
                        carrera.fechaUbicacionTaxista,
                }

                : null,

        distanciaKm:
            distanciaKm !== null

                ? Number(
                    distanciaKm.toFixed(2)
                )

                : null,

        etaMinutos,

        taxista:
            carrera.taxista

                ? {
                    nombre:
                        carrera.taxista.nombre,

                    vehiculo:
                        carrera.taxista.vehiculo,

                    colorVehiculo:
                        carrera.taxista.colorVehiculo,

                    placa:
                        carrera.taxista.placa,

                    cooperativa:
                        carrera.taxista.cooperativa,
                }

                : null,
    };
}