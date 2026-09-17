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
    enviarStickerWhatsApp,
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


const LIMITE_UBICACION_MS =
    5 * 60 * 1000;


/*
  ========================================
  TOQUE DE QUEDA
  ========================================

  Horario de Rapitaxi:
  00:00 hasta 05:00
  Zona horaria: Ecuador continental
*/

function estamosEnToqueDeQueda() {

    const horaTexto =
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
        ).format(
            new Date()
        );


    const hora =
        Number(
            horaTexto
        );


    return (
        hora >= 0 &&
        hora < 5
    );
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
  CUPONES ÚNICOS RAPITAXI
  ========================================

  5 códigos internos de prueba +
  50 códigos reales de campaña.

  Cada código puede quedar RESERVADO/USADO
  una sola vez globalmente.
*/

const CODIGOS_CUPON = [
    /*
      ========================================
      CÓDIGOS INTERNOS DE PRUEBA
      ========================================
    */

    "TESTRAPI1",
    "TESTRAPI2",
    "TESTRAPI3",
    "TESTRAPI4",
    "TESTRAPI5",


    /*
      ========================================
      50 CÓDIGOS REALES DE CAMPAÑA
      ========================================

      Formato:
      RAPI + 4 dígitos

      Ejemplo:
      RAPI9835
    */

    "RAPI9835",
    "RAPI2741",
    "RAPI6183",
    "RAPI4527",
    "RAPI7319",
    "RAPI8054",
    "RAPI1962",
    "RAPI3478",
    "RAPI5291",
    "RAPI8642",

    "RAPI2157",
    "RAPI6934",
    "RAPI4785",
    "RAPI9216",
    "RAPI3548",
    "RAPI7861",
    "RAPI1439",
    "RAPI5672",
    "RAPI8325",
    "RAPI4096",

    "RAPI6753",
    "RAPI2814",
    "RAPI9587",
    "RAPI3246",
    "RAPI7108",
    "RAPI5463",
    "RAPI1895",
    "RAPI6372",
    "RAPI8421",
    "RAPI3957",

    "RAPI7246",
    "RAPI5103",
    "RAPI2689",
    "RAPI9364",
    "RAPI4712",
    "RAPI6538",
    "RAPI1074",
    "RAPI8259",
    "RAPI3425",
    "RAPI7986",

    "RAPI2148",
    "RAPI5693",
    "RAPI9037",
    "RAPI4861",
    "RAPI7524",
    "RAPI1386",
    "RAPI6247",
    "RAPI8753",
    "RAPI3019",
    "RAPI9472"
] as const;

const CODIGOS_CUPON_SET =
    new Set<string>(CODIGOS_CUPON);

function extraerCodigoCupon(
    input: MensajeWhatsAppInput
) {
    const texto =
        String(
            input.texto || ""
        )
            .trim()
            .toUpperCase();

    if (!texto) {
        return null;
    }

    for (
        const codigo
        of CODIGOS_CUPON
    ) {
        if (
            texto.includes(
                codigo
            )
        ) {
            return codigo;
        }
    }

    return null;
}

async function obtenerEstadoCuponUnico(
    codigo: string,
    telefono: string
) {
    if (
        !CODIGOS_CUPON_SET.has(
            codigo
        )
    ) {
        return {
            valido: false as const,
            motivo:
                "INVALIDO" as const,
        };
    }

    const usoDelWhatsapp =
        await prisma.cuponUso.findFirst({
            where: {
                whatsapp:
                    telefono,
                estado: {
                    in: [
                        "RESERVADO",
                        "USADO",
                    ],
                },
            },
        });

    if (
        usoDelWhatsapp &&
        usoDelWhatsapp.codigo !==
        codigo
    ) {
        return {
            valido: false as const,
            motivo:
                "YA_USADO" as const,
        };
    }


    const usoGlobal =
        await prisma.cuponUso.findFirst({
            where: {
                codigo,
                estado: {
                    in: [
                        "RESERVADO",
                        "USADO",
                    ],
                },
            },
        });

    if (
        usoGlobal?.estado ===
        "USADO"
    ) {
        return {
            valido: false as const,
            motivo:
                "YA_USADO" as const,
        };
    }

    if (
        usoGlobal?.estado ===
        "RESERVADO"
    ) {
        if (
            usoGlobal.whatsapp ===
            telefono
        ) {
            return {
                valido: true as const,
                motivo:
                    "YA_RESERVADO" as const,
            };
        }

        return {
            valido: false as const,
            motivo:
                "YA_USADO" as const,
        };
    }

    return {
        valido: true as const,
        motivo:
            "DISPONIBLE" as const,
    };
}

async function reservarCuponUnico(
    codigo: string,
    telefono: string
) {
    return prisma.$transaction(
        async (tx) => {
            if (
                !CODIGOS_CUPON_SET.has(
                    codigo
                )
            ) {
                return false;
            }

            const otroUsoDelWhatsapp =
                await tx.cuponUso.findFirst({
                    where: {
                        whatsapp:
                            telefono,
                        estado: {
                            in: [
                                "RESERVADO",
                                "USADO",
                            ],
                        },
                        NOT: {
                            codigo,
                        },
                    },
                });

            if (otroUsoDelWhatsapp) {
                return false;
            }


            const ocupado =
                await tx.cuponUso.findFirst({
                    where: {
                        codigo,
                        estado: {
                            in: [
                                "RESERVADO",
                                "USADO",
                            ],
                        },
                    },
                });

            if (ocupado) {
                return (
                    ocupado.estado ===
                    "RESERVADO" &&
                    ocupado.whatsapp ===
                    telefono
                );
            }

            const existenteCliente =
                await tx.cuponUso.findUnique({
                    where: {
                        codigo_whatsapp: {
                            codigo,
                            whatsapp:
                                telefono,
                        },
                    },
                });

            if (
                existenteCliente?.estado ===
                "USADO"
            ) {
                return false;
            }

            await tx.cuponUso.upsert({
                where: {
                    codigo_whatsapp: {
                        codigo,
                        whatsapp:
                            telefono,
                    },
                },

                create: {
                    codigo,
                    whatsapp:
                        telefono,
                    estado:
                        "RESERVADO",
                    descuento:
                        0.50,
                },

                update: {
                    estado:
                        "RESERVADO",
                    descuento:
                        0.50,
                    fechaReserva:
                        new Date(),
                    fechaUso:
                        null,
                    fechaLiberado:
                        null,
                    carreraId:
                        null,
                },
            });

            return true;
        }
    );
}

async function liberarReservaCuponUnico(
    codigo: string,
    telefono: string
) {
    await prisma.cuponUso.updateMany({
        where: {
            codigo,
            whatsapp:
                telefono,
            estado:
                "RESERVADO",
            carreraId:
                null,
        },

        data: {
            estado:
                "LIBERADO",
            fechaLiberado:
                new Date(),
        },
    });
}

async function responderCuponNoDisponible(
    telefono: string,
    motivo:
        "YA_USADO" |
        "INVALIDO"
) {
    if (
        motivo ===
        "INVALIDO"
    ) {
        await enviarTextoWhatsApp(
            telefono,
            "🎟️ Ese código promocional no es válido. Revisa el código personal que recibiste de Rapitaxi. 💜🚕"
        );
        return;
    }

    await enviarTextoWhatsApp(
        telefono,
        "🎟️ Ese código promocional ya fue reservado o utilizado. Cada código personal funciona una sola vez. 💜🚕"
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
            "Tú siempre pides el taxi y recién ahí te acuerdas de que todavía no estas listo 😂😂",
    },
    {
        id: 2,
        texto:
            "Tú siempre dices que ya sales y el taxi ya lleva rato esperándote afuera 😂😂",
    },
    {
        id: 3,
        texto:
            "Tú siempre ves que el taxi ya llegó y justo ahí empiezas a despedirte 😂😂",
    },
    {
        id: 4,
        texto:
            "Tú siempre calculas salir con tiempo y terminas apurado igual 😂😂",
    },
    {
        id: 5,
        texto:
            "Tú siempre te acuerdas del baño justo cuando el taxi ya está afuera 😂😂",
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
        "rapi opina sobre mi",
        "rapi que opinas de mi",
        "rapi que opinas sobre mi",
        "que opinas de mi",
        "que opinas sobre mi",
        "opina de mi",
        "opina sobre mi",
        "dime que opinas de mi",
        "dime que opinas sobre mi",
        "dime que piensas de mi",
        "dime que piensas sobre mi",
        "que piensas de mi",
        "que piensas sobre mi",
        "rapi dime que piensas de mi",
        "rapi dime que piensas sobre mi",
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
      ========================================
      MENSAJE 1
      FRASE DE RAPI
      ========================================
    */
    await enviarTextoWhatsApp(
        telefono,

        `${opinion.texto}😂😂`
    );

    /*
      ========================================
      STICKER
      ========================================
    */
    await enviarStickerWhatsApp(
        telefono
    );

    /*
      ========================================
      MENSAJE 2
      INSTRUCCIONES DE CAMPAÑA
      ========================================
    */
    await enviarTextoWhatsApp(
        telefono,

        `¿QUÉ DIJO RAPI DE TI? 👀😂\n\n` +
        `Sigue los pasos y tu próxima carrera costará solo $1:\n\n` +
        `1. 💜 Sigue a @apprapitaxi en Instagram.\n` +
        `2. 📸 Sube el screenshot de la respuesta de Rapi a tu historia y menciónanos.\n\n` +
        `🎟️ ¡Listo! Te enviamos tu cupón por DM.\n\n` +
        `Aplican términos y condiciones.`
    );
}


async function guardarNuevoNombre(
    clienteId: number,
    telefono: string,
    nuevoNombre: string
) {
    /*
      Actualizamos:

      1. Cliente
      2. Conversación
      3. Cualquier carrera que siga activa

      No modificamos el estado de nada.
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

        prisma.carrera.updateMany({
            where: {
                whatsappCliente:
                    telefono,

                estado: {
                    in: [
                        "BUSCANDO",
                        "ASIGNADA",
                        "EN_CAMINO",
                        "CERCA",
                        "LLEGO",
                    ],
                },
            },

            data: {
                nombreCliente:
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

async function procesarBotonOpinionRapi(
    input: MensajeWhatsAppInput,
    telefono: string
) {
    const boton =
        String(
            input.botonId || ""
        ).trim();


    const coincidencia =
        boton.match(
            /^rapi_opinion_(\d+)$/
        );


    if (!coincidencia) {
        return false;
    }


    const carreraId =
        Number(
            coincidencia[1]
        );


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

                clienteId:
                    true,
            },
        });


    /*
      Si la carrera ya no existe,
      absorbemos igualmente el botón
      para que no entre al flujo normal.
    */

    if (!carrera) {
        return true;
    }


    /*
      Seguridad:
      el botón debe pertenecer al mismo
      número que hizo la carrera.
    */

    if (
        normalizarTelefono(
            carrera.whatsappCliente
        ) !== telefono
    ) {
        return true;
    }


    /*
      La opinión solo corresponde a
      una carrera que ya terminó.
    */

    if (
        carrera.estado !==
        "COMPLETADA"
    ) {
        return true;
    }


    if (!carrera.clienteId) {
        return true;
    }


    const cliente =
        await prisma.cliente.findUnique({
            where: {
                id:
                    carrera.clienteId,
            },
        });


    if (!cliente) {
        return true;
    }


    await procesarOpinionRapi(
        cliente,
        telefono
    );


    return true;
}

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
  VENCIMIENTO DE UBICACIONES PENDIENTES
  ========================================

  La ubicación enviada por el cliente solo
  puede utilizarse durante 5 minutos mientras
  esperamos el método de pago.

  server.ts puede ejecutar esta función
  periódicamente para invalidar solicitudes
  abandonadas incluso si el cliente no vuelve
  a escribir.
*/

export async function vencerUbicacionesPendientes() {

    const toqueDeQueda =
        estamosEnToqueDeQueda();


    const limite =
        new Date(
            Date.now() -
            LIMITE_UBICACION_MS
        );


    const pendientes =
        await prisma
            .conversacionWhatsApp
            .findMany({

                where: {
                    estado:
                        "ESPERANDO_PAGO",

                    OR: [
                        {
                            fechaUbicacion: {
                                lte:
                                    limite,
                            },
                        },
                        {
                            fechaUbicacion:
                                null,
                        },
                    ],
                },

                select: {
                    telefono:
                        true,
                },
            });


    for (
        const pendiente
        of pendientes
    ) {

        const resultado =
            await prisma
                .conversacionWhatsApp
                .updateMany({

                    where: {
                        telefono:
                            pendiente.telefono,

                        estado:
                            "ESPERANDO_PAGO",

                        OR: [
                            {
                                fechaUbicacion: {
                                    lte:
                                        limite,
                                },
                            },
                            {
                                fechaUbicacion:
                                    null,
                            },
                        ],
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

                        fechaUbicacion:
                            null,
                    },
                });


        if (
            resultado.count > 0 &&
            !toqueDeQueda
        ) {

            try {
                await solicitarUbicacionWhatsApp(
                    pendiente.telefono,

                    "⏱️ Ya pasaron 5 minutos desde que compartiste tu ubicación. 📍 Vuelve a confirmar tu ubicación actual para continuar con la solicitud."
                );

            } catch (error) {

                console.error(
                    "Error avisando vencimiento de ubicación:",
                    pendiente.telefono,
                    error
                );
            }
        }
    }
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
      TOQUE DE QUEDA
      ======================================

      Entre las 00:00 y las 05:00
      no se inicia ni continúa ninguna
      solicitud de taxi.

      El cliente recibe solamente este
      mensaje informativo.
    */

    if (
        estamosEnToqueDeQueda()
    ) {

        await enviarTextoWhatsApp(
            telefono,

            "🌙 En este momento Rapitaxi no está prestando servicio debido al horario de toque de queda.\n\nEstamos respetando las disposiciones vigentes.\n\n🚕 Nuestro servicio se reanudará a partir de las 05:00.\n\nGracias por tu comprensión. 💜"
        );


        return;
    }


    const fueOpinionRapi =
        await procesarBotonOpinionRapi(
            input,
            telefono
        );


    if (fueOpinionRapi) {
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
      RAPICUPON EN MENSAJE
      ======================================
    
      Puede venir como:
    
      RAPICUPON
    
      Hola tengo RAPICUPON
    
      Quiero usar el cupón RAPICUPON
    */

    const codigoCuponMensaje =
        extraerCodigoCupon(
            input
        );

    const mensajeTieneCupon =
        Boolean(
            codigoCuponMensaje
        );

    const textoCuponNormalizado =
        String(
            input.texto || ""
        )
            .trim()
            .toUpperCase();

    if (
        !codigoCuponMensaje &&
        textoCuponNormalizado.includes(
            "RAPICUPON"
        )
    ) {
        await enviarTextoWhatsApp(
            telefono,
            "🎟️ El código general RAPICUPON fue desactivado. Para obtener el descuento necesitas tu código personal entregado por Rapitaxi. 💜🚕"
        );
        return;
    }


    if (
        codigoCuponMensaje
    ) {
        const estadoCupon =
            await obtenerEstadoCuponUnico(
                codigoCuponMensaje,
                telefono
            );


        if (!estadoCupon.valido) {
            await responderCuponNoDisponible(
                telefono,
                estadoCupon.motivo === "YA_USADO"
                    ? "YA_USADO"
                    : "INVALIDO"
            );


            return;
        }


        /*
          Si ya tiene una carrera creada,
          es demasiado tarde para aplicar
          descuento a esa carrera.
        */

        if (
            conversacion &&
            (
                conversacion.estado ===
                "BUSCANDO_TAXI" ||

                conversacion.estado ===
                "CARRERA_ACTIVA"
            )
        ) {
            await enviarTextoWhatsApp(
                telefono,

                `🎟️ Tu código ${codigoCuponMensaje} es válido, pero debes ingresarlo antes de que se genere tu carrera. Podrás usarlo en tu próxima solicitud. 🚕`
            );


            return;
        }


        /*
          Si ya existe conversación,
          guardamos inmediatamente el cupón.
        */

        if (conversacion) {
            conversacion =
                await prisma
                    .conversacionWhatsApp
                    .update({

                        where: {
                            telefono,
                        },

                        data: {
                            cuponPendiente:
                                codigoCuponMensaje,
                        },
                    });
        }
    }
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


                await prisma.cuponUso.updateMany({
                    where: {
                        carreraId:
                            carrera.id,

                        estado:
                            "RESERVADO",
                    },

                    data: {
                        estado:
                            "LIBERADO",

                        fechaLiberado:
                            new Date(),

                        carreraId:
                            null,
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

                            fechaUbicacion:
                                null,

                            cuponPendiente:
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

                            cuponPendiente:
                                codigoCuponMensaje,

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

                            fechaUbicacion:
                                ubicacionDentroDeChone
                                    ? new Date()
                                    : null,
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

                mensajeTieneCupon
                    ? `🎟️ ¡Código ${codigoCuponMensaje} reconocido! Tendrás $0,50 de descuento y pagarás solo $1,00 en esta carrera. ✅\n\n👋 Para registrarte, ¿cómo te llamas?`
                    : "👋 ¡Hola! Bienvenido a Rapitaxi.\nPara registrarte, ¿cómo te llamas?");


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
                conversacion.cuponPendiente &&
                CODIGOS_CUPON_SET.has(
                    conversacion.cuponPendiente
                )
            ) {
                await solicitarUbicacionWhatsApp(
                    telefono,

                    `🎟️ ¡Código ${conversacion.cuponPendiente} reconocido, ${cliente.nombre}! ✅\n\nEn esta carrera pagarás solo $1,00 en lugar de $1,50.\n\n📍 Envíame tu ubicación actual para continuar.`
                );


                await prisma
                    .conversacionWhatsApp
                    .update({

                        where: {
                            telefono,
                        },

                        data: {
                            estado:
                                "ESPERANDO_UBICACION",

                            cuponPendiente:
                                conversacion.cuponPendiente,

                            latitud:
                                null,

                            longitud:
                                null,

                            referencia:
                                null,

                            fechaUbicacion:
                                null,
                        },
                    });


                return;
            }
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
            mensajeTieneCupon
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
                                "ESPERANDO_UBICACION",

                            cuponPendiente:
                                codigoCuponMensaje,

                            latitud:
                                null,

                            longitud:
                                null,

                            referencia:
                                null,

                            fechaUbicacion:
                                null,
                        },
                    });


            await solicitarUbicacionWhatsApp(
                telefono,

                `🎟️ ¡Código promocional reconocido, ${cliente.nombre}! ✅\n\nEn esta carrera pagarás solo $1,00 en lugar de $1,50.\n\n📍 Envíame tu ubicación actual para continuar.`
            );


            return;
        }


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

                            fechaUbicacion:
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

                        fechaUbicacion:
                            new Date(),

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

                    fechaUbicacion:
                        null,
                },
            });


        await solicitarUbicacionWhatsApp(
            telefono,

            `Hola ${cliente.nombre} 👋🚖 Envíame tu ubicación actual para pedir un taxi. 📍\n\nSi tu nombre no es correcto, escríbeme: "Me llamo [tu nombre]".`
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

                mensajeTieneCupon
                    ? `🎟️ ¡Código promocional reconocido, ${cliente.nombre}! ✅\n\nEn esta carrera pagarás solo $1,00 en lugar de $1,50.\n\n📍 Envíame tu ubicación actual para continuar.`
                    : `Hola ${cliente.nombre}, 📍 necesito que me envíes tu ubicación actual para continuar.`
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

                        fechaUbicacion:
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

                        fechaUbicacion:
                            new Date(),

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
        const fechaUbicacion =
            conversacion.fechaUbicacion
                ? new Date(
                    conversacion.fechaUbicacion
                )
                : null;


        const ubicacionExpirada =
            !fechaUbicacion ||
            (
                Date.now() -
                fechaUbicacion.getTime()
            ) >= LIMITE_UBICACION_MS;


        if (ubicacionExpirada) {
            conversacion =
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

                            fechaUbicacion:
                                null,
                        },
                    });


            await solicitarUbicacionWhatsApp(
                telefono,

                "⏱️ Ya pasaron 5 minutos desde que compartiste tu ubicación. 📍 Vuelve a confirmar tu ubicación actual para continuar con la solicitud."
            );


            return;
        }


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

                        latitud:
                            null,

                        longitud:
                            null,

                        referencia:
                            null,

                        fechaUbicacion:
                            null,
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


        let cuponReservado =
            false;

        const codigoCuponPendiente =
            conversacion.cuponPendiente;


        try {

            const quiereUsarCupon =
                Boolean(
                    codigoCuponPendiente &&
                    CODIGOS_CUPON_SET.has(
                        codigoCuponPendiente
                    )
                );


            if (
                quiereUsarCupon
            ) {
                cuponReservado =
                    await reservarCuponUnico(
                        codigoCuponPendiente!,
                        telefono
                    );


                if (!cuponReservado) {
                    await enviarTextoWhatsApp(
                        telefono,

                        "🎟️ Ese código ya fue reservado o utilizado. Tu solicitud continuará con la tarifa normal de $1,50. 🚕"
                    );
                }
            }


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

            await prisma.$transaction(
                async (tx) => {

                    await tx.carrera.update({
                        where: {
                            id:
                                carrera.id,
                        },

                        data: {
                            clienteId:
                                cliente.id,

                            cuponCodigo:
                                cuponReservado
                                    ? codigoCuponPendiente
                                    : null,

                            descuentoCupon:
                                cuponReservado
                                    ? 0.50
                                    : null,
                        },
                    });


                    if (
                        cuponReservado
                    ) {
                        await tx.cuponUso.update({
                            where: {
                                codigo_whatsapp: {
                                    codigo:
                                        codigoCuponPendiente!,

                                    whatsapp:
                                        telefono,
                                },
                            },

                            data: {
                                carreraId:
                                    carrera.id,
                            },
                        });
                    }
                }
            );


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

                        cuponPendiente:
                            null,
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


            if (
                cuponReservado
            ) {
                if (codigoCuponPendiente) {
                    await liberarReservaCuponUnico(
                        codigoCuponPendiente,
                        telefono
                    );
                }
            }


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

                    fechaUbicacion:
                        null,
                },
            });


        await solicitarUbicacionWhatsApp(
            telefono,

            `Hola ${cliente.nombre} 👋🚖 Envíame tu ubicación actual para pedir un taxi. 📍\n\nSi tu nombre no es correcto, escríbeme: "Me llamo [tu nombre]".`
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

                fechaUbicacion:
                    null,
            },
        });


    await solicitarUbicacionWhatsApp(
        telefono,

        `Hola ${cliente.nombre} 👋🚖 Envíame tu ubicación actual para pedir un taxi. 📍\n\nSi tu nombre no es correcto, escríbeme: "Me llamo [tu nombre]".`
    );
}