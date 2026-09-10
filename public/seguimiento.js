const parametros =
    new URLSearchParams(
        window.location.search
    );


/*
  ========================================
  TOKEN DE SEGUIMIENTO
  ========================================

  Admitimos ambas URLs:

  NUEVA:
  /s/TOKEN

  ANTIGUA:
  /seguimiento.html?token=TOKEN
*/

let token =
    parametros.get(
        "token"
    );


if (
    !token
) {

    const coincidencia =
        window.location.pathname
            .match(
                /^\/s\/([^/]+)\/?$/
            );


    if (
        coincidencia &&
        coincidencia[1]
    ) {

        token =
            decodeURIComponent(
                coincidencia[1]
            );
    }
}
if (!token) {
    document.body.innerHTML = `
    <div class="error">
      <h2>Enlace no válido</h2>
      <p>
        Este enlace de seguimiento no contiene
        un token válido.
      </p>
    </div>
  `;

    throw new Error(
        "TRACKING_TOKEN_FALTANTE"
    );
}


/*
  ========================================
  MAPA
  ========================================
*/

const map =
    L.map(
        "map",
        {
            zoomControl: true,
        }
    )
        .setView(
            [-0.6985, -80.0925],
            15
        );


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            "&copy; OpenStreetMap",
    }
).addTo(map);


/*
  ========================================
  ICONOS PERSONALIZADOS
  ========================================
*/

const svgTaxi = `
  <svg
    viewBox="0 0 64 64"
    aria-hidden="true"
  >
    <path
      d="
        M18 18h28l6 14v17h-5
        a7 7 0 0 1-14 0h-2
        a7 7 0 0 1-14 0h-5V32l6-14Zm4 5-4 9h28l-4-9H22Zm2 21
        a4 4 0 1 0 0 8
        a4 4 0 0 0 0-8Zm16 0
        a4 4 0 1 0 0 8
        a4 4 0 0 0 0-8Z
      "
    />
  </svg>
`;


const svgPin = `
  <svg
    viewBox="0 0 64 64"
    aria-hidden="true"
  >
    <path
      d="
        M32 5C20.4 5 11 14.4 11 26
        c0 15.5 18.4 31.2 19.2 31.9
        a2.8 2.8 0 0 0 3.6 0
        C34.6 57.2 53 41.5 53 26
        C53 14.4 43.6 5 32 5Zm0 29
        a8 8 0 1 1 0-16
        a8 8 0 0 1 0 16Z
      "
    />
  </svg>
`;


const iconoTaxi =
    L.divIcon({
        className:
            "taxi-marker",

        html:
            `<div class="marker-bubble taxi">${svgTaxi}</div>`,

        iconSize:
            [48, 56],

        iconAnchor:
            [24, 54],

        popupAnchor:
            [0, -51],
    });


const iconoCliente =
    L.divIcon({
        className:
            "client-marker",

        html:
            `<div class="marker-bubble client">${svgPin}</div>`,

        iconSize:
            [48, 56],

        iconAnchor:
            [24, 54],

        popupAnchor:
            [0, -51],
    });


let marcadorTaxi =
    null;

let marcadorCliente =
    null;

let lineaRuta =
    null;

let ultimaRutaKey =
    null;

let actualizando =
    false;

let intervaloSeguimiento =
    null;
/*
  ========================================
  ESTADOS
  ========================================
*/

function textoEstado(
    estado
) {
    switch (
    estado
    ) {
        case "ASIGNADA":
            return "Tu taxi fue asignado";

        case "EN_CAMINO":
            return "Tu taxi viene en camino";

        case "CERCA":
            return "Tu taxi está cerca";

        case "LLEGO":
            return "Tu taxi está llegando";

        case "COMPLETADA":
            return "Carrera finalizada";

        case "CANCELADA":
            return "Carrera cancelada";

        default:
            return "Seguimiento activo";
    }
}


function actualizarEstadoVisual(
    estado
) {
    const estadoTexto =
        document.getElementById(
            "estadoTexto"
        );

    const mapEstado =
        document.getElementById(
            "mapEstado"
        );

    const texto =
        textoEstado(
            estado
        );

    if (
        estadoTexto
    ) {
        estadoTexto.textContent =
            texto;
    }

    if (
        mapEstado
    ) {
        mapEstado.textContent =
            texto;
    }
}


/*
  ========================================
  RUTA
  ========================================
*/

function crearRutaKey(
    taxi,
    destino
) {
    return [
        Number(
            taxi.latitud
        ).toFixed(5),

        Number(
            taxi.longitud
        ).toFixed(5),

        Number(
            destino.latitud
        ).toFixed(5),

        Number(
            destino.longitud
        ).toFixed(5),
    ].join("|");
}


function limpiarRuta() {
    if (
        lineaRuta
    ) {
        map.removeLayer(
            lineaRuta
        );

        lineaRuta =
            null;
    }

    ultimaRutaKey =
        null;
}


/*
  Intenta calcular una ruta real
  por calles utilizando OSRM.

  Si OSRM no responde, se dibuja
  una línea discontinua de respaldo.
*/

async function dibujarRuta(
    taxi,
    destino
) {
    const key =
        crearRutaKey(
            taxi,
            destino
        );

    if (
        key === ultimaRutaKey
    ) {
        return;
    }

    ultimaRutaKey =
        key;


    const url =
        "https://router.project-osrm.org/route/v1/driving/" +
        `${taxi.longitud},${taxi.latitud};` +
        `${destino.longitud},${destino.latitud}` +
        "?overview=full&geometries=geojson&steps=false";


    try {
        const respuesta =
            await fetch(
                url,
                {
                    cache:
                        "no-store",
                }
            );


        if (
            !respuesta.ok
        ) {
            throw new Error(
                "ROUTING_HTTP_ERROR"
            );
        }


        const data =
            await respuesta.json();


        const coordenadas =
            data?.routes?.[0]
                ?.geometry
                ?.coordinates;


        if (
            !Array.isArray(
                coordenadas
            ) ||
            coordenadas.length <
            2
        ) {
            throw new Error(
                "RUTA_NO_DISPONIBLE"
            );
        }


        const puntos =
            coordenadas.map(
                ([longitud, latitud]) => [
                    latitud,
                    longitud,
                ]
            );


        if (
            lineaRuta
        ) {
            lineaRuta
                .setLatLngs(
                    puntos
                );

            lineaRuta
                .setStyle({
                    color:
                        "#5A22A8",

                    weight:
                        6,

                    opacity:
                        0.85,

                    dashArray:
                        null,
                });
        } else {
            lineaRuta =
                L.polyline(
                    puntos,
                    {
                        color:
                            "#5A22A8",

                        weight:
                            6,

                        opacity:
                            0.85,

                        lineCap:
                            "round",

                        lineJoin:
                            "round",
                    }
                )
                    .addTo(
                        map
                    );
        }


        lineaRuta
            .bringToBack();


    } catch (error) {
        console.log(
            "Routing no disponible. Usando línea de respaldo.",
            error
        );


        const respaldo = [
            [
                taxi.latitud,
                taxi.longitud,
            ],

            [
                destino.latitud,
                destino.longitud,
            ],
        ];


        if (
            lineaRuta
        ) {
            lineaRuta
                .setLatLngs(
                    respaldo
                );

            lineaRuta
                .setStyle({
                    color:
                        "#7D5BA6",

                    weight:
                        4,

                    opacity:
                        0.6,

                    dashArray:
                        "8 10",
                });
        } else {
            lineaRuta =
                L.polyline(
                    respaldo,
                    {
                        color:
                            "#7D5BA6",

                        weight:
                            4,

                        opacity:
                            0.6,

                        dashArray:
                            "8 10",

                        lineCap:
                            "round",
                    }
                )
                    .addTo(
                        map
                    );
        }


        lineaRuta
            .bringToBack();
    }
}


/*
  ========================================
  AJUSTAR MAPA
  ========================================
*/

function ajustarMapa(
    taxi,
    destino
) {
    if (
        taxi &&
        destino
    ) {
        map.fitBounds(
            [
                [
                    destino.latitud,
                    destino.longitud,
                ],

                [
                    taxi.latitud,
                    taxi.longitud,
                ],
            ],

            {
                paddingTopLeft:
                    [55, 75],

                paddingBottomRight:
                    [55, 105],

                maxZoom:
                    17,
            }
        );

        return;
    }


    if (
        destino
    ) {
        map.setView(
            [
                destino.latitud,
                destino.longitud,
            ],

            16
        );
    }
}


/*
  ========================================
  ACTUALIZAR SEGUIMIENTO
  ========================================
*/

async function actualizarSeguimiento() {
    if (
        actualizando
    ) {
        return;
    }


    actualizando =
        true;


    try {
        const respuesta =
            await fetch(
                `/api/carreras/seguimiento/${encodeURIComponent(token)}`,
                {
                    cache:
                        "no-store",
                }
            );


        const data =
            await respuesta.json();


        if (
            !respuesta.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "No se pudo cargar el seguimiento."
            );
        }


        const seguimiento =
            data.seguimiento;


        /*
          TÍTULO
        */

        const titulo =
            document.getElementById(
                "titulo"
            );

        if (
            titulo
        ) {
            titulo.textContent =
                `Carrera #${seguimiento.numero}`;
        }


        /*
          ESTADO
        */

        actualizarEstadoVisual(
            seguimiento.estado
        );


        /*
          ========================================
          CARRERA FINALIZADA
          ========================================
        */

        if (
            seguimiento.activa ===
            false
        ) {
            const taxistaElement =
                document.getElementById(
                    "taxista"
                );

            const vehiculoElement =
                document.getElementById(
                    "vehiculo"
                );

            const distanciaElement =
                document.getElementById(
                    "distancia"
                );

            const etaElement =
                document.getElementById(
                    "eta"
                );

            const mensajeElement =
                document.getElementById(
                    "mensaje"
                );

            const mapEstadoElement =
                document.getElementById(
                    "mapEstado"
                );


            if (
                taxistaElement
            ) {
                taxistaElement.textContent =
                    "--";
            }

            if (
                vehiculoElement
            ) {
                vehiculoElement.textContent =
                    "--";
            }

            if (
                distanciaElement
            ) {
                distanciaElement.textContent =
                    "--";
            }

            if (
                etaElement
            ) {
                etaElement.textContent =
                    "--";
            }

            if (
                mensajeElement
            ) {
                mensajeElement.textContent =
                    seguimiento.mensaje ||
                    "Esta carrera ha finalizado.";
            }

            if (
                mapEstadoElement
            ) {
                mapEstadoElement.textContent =
                    seguimiento.mensaje ||
                    textoEstado(
                        seguimiento.estado
                    );
            }


            limpiarRuta();


            if (
                marcadorTaxi
            ) {
                map.removeLayer(
                    marcadorTaxi
                );

                marcadorTaxi =
                    null;
            }


            return;
        }


        /*
          ========================================
          TAXISTA
          ========================================
        */

        if (
            seguimiento.taxista
        ) {
            const taxistaElement =
                document.getElementById(
                    "taxista"
                );

            const vehiculoElement =
                document.getElementById(
                    "vehiculo"
                );


            if (
                taxistaElement
            ) {
                taxistaElement.textContent =
                    seguimiento.taxista.nombre ||
                    "--";
            }


            const datosVehiculo = [
                seguimiento.taxista.vehiculo,
                seguimiento.taxista.colorVehiculo,
                seguimiento.taxista.placa,
            ]
                .filter(
                    Boolean
                )
                .join(
                    " · "
                );


            if (
                vehiculoElement
            ) {
                vehiculoElement.textContent =
                    datosVehiculo ||
                    "--";
            }
        }


        /*
          ========================================
          DISTANCIA Y ETA
          ========================================
        */

        const distanciaElement =
            document.getElementById(
                "distancia"
            );

        const etaElement =
            document.getElementById(
                "eta"
            );


        if (
            distanciaElement
        ) {
            distanciaElement.textContent =
                seguimiento.distanciaKm !==
                    null

                    ? `${seguimiento.distanciaKm} km`

                    : "--";
        }


        if (
            etaElement
        ) {
            etaElement.textContent =
                seguimiento.etaMinutos !==
                    null

                    ? `${seguimiento.etaMinutos} min`

                    : "--";
        }


        /*
          ========================================
          DESTINO / CLIENTE
          ========================================
        */

        const destino =
            seguimiento.destino;


        if (
            destino
        ) {
            const posicionCliente = [
                destino.latitud,
                destino.longitud,
            ];


            if (
                !marcadorCliente
            ) {
                marcadorCliente =
                    L.marker(
                        posicionCliente,
                        {
                            icon:
                                iconoCliente,
                        }
                    )
                        .addTo(
                            map
                        )
                        .bindPopup(
                            "Tu ubicación"
                        );
            } else {
                marcadorCliente
                    .setLatLng(
                        posicionCliente
                    );
            }
        }


        /*
          ========================================
          TAXI
          ========================================
        */

        if (
            seguimiento.taxi
        ) {
            const posicionTaxi = [
                seguimiento.taxi.latitud,
                seguimiento.taxi.longitud,
            ];


            if (
                !marcadorTaxi
            ) {
                marcadorTaxi =
                    L.marker(
                        posicionTaxi,
                        {
                            icon:
                                iconoTaxi,

                            zIndexOffset:
                                1000,
                        }
                    )
                        .addTo(
                            map
                        )
                        .bindPopup(
                            "Tu taxi"
                        );
            } else {
                marcadorTaxi
                    .setLatLng(
                        posicionTaxi
                    );
            }


            if (
                destino
            ) {
                await dibujarRuta(
                    seguimiento.taxi,
                    destino
                );


                ajustarMapa(
                    seguimiento.taxi,
                    destino
                );
            }


            const mensajeElement =
                document.getElementById(
                    "mensaje"
                );


            if (
                mensajeElement
            ) {
                if (
                    seguimiento.estado ===
                    "LLEGO"
                ) {
                    mensajeElement.textContent =
                        "Tu taxi ya está llegando. Prepárate para salir.";
                } else if (
                    seguimiento.estado ===
                    "CERCA"
                ) {
                    mensajeElement.textContent =
                        "Tu taxi está muy cerca. Te recomendamos estar atento.";
                } else {
                    mensajeElement.textContent =
                        "La posición y la ruta del taxi se actualizan automáticamente.";
                }
            }


        } else if (
            destino
        ) {
            /*
              Todavía no tenemos GPS
              del taxista.
            */

            limpiarRuta();


            ajustarMapa(
                null,
                destino
            );


            const mensajeElement =
                document.getElementById(
                    "mensaje"
                );

            const mapEstadoElement =
                document.getElementById(
                    "mapEstado"
                );


            if (
                mensajeElement
            ) {
                mensajeElement.textContent =
                    "Esperando la primera ubicación GPS del taxista.";
            }


            if (
                mapEstadoElement
            ) {
                mapEstadoElement.textContent =
                    "Esperando ubicación del taxi...";
            }
        }
        /*
          ========================================
          FIN DEL SEGUIMIENTO DE APROXIMACION
          ========================================
        */

        if (
            seguimiento.seguimientoAproximacionActivo ===
            false
        ) {

            const mensajeElement =
                document.getElementById(
                    "mensaje"
                );

            const mapEstadoElement =
                document.getElementById(
                    "mapEstado"
                );

            const distanciaElement =
                document.getElementById(
                    "distancia"
                );

            const etaElement =
                document.getElementById(
                    "eta"
                );

            const estadoTextoElement =
                document.getElementById(
                    "estadoTexto"
                );

            if (
                estadoTextoElement
            ) {
                estadoTextoElement.textContent =
                    "Tu taxi llegó";
            }

            if (
                mensajeElement
            ) {
                mensajeElement.textContent =
                    seguimiento.mensaje ||
                    "Tu taxi llegó al punto de recogida. El seguimiento de aproximación ha finalizado.";
            }

            if (
                mapEstadoElement
            ) {
                mapEstadoElement.textContent =
                    "Taxi en punto de recogida";
            }


            if (
                distanciaElement
            ) {
                distanciaElement.textContent =
                    "--";
            }


            if (
                etaElement
            ) {
                etaElement.textContent =
                    "--";
            }


            /*
              Dejamos el mapa exactamente
              en su ultima posicion.
          
              Ya no hacemos nuevas consultas
              al servidor.
            */

            if (
                intervaloSeguimiento
            ) {

                clearInterval(
                    intervaloSeguimiento
                );

                intervaloSeguimiento =
                    null;
            }


            console.log(
                "Seguimiento de aproximacion finalizado."
            );
        }

    } catch (error) {
        console.error(
            "Error actualizando seguimiento:",
            error
        );


        const mensajeElement =
            document.getElementById(
                "mensaje"
            );

        const mapEstadoElement =
            document.getElementById(
                "mapEstado"
            );


        if (
            mensajeElement
        ) {
            mensajeElement.textContent =
                "No pudimos actualizar la ubicación. Intentaremos nuevamente.";
        }


        if (
            mapEstadoElement
        ) {
            mapEstadoElement.textContent =
                "Reconectando seguimiento...";
        }


    } finally {
        actualizando =
            false;
    }
}


/*
  ========================================
  INICIAR
  ========================================
*/

actualizarSeguimiento();


/*
  Actualización automática
  cada 15 segundos.
*/

intervaloSeguimiento =
    setInterval(
        actualizarSeguimiento,
        15000
    );