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
      ACEPTACIÓN ATÓMICA.
  
      Solamente puede modificar la carrera
      si todavía está BUSCANDO.
  
      Esto evita que dos taxistas acepten
      la misma carrera.
    */

    const resultado =
        await prisma.carrera.updateMany({
            where: {
                token,
                estado: "BUSCANDO",
            },

            data: {
                estado: "ASIGNADA",

                taxistaId:
                    taxista.id,

                fechaAceptacion:
                    new Date(),
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
            await prisma.carrera.findUnique({
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


    const descripcionVehiculo =
        [
            taxista.vehiculo,
            taxista.colorVehiculo,
        ]
            .filter(Boolean)
            .join(" ");


    let mensajeCliente =

        `🚖 Ok✅ ${taxista.nombre} irá a recogerte.\n` +

        `🚕 Vehículo: ${descripcionVehiculo}\n` +

        `🔢 Placa: ${taxista.placa}\n` +

        `✅ Whatsapp: ${taxista.telefono}\n` +

        `💳 Pago: ${carrera.formaPago}`;


    if (
        taxista.cooperativa
    ) {
        mensajeCliente +=

            `\n🏢 Coop: ${taxista.cooperativa}`;
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

            `\n\n💳 Banco Pichincha`;


        if (
            taxista.titularPichincha
        ) {
            mensajeCliente +=

                `\n👤 Titular: ${taxista.titularPichincha}`;
        }


        if (
            taxista.cuentaPichincha
        ) {
            mensajeCliente +=

                `\n🏦 Cuenta: ${taxista.cuentaPichincha}`;
        }
    }


    if (
        carrera.formaPago ===
        "Transferencia Banco Guayaquil"
    ) {
        mensajeCliente +=

            `\n\n💳 Banco Guayaquil`;


        if (
            taxista.titularGuayaquil
        ) {
            mensajeCliente +=

                `\n👤 Titular: ${taxista.titularGuayaquil}`;
        }


        if (
            taxista.cuentaGuayaquil
        ) {
            mensajeCliente +=

                `\n🏦 Cuenta: ${taxista.cuentaGuayaquil}`;
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
            mensajeCliente
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
            `Hola ${carrera.nombreCliente}, soy ${taxista.nombre}, el taxista asignado a tu carrera.🚖✅`
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
            latitud: carrera.latitud,
            longitud: carrera.longitud,
            enlaceGoogleMaps:
                `https://www.google.com/maps/search/?api=1&query=${carrera.latitud},${carrera.longitud}`,
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

                    `✅ Tu carrera #${carrera.numero} ha finalizado.\n¡Gracias por viajar con Rapitaxi! 🚖`
                );


                await enviarBotonesWhatsApp(
                    telefonoCliente,

                    "¿Qué tal estuvo tu taxista?",

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