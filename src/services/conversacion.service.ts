import { prisma } from "../config/prisma";

import {
    crearCarrera,
} from "./carrera.service";

import {
    obtenerDireccionDesdeCoordenadas
} from "./geocoding.service";

import {
    estaDentroDeChone
} from "./cobertura.service";

import {
    enviarBotonesWhatsApp,
    enviarTextoWhatsApp,
    solicitarUbicacionWhatsApp,
} from "./whatsapp.service";


/*
  ========================================
  TIPOS
  ========================================
*/

interface MensajeWhatsAppInput {
    telefono: string;

    nombre?: string;

    tipo?: string;

    texto?: string;

    botonId?: string;

    latitud?: number;

    longitud?: number;

    direccionUbicacion?: string;

    nombreUbicacion?: string;
}


/*
  ========================================
  UTILIDADES
  ========================================
*/

function normalizarTelefono(
    telefono: string
) {
    const limpio =
        String(telefono || "")
            .replace(/\D/g, "");


    if (
        limpio.startsWith("593")
    ) {
        return limpio;
    }


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


function tieneUbicacion(
    input: MensajeWhatsAppInput
) {
    return (
        typeof input.latitud ===
        "number" &&

        typeof input.longitud ===
        "number"
    );
}


function obtenerReferenciaUbicacion(
    input: MensajeWhatsAppInput
) {
    if (
        input.nombreUbicacion?.trim()
    ) {
        return (
            input.nombreUbicacion.trim()
        );
    }


    if (
        input.direccionUbicacion?.trim()
    ) {
        return (
            input.direccionUbicacion.trim()
        );
    }


    return (
        "Ubicación enviada por WhatsApp"
    );
}


async function obtenerReferenciaProcesada(
    input: MensajeWhatsAppInput
) {
    const referenciaOriginal =
        obtenerReferenciaUbicacion(
            input
        );

    if (!tieneUbicacion(input)) {
        return referenciaOriginal;
    }

    const direccionAutomatica =
        await obtenerDireccionDesdeCoordenadas(
            input.latitud!,
            input.longitud!
        );

    return (
        direccionAutomatica ||
        referenciaOriginal
    );
}


function ubicacionPermitidaEnChone(
    input: MensajeWhatsAppInput
) {
    if (!tieneUbicacion(input)) {
        return false;
    }

    const resultado =
        estaDentroDeChone(
            input.latitud!,
            input.longitud!
        );

    return resultado.permitido;
}


async function avisarFueraDeCobertura(
    telefono: string
) {
    await enviarTextoWhatsApp(
        telefono,
        "📍 Lo sentimos, Rapitaxi solo opera dentro de Chone. Envíame una ubicación dentro de nuestra zona de cobertura para continuar."
    );
}


function esCancelar(
    input: MensajeWhatsAppInput
) {
    const texto =
        String(
            input.texto || ""
        )
            .trim()
            .toLowerCase();


    return (
        input.botonId ===
        "cancelar_carrera" ||

        texto ===
        "cancelar"
    );
}


/*
  ========================================
  FORMA DE PAGO
  ========================================
*/

function obtenerFormaPago(
    input: MensajeWhatsAppInput
) {
    const boton =
        String(
            input.botonId || ""
        )
            .trim()
            .toLowerCase();


    const texto =
        String(
            input.texto || ""
        )
            .trim()
            .toLowerCase();


    if (
        boton ===
        "pago_efectivo" ||

        texto ===
        "efectivo"
    ) {
        return "Efectivo";
    }


    if (
        boton ===
        "pago_pichincha" ||

        texto ===
        "pichincha"
    ) {
        return (
            "Transferencia Banco Pichincha"
        );
    }


    if (
        boton ===
        "pago_guayaquil" ||

        texto ===
        "guayaquil"
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

        "💳 ¿Cómo deseas pagar?",

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
/*
  ========================================
  NOMBRE DEL CLIENTE + MARKETING RAPI
  ========================================
*/

const LIMITE_OPINION_RAPI_MS =
    6 * 60 * 60 * 1000;


const OPINIONES_RAPI = [
    {
        id: 1,
        texto:
            "Tú dices «ya voy» y todavía estás buscando las llaves. 😂",
    },
    {
        id: 2,
        texto:
            "Tienes cara de decir «cinco minutos más» y despertar una hora después. 😂",
    },
    {
        id: 3,
        texto:
            "Tú no llegas tarde... haces una entrada especial. 😎😂",
    },
    {
        id: 4,
        texto:
            "Tu batería puede estar en 2%, pero tú sigues diciendo «aguanta un poquito más». 😂",
    },
    {
        id: 5,
        texto:
            "Eres de los que abre WhatsApp para responder un mensaje y termina viendo estados media hora. 😂",
    },
    {
        id: 6,
        texto:
            "Tú dices «hoy sí me duermo temprano» como si alguien todavía te creyera. 😂",
    },
    {
        id: 7,
        texto:
            "Si posponer las cosas fuera deporte, ya tendrías medalla. 🥇😂",
    },
    {
        id: 8,
        texto:
            "Seguro desbloqueas el teléfono y a los tres segundos olvidas para qué lo hiciste. 😂",
    },
    {
        id: 9,
        texto:
            "Tú no tienes hambre... solamente necesitas revisar qué hay en la cocina cada veinte minutos. 😂",
    },
    {
        id: 10,
        texto:
            "Eres de los que dice «no voy a gastar» justo antes de comprar algo que no necesitaba. 😂",
    },
    {
        id: 11,
        texto:
            "Cuando dices «rapidito», todos saben que eso puede durar bastante. 😂",
    },
    {
        id: 12,
        texto:
            "Tú empiezas a ordenar una cosa y terminas encontrando recuerdos de hace cinco años. 😂",
    },
    {
        id: 13,
        texto:
            "Tienes un talento especial para buscar algo que estaba justo frente a ti. 😂",
    },
    {
        id: 14,
        texto:
            "Tú dices «una última vez» con demasiada facilidad. 😂",
    },
    {
        id: 15,
        texto:
            "Si te mandan un audio de cuatro minutos, primero necesitas prepararte emocionalmente. 😂",
    },
    {
        id: 16,
        texto:
            "Tú también practicas conversaciones completas en tu cabeza que nunca suceden. 😂",
    },
    {
        id: 17,
        texto:
            "Eres de los que revisa el refrigerador otra vez esperando que aparezca comida nueva. 😂",
    },
    {
        id: 18,
        texto:
            "Puedes tardar veinte minutos eligiendo qué ver y luego decir que ya no tienes tiempo. 😂",
    },
    {
        id: 19,
        texto:
            "Tú dices «mañana comienzo» con una confianza impresionante. 😂",
    },
    {
        id: 20,
        texto:
            "Si perder el cargador fuera profesión, ya tendrías experiencia laboral. 😂",
    },
];


function normalizarTextoMarketing(
    valor: string
) {
    return String(
        valor || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[¿?¡!.,;:]+/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


function formatearNombre(
    valor: string
) {
    let nombre =
        String(
            valor || ""
        )
            .trim()
            .replace(
                /\s+/g,
                " "
            )
            .replace(
                /\s+(por favor|gracias)$/i,
                ""
            )
            .trim();


    /*
      Evitamos guardar frases,
      números o textos demasiado largos
      como si fueran nombres.
    */

    if (
        nombre.length < 2 ||
        nombre.length > 60
    ) {
        return null;
    }


    if (
        /\d/.test(
            nombre
        )
    ) {
        return null;
    }


    const palabras =
        nombre.split(
            /\s+/
        );


    if (
        palabras.length > 5
    ) {
        return null;
    }


    if (
        !/^[\p{L}'’\-\s]+$/u.test(
            nombre
        )
    ) {
        return null;
    }


    nombre =
        palabras
            .map(
                palabra => {
                    if (!palabra) {
                        return palabra;
                    }


                    return (
                        palabra
                            .charAt(0)
                            .toLocaleUpperCase(
                                "es"
                            ) +
                        palabra
                            .slice(1)
                            .toLocaleLowerCase(
                                "es"
                            )
                    );
                }
            )
            .join(
                " "
            );


    return nombre;
}


function extraerNombreExplicito(
    input: MensajeWhatsAppInput
) {
    const texto =
        String(
            input.texto || ""
        ).trim();


    if (!texto) {
        return null;
    }


    /*
      Ejemplos reconocidos:

      Me llamo Kevin
      Mi nombre es Kevin
      Cámbiame el nombre a Kevin
      Cambia mi nombre a Kevin
      Quiero que me llames Kevin

      Si escribe:
      "No me llamo Pedro, me llamo Kevin"

      tomamos la última coincidencia.
    */

    const expresion =
        /(?:me llamo|mi nombre es|c[aá]mbiame el nombre a|cambia mi nombre a|quiero que me llames)\s+([\p{L}'’\-]+(?:\s+[\p{L}'’\-]+){0,4})/giu;


    const coincidencias =
        Array.from(
            texto.matchAll(
                expresion
            )
        );


    if (
        coincidencias.length === 0
    ) {
        return null;
    }


    const ultima =
        coincidencias[
        coincidencias.length - 1
        ];


    return formatearNombre(
        ultima[1] || ""
    );
}


function solicitaCorregirNombre(
    input: MensajeWhatsAppInput
) {
    const texto =
        normalizarTextoMarketing(
            input.texto || ""
        );


    if (!texto) {
        return false;
    }


    const frases = [
        "ese no es mi nombre",
        "ese no es mi nombre correcto",
        "no me llamo asi",
        "mi nombre esta mal",
        "me llamas mal",
        "quiero cambiar mi nombre",
        "quiero corregir mi nombre",
        "cambia mi nombre",
        "corrige mi nombre",
    ];


    return frases.some(
        frase =>
            texto.includes(
                frase
            )
    );
}


function esSolicitudOpinionRapi(
    input: MensajeWhatsAppInput
) {
    const texto =
        normalizarTextoMarketing(
            input.texto || ""
        );


    if (!texto) {
        return false;
    }


    const frases = [
        "rapi opina de mi",
        "rapi que opinas de mi",
        "que opinas de mi",
        "opina de mi",
        "dime que opinas de mi",
        "dime que piensas de mi",
        "que piensas de mi",
        "rapi dime que piensas de mi",
    ];


    return frases.some(
        frase =>
            texto === frase ||
            texto.includes(
                frase
            )
    );
}


function elegirOpinionRapi(
    ultimaOpinionId:
        number | null
) {
    const disponibles =
        OPINIONES_RAPI.filter(
            opinion =>
                opinion.id !==
                ultimaOpinionId
        );


    const lista =
        disponibles.length > 0
            ? disponibles
            : OPINIONES_RAPI;


    const indice =
        Math.floor(
            Math.random() *
            lista.length
        );


    return lista[
        indice
    ];
}


function tiempoRestanteOpinion(
    ultimaOpinion:
        Date
) {
    const transcurrido =
        Date.now() -
        ultimaOpinion.getTime();


    const restante =
        Math.max(
            0,
            LIMITE_OPINION_RAPI_MS -
            transcurrido
        );


    const minutos =
        Math.ceil(
            restante /
            60000
        );


    const horas =
        Math.floor(
            minutos /
            60
        );


    const minutosRestantes =
        minutos % 60;


    if (
        horas > 0 &&
        minutosRestantes > 0
    ) {
        return (
            `${horas} h ` +
            `${minutosRestantes} min`
        );
    }


    if (
        horas > 0
    ) {
        return `${horas} h`;
    }


    return `${minutosRestantes} min`;
}


async function procesarOpinionRapi(
    cliente: {
        id: number;

        ultimaOpinionRapi:
        Date | null;

        ultimaOpinionId:
        number | null;
    },

    telefono: string
) {
    const ultima =
        cliente.ultimaOpinionRapi;


    if (ultima) {
        const transcurrido =
            Date.now() -
            ultima.getTime();


        if (
            transcurrido <
            LIMITE_OPINION_RAPI_MS
        ) {
            const restante =
                tiempoRestanteOpinion(
                    ultima
                );


            await enviarTextoWhatsApp(
                telefono,

                `😂 Rapi ya opinó de ti hace poquito. Vuelve en ${restante} y te digo otra. 🚕💜`
            );


            return;
        }
    }


    const opinion =
        elegirOpinionRapi(
            cliente.ultimaOpinionId
        );


    /*
      Primero guardamos el uso.

      Así si Kapso reintenta el webhook,
      queda aplicado el límite.
    */

    await prisma.cliente.update({
        where: {
            id:
                cliente.id,
        },

        data: {
            ultimaOpinionRapi:
                new Date(),

            ultimaOpinionId:
                opinion.id,
        },
    });


    /*
      Chiste + CTA van en UN SOLO mensaje.
    */

    await enviarTextoWhatsApp(
        telefono,

        `🤣 *Rapi opina de ti:*\n\n“${opinion.texto}”\n\n¿Te dolió? 😏😂 Súbelo a tu historia y comparte tu resultado de RapiTaxi. 💜🚕`
    );
}


async function guardarNuevoNombre(
    clienteId: number,
    telefono: string,
    nuevoNombre: string
) {
    /*
      Actualizamos Cliente y conversación
      en una sola transacción.
    */

    await prisma.$transaction([
        prisma.cliente.update({
            where: {
                id:
                    clienteId,
            },

            data: {
                nombre:
                    nuevoNombre,
            },
        }),

        prisma.conversacionWhatsApp.updateMany({
            where: {
                telefono,
            },

            data: {
                nombre:
                    nuevoNombre,
            },
        }),
    ]);
}

/*
  ========================================
  CARRERA ACTIVA
  ========================================
*/

async function enviarCarreraEnCurso(
    telefono: string,
    nombre: string
) {
    await enviarBotonesWhatsApp(
        telefono,

        `Hola ${nombre}, tienes una carrera en curso. 🚖`,

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


/*
  ========================================
  CALIFICACIÓN OPCIONAL
  ========================================

  Los botones que envía carrera.service.ts
  tienen esta forma:

  rating_excelente_123
  rating_bueno_123
  rating_malo_123

  El último número es el ID de la carrera.

  MUY IMPORTANTE:

  Calificar NO cambia el estado de la
  conversación del cliente.

  Por eso el cliente puede estar:
  - NUEVO
  - pidiendo otra carrera
  - o incluso tener otra carrera activa

  y aun así calificar una carrera anterior.
  ========================================
*/

async function procesarCalificacion(
    input: MensajeWhatsAppInput,
    telefono: string
) {
    const boton =
        String(
            input.botonId || ""
        ).trim();


    const coincidencia =
        boton.match(
            /^rating_(excelente|bueno|malo)_(\d+)$/
        );


    if (!coincidencia) {
        return false;
    }


    const tipo =
        coincidencia[1];


    const carreraId =
        Number(
            coincidencia[2]
        );


    let calificacion:
        | "Excelente"
        | "Bueno"
        | "Malo";


    if (
        tipo ===
        "excelente"
    ) {
        calificacion =
            "Excelente";

    } else if (
        tipo ===
        "bueno"
    ) {
        calificacion =
            "Bueno";

    } else {
        calificacion =
            "Malo";
    }


    /*
      Buscamos la carrera específica
      incluida dentro del botón.
    */

    const carrera =
        await prisma.carrera.findUnique({
            where: {
                id:
                    carreraId,
            },

            select: {
                id:
                    true,

                numero:
                    true,

                estado:
                    true,

                whatsappCliente:
                    true,

                calificacion:
                    true,
            },
        });


    /*
      Si la carrera ya no existe,
      simplemente ignoramos el botón.
    */

    if (!carrera) {
        return true;
    }


    /*
      Seguridad básica:
  
      El número que calificó debe ser
      el mismo número del cliente de
      esa carrera.
    */

    if (
        normalizarTelefono(
            carrera.whatsappCliente
        ) !== telefono
    ) {
        return true;
    }


    /*
      Solo calificamos carreras
      terminadas.
    */

    if (
        carrera.estado !==
        "COMPLETADA"
    ) {
        return true;
    }


    /*
      Si ya había calificado,
      no necesitamos volver a cambiarlo.
    */

    if (
        carrera.calificacion
    ) {
        try {
            await enviarTextoWhatsApp(
                telefono,

                `✅ Ya registramos tu calificación para la carrera #${carrera.numero}. ¡Gracias!`
            );
        } catch (error) {

            console.error(
                "Error respondiendo calificación repetida:",
                error
            );
        }


        return true;
    }


    /*
      Guardamos solamente la calificación.
  
      NO tocamos ConversacionWhatsApp.
    */

    await prisma.carrera.update({
        where: {
            id:
                carrera.id,
        },

        data: {
            calificacion,
        },
    });


    try {
        await enviarTextoWhatsApp(
            telefono,

            `⭐ Gracias por calificar tu carrera como "${calificacion}". ¡Esperamos verte nuevamente en Rapitaxi! 🚖`
        );

    } catch (error) {

        console.error(
            "Error enviando agradecimiento de calificación:",
            error
        );
    }


    return true;
}


/*
  ========================================
  FUNCIÓN PRINCIPAL
  ========================================
*/

export async function procesarMensajeWhatsApp(
    input: MensajeWhatsAppInput
) {
    const telefono =
        normalizarTelefono(
            input.telefono
        );


    if (!telefono) {
        return;
    }


    /*
      ======================================
      1. CALIFICACIONES
      ======================================
  
      Esto SIEMPRE se procesa primero.
  
      Así un botón viejo de calificación
      nunca inicia accidentalmente otra
      carrera ni interfiere con una nueva.
    */

    const fueCalificacion =
        await procesarCalificacion(
            input,
            telefono
        );


    if (fueCalificacion) {
        return;
    }


    /*
      ======================================
      2. BUSCAR CLIENTE Y CONVERSACIÓN
      ======================================
    */

    let cliente =
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
      3. CANCELAR CARRERA
      ======================================
    */

    if (
        esCancelar(input)
    ) {
        if (
            conversacion?.carreraId
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

                        fechaFin:
                            new Date(),
                    },
                });


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

                    "❌ Tu carrera ha sido cancelada."
                );


                return;
            }
        }


        /*
          Si escribió cancelar pero ya no
          había ninguna carrera activa.
        */

        await enviarTextoWhatsApp(
            telefono,

            "No tienes una carrera activa en este momento."
        );


        return;
    }


    /*
      ======================================
      4. CLIENTE NUEVO
      ======================================
    */

    if (!cliente) {

        /*
          PRIMER MENSAJE DE TODA SU VIDA.
    
          Puede ser:
          - hola
          - texto
          - directamente ubicación
    
          Si manda ubicación primero,
          la guardamos mientras preguntamos
          su nombre.
        */

        if (!conversacion) {
            const ubicacionRecibida =
                tieneUbicacion(input);

            const ubicacionDentroDeChone =
                ubicacionRecibida
                    ? ubicacionPermitidaEnChone(
                        input
                    )
                    : false;

            const referenciaUbicacion =
                ubicacionDentroDeChone
                    ? await obtenerReferenciaProcesada(
                        input
                    )
                    : null;


            conversacion =
                await prisma
                    .conversacionWhatsApp
                    .create({

                        data: {
                            telefono,

                            nombre:
                                input.nombre?.trim() ||
                                null,

                            estado:
                                "ESPERANDO_NOMBRE",

                            latitud:
                                ubicacionDentroDeChone
                                    ? input.latitud
                                    : null,

                            longitud:
                                ubicacionDentroDeChone
                                    ? input.longitud
                                    : null,

                            referencia:
                                referenciaUbicacion,
                        },
                    });


            if (
                ubicacionRecibida &&
                !ubicacionDentroDeChone
            ) {
                await avisarFueraDeCobertura(
                    telefono
                );
            }


            await enviarTextoWhatsApp(
                telefono,

                "👋 ¡Hola! Bienvenido a Rapitaxi.\nPara registrarte, ¿cómo te llamas?"
            );


            return;
        }


        /*
          Ya habíamos preguntado el nombre.
        */

        if (
            conversacion.estado ===
            "ESPERANDO_NOMBRE"
        ) {
            const nombre =
                extraerNombreExplicito(
                    input
                ) ||
                formatearNombre(
                    String(
                        input.texto || ""
                    )
                );

            if (!nombre) {
                await enviarTextoWhatsApp(
                    telefono,

                    "Por favor, escríbeme tu nombre para continuar."
                );


                return;
            }


            /*
              Registramos el cliente.
            */

            cliente =
                await prisma.cliente.create({
                    data: {
                        whatsapp:
                            telefono,

                        nombre,
                    },
                });


            const yaTenemosUbicacion =
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
                                cliente.id,

                            estado:
                                yaTenemosUbicacion
                                    ? "ESPERANDO_PAGO"
                                    : "ESPERANDO_UBICACION",
                        },
                    });


            /*
              Si envió ubicación antes de
              decir el nombre, ya no la
              volvemos a pedir.
            */

            if (
                yaTenemosUbicacion
            ) {
                await enviarOpcionesPago(
                    telefono
                );

            } else {

                await solicitarUbicacionWhatsApp(
                    telefono,

                    `Ok ${nombre}. ✅ Envíame tu ubicación actual para solicitar tu taxi.📍`
                );
            }


            return;
        }


        /*
          Protección ante una conversación
          antigua o inconsistente.
        */

        await prisma
            .conversacionWhatsApp
            .update({

                where: {
                    telefono,
                },

                data: {
                    estado:
                        "ESPERANDO_NOMBRE",

                    clienteId:
                        null,
                },
            });


        await enviarTextoWhatsApp(
            telefono,

            "Para continuar, ¿cómo te llamas?"
        );


        return;
    }


    /*
      ======================================
      5. CLIENTE EXISTENTE SIN
         CONVERSACIÓN
      ======================================
    */

    if (!conversacion) {
        conversacion =
            await prisma
                .conversacionWhatsApp
                .create({

                    data: {
                        telefono,

                        nombre:
                            cliente.nombre,

                        clienteId:
                            cliente.id,

                        estado:
                            "NUEVO",
                    },
                });
    }
    /*
      ======================================
      CAMBIO DE NOMBRE
      ======================================
    */


    /*
      Si previamente dijo algo como:
      "Ese no es mi nombre"
    
      y estaba en estado NUEVO,
      esperamos solamente su nombre.
    */

    if (
        conversacion.estado ===
        "ESPERANDO_CAMBIO_NOMBRE"
    ) {
        const nuevoNombre =
            extraerNombreExplicito(
                input
            ) ||
            formatearNombre(
                String(
                    input.texto || ""
                )
            );


        if (!nuevoNombre) {
            await enviarTextoWhatsApp(
                telefono,

                "😊 Dime solamente tu nombre. Por ejemplo: Kevin."
            );


            return;
        }


        await guardarNuevoNombre(
            cliente.id,
            telefono,
            nuevoNombre
        );


        conversacion =
            await prisma
                .conversacionWhatsApp
                .update({

                    where: {
                        telefono,
                    },

                    data: {
                        nombre:
                            nuevoNombre,

                        estado:
                            "NUEVO",
                    },
                });


        cliente =
            await prisma
                .cliente
                .findUnique({
                    where: {
                        id:
                            cliente.id,
                    },
                });


        await enviarTextoWhatsApp(
            telefono,

            `✅ Listo. Desde ahora te llamaré ${nuevoNombre}. 😊`
        );


        return;
    }


    /*
      Cambio directo:
    
      "Mi nombre es Kevin"
      "Me llamo Kevin"
      "Cámbiame el nombre a Kevin"
    */

    const nuevoNombreExplicito =
        extraerNombreExplicito(
            input
        );


    if (
        nuevoNombreExplicito &&
        nuevoNombreExplicito !==
        cliente.nombre
    ) {
        await guardarNuevoNombre(
            cliente.id,
            telefono,
            nuevoNombreExplicito
        );


        /*
          Actualizamos también el objeto local
          porque podría seguir utilizándose
          durante este mismo webhook.
        */

        cliente = {
            ...cliente,

            nombre:
                nuevoNombreExplicito,
        };


        await enviarTextoWhatsApp(
            telefono,

            `✅ Listo. Desde ahora te llamaré ${nuevoNombreExplicito}. 😊`
        );


        return;
    }


    /*
      Si solo dice:
    
      "Ese no es mi nombre"
      "No me llamo así"
    
      podemos usar un estado especial siempre
      que no esté en mitad de la solicitud de taxi.
    */

    if (
        solicitaCorregirNombre(
            input
        )
    ) {
        if (
            conversacion.estado ===
            "NUEVO"
        ) {
            conversacion =
                await prisma
                    .conversacionWhatsApp
                    .update({

                        where: {
                            telefono,
                        },

                        data: {
                            estado:
                                "ESPERANDO_CAMBIO_NOMBRE",
                        },
                    });


            await enviarTextoWhatsApp(
                telefono,

                "😊 Claro. ¿Cómo te llamas?"
            );


            return;
        }


        /*
          Si estaba seleccionando ubicación,
          pago o tenía otro proceso en curso,
          NO cambiamos el estado y no dañamos
          la solicitud de taxi.
        */

        await enviarTextoWhatsApp(
            telefono,

            '😊 Claro. Escríbeme por ejemplo: "Mi nombre es Kevin" y lo corregiré.'
        );


        return;
    }


    /*
      ======================================
      RAPI OPINA DE TI
      ======================================
    */

    if (
        esSolicitudOpinionRapi(
            input
        )
    ) {
        await procesarOpinionRapi(
            cliente,
            telefono
        );


        return;
    }

    /*
      ======================================
      6. CARRERA EN CURSO
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
            cliente.nombre
        );


        return;
    }


    /*
      ======================================
      7. ESTADO NUEVO
      ======================================
  
      Este es también el estado al que
      volverá automáticamente después de
      30 minutos.
  
      Si manda ubicación directamente:
      usamos esa ubicación.
  
      Si manda "hola":
      le pedimos ubicación.
    */

    if (
        conversacion.estado ===
        "NUEVO"
    ) {
        if (
            tieneUbicacion(input)
        ) {
            if (
                !ubicacionPermitidaEnChone(
                    input
                )
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

                            latitud:
                                null,

                            longitud:
                                null,

                            referencia:
                                null,
                        },
                    });


                await avisarFueraDeCobertura(
                    telefono
                );


                return;
            }


            const referenciaUbicacion =
                await obtenerReferenciaProcesada(
                    input
                );

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
                            referenciaUbicacion,

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

                    latitud:
                        null,

                    longitud:
                        null,

                    referencia:
                        null,
                },
            });


        await solicitarUbicacionWhatsApp(
            telefono,

            `Hola ${cliente.nombre} 👋🚖 Envíame tu ubicación actual para pedir un taxi.`
        );


        return;
    }


    /*
      ======================================
      8. ESPERANDO UBICACIÓN
      ======================================
    */

    if (
        conversacion.estado ===
        "ESPERANDO_UBICACION"
    ) {

        if (
            !tieneUbicacion(input)
        ) {

            await solicitarUbicacionWhatsApp(
                telefono,

                "📍 Necesito que me envíes tu ubicación actual para continuar."
            );


            return;
        }


        /*
          Validamos que la ubicación esté
          dentro de la cobertura de Chone.
        */

        if (
            !ubicacionPermitidaEnChone(
                input
            )
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

                        latitud:
                            null,

                        longitud:
                            null,

                        referencia:
                            null,
                    },
                });


            await avisarFueraDeCobertura(
                telefono
            );


            return;
        }


        /*
          Convertimos las coordenadas GPS
          en una referencia legible.
        */

        const referenciaUbicacion =
            await obtenerReferenciaProcesada(
                input
            );


        conversacion =
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
                            referenciaUbicacion,

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
      9. ESPERANDO FORMA DE PAGO
      ======================================
    */

    if (
        conversacion.estado ===
        "ESPERANDO_PAGO"
    ) {
        const formaPago =
            obtenerFormaPago(
                input
            );


        /*
          Si escribió otra cosa,
          volvemos a mostrar botones.
        */

        if (!formaPago) {
            await enviarOpcionesPago(
                telefono
            );


            return;
        }


        /*
          Protección por si la ubicación
          desapareciera por cualquier motivo.
        */

        if (
            conversacion.latitud ===
            null ||

            conversacion.longitud ===
            null
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
                telefono,

                "📍 Vuelve a enviarme tu ubicación para continuar."
            );


            return;
        }


        /*
          ====================================
          BLOQUEO ANTI DUPLICADOS
          ====================================
    
          Antes de crear la carrera pasamos
          ESPERANDO_PAGO -> BUSCANDO_TAXI.
    
          Si Kapso reenvía el mismo webhook,
          solamente uno consigue hacer el
          cambio y crear la carrera.
        */

        const bloqueo =
            await prisma
                .conversacionWhatsApp
                .updateMany({

                    where: {
                        telefono,

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

            /*
              Crear carrera.
            */

            const carrera =
                await crearCarrera({
                    nombreCliente:
                        cliente.nombre,

                    whatsappCliente:
                        telefono,

                    latitud:
                        conversacion.latitud,

                    longitud:
                        conversacion.longitud,

                    referencia:
                        conversacion.referencia ||
                        "Ubicación enviada por WhatsApp",

                    formaPago,
                });


            /*
              Asociar carrera con Cliente.
            */

            await prisma.carrera.update({
                where: {
                    id:
                        carrera.id,
                },

                data: {
                    clienteId:
                        cliente.id,
                },
            });


            /*
              Guardar la carrera activa
              dentro de la conversación.
            */

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


            /*
              Confirmación al cliente.
            */

            await enviarTextoWhatsApp(
                telefono,

                `🚖 Listo ${cliente.nombre}, Ahora estoy buscando taxi, enseguida te confirmo.`
            );


            return;

        } catch (error) {

            /*
              Si crear la carrera falla,
              devolvemos la conversación a
              ESPERANDO_PAGO.
      
              Así el cliente no queda atrapado
              eternamente en BUSCANDO_TAXI.
            */

            console.error(
                "Error creando carrera desde WhatsApp:",
                error
            );


            await prisma
                .conversacionWhatsApp
                .updateMany({

                    where: {
                        telefono,

                        estado:
                            "BUSCANDO_TAXI",
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
      10. COMPATIBILIDAD CON ESTADO
          ESPERANDO_CALIFICACION
      ======================================
  
      Ya no vamos a depender de este estado,
      porque la conversación se libera
      automáticamente.
  
      Pero si quedó algún registro antiguo
      con este estado, lo recuperamos.
    */

    if (
        conversacion.estado ===
        "ESPERANDO_CALIFICACION"
    ) {
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


        await solicitarUbicacionWhatsApp(
            telefono,

            `Hola ${cliente.nombre} 👋🚖 Envíame tu ubicación actual para pedir un taxi.`
        );


        return;
    }


    /*
      ======================================
      RESPALDO
      ======================================
    */

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


    await solicitarUbicacionWhatsApp(
        telefono,

        `Hola ${cliente.nombre} 👋🚖 Envíame tu ubicación actual para pedir un taxi.`
    );
}