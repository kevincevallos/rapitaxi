"use strict";


/*
  RAPITAXI TAXISTA PWA
*/

const API_BASE_URL =
    window.location.origin;

const CARTO_API_KEY =
    "cb1_3gxd_1_a292bfb7894ca1d819a42be0";


/*
MAPA / GPS
*/

let mapaCarreraLeaflet =
    null;

let marcadorTaxi =
    null;

let marcadorCliente =
    null;

let lineaRuta =
    null;

let gpsWatchId =
    null;

let ultimaUbicacion =
    null;

let ultimoEnvioGps =
    0;

let ultimaRutaCalculada =
    0;

let carreraMapaId =
    null;



/*
  STORAGE
*/

const STORAGE_TAXISTA =
    "rapitaxi_taxista_web";

const STORAGE_SESSION_TOKEN =
    "rapitaxi_session_token_web";

const STORAGE_DEVICE_ID =
    "rapitaxi_device_id_web";


/*
  ESTADO
*/

let taxistaActual =
    null;

let sessionToken =
    null;

let enLinea =
    true;

let carreras =
    [];

let indiceCarrera =
    0;

let carreraActivaActual =
    null;

let aceptandoCarrera =
    false;

let timerCarreraActiva =
    null;

let timerCarreras =
    null;


/*
  ELEMENTOS
*/
const estadoRutaWeb =
    document.getElementById(
        "estadoRutaWeb"
    );

const mapaCargando =
    document.getElementById(
        "mapaCargando"
    );

const gpsChip =
    document.getElementById(
        "gpsChip"
    );

const vehiculoResumen =
    document.getElementById(
        "vehiculoResumen"
    );

const placaResumen =
    document.getElementById(
        "placaResumen"
    );

const pantallaCarga =
    document.getElementById(
        "pantallaCarga"
    );

const pantallaLogin =
    document.getElementById(
        "pantallaLogin"
    );

const pantallaApp =
    document.getElementById(
        "pantallaApp"
    );

const codigoInput =
    document.getElementById(
        "codigoTaxista"
    );

const botonIngresar =
    document.getElementById(
        "botonIngresar"
    );

const botonSalir =
    document.getElementById(
        "botonSalir"
    );

const mensajeLogin =
    document.getElementById(
        "mensajeLogin"
    );

const nombreTaxista =
    document.getElementById(
        "nombreTaxista"
    );

const codigoMostrado =
    document.getElementById(
        "codigoMostrado"
    );

const vehiculoTaxista =
    document.getElementById(
        "vehiculoTaxista"
    );

const placaTaxista =
    document.getElementById(
        "placaTaxista"
    );

const switchEnLinea =
    document.getElementById(
        "switchEnLinea"
    );

const indicadorConexion =
    document.getElementById(
        "indicadorConexion"
    );

const textoConexion =
    document.getElementById(
        "textoConexion"
    );

const descripcionConexion =
    document.getElementById(
        "descripcionConexion"
    );

const contadorCarreras =
    document.getElementById(
        "contadorCarreras"
    );

const cargandoCarreras =
    document.getElementById(
        "cargandoCarreras"
    );

const estadoOffline =
    document.getElementById(
        "estadoOffline"
    );

const sinCarreras =
    document.getElementById(
        "sinCarreras"
    );

const carreraCard =
    document.getElementById(
        "carreraCard"
    );

const numeroCarrera =
    document.getElementById(
        "numeroCarrera"
    );

const referenciaCarrera =
    document.getElementById(
        "referenciaCarrera"
    );

const pagoCarrera =
    document.getElementById(
        "pagoCarrera"
    );

const paginacion =
    document.getElementById(
        "paginacion"
    );

const textoPaginacion =
    document.getElementById(
        "textoPaginacion"
    );

const carreraAnterior =
    document.getElementById(
        "carreraAnterior"
    );

const carreraSiguiente =
    document.getElementById(
        "carreraSiguiente"
    );

const zonaCarreras =
    document.querySelector(
        ".zona-carreras"
    );

const botonAceptar =
    document.getElementById(
        "botonAceptar"
    );

const carreraActiva =
    document.getElementById(
        "carreraActiva"
    );

const tituloCarreraActiva =
    document.getElementById(
        "tituloCarreraActiva"
    );

const estadoCarreraActiva =
    document.getElementById(
        "estadoCarreraActiva"
    );

const referenciaActiva =
    document.getElementById(
        "referenciaActiva"
    );

const pagoActivo =
    document.getElementById(
        "pagoActivo"
    );

const mapaCarreraElemento =
    document.getElementById(
        "mapaCarrera"
    );

const gpsTexto =
    document.getElementById(
        "gpsTexto"
    );

const gpsPunto =
    document.getElementById(
        "gpsPunto"
    );

const botonMaps =
    document.getElementById(
        "botonMaps"
    );

const botonWhatsapp =
    document.getElementById(
        "botonWhatsapp"
    );

const botonLlegue =
    document.getElementById(
        "botonLlegue"
    );

const botonFinalizar =
    document.getElementById(
        "botonFinalizar"
    );

const botonCentrar =
    document.getElementById(
        "botonCentrar"
    );

let marcandoLlegada =
    false;

let finalizandoCarrera =
    false;
/*
  UI GENERAL
*/

function mostrar(
    elemento
) {

    elemento.classList.remove(
        "oculto"
    );

}


function ocultar(
    elemento
) {

    elemento.classList.add(
        "oculto"
    );

}


function mostrarMensaje(
    texto
) {

    mensajeLogin.textContent =
        texto;

    mensajeLogin.className =
        "mensaje-error";

}


function limpiarMensaje() {

    mensajeLogin.textContent =
        "";

    mensajeLogin.className =
        "mensaje-error oculto";

}


/*
  DEVICE ID
*/

function generarIdAleatorio() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
        "function"
    ) {

        return (
            "web-" +
            window.crypto.randomUUID()
        );

    }


    return (
        "web-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


function obtenerOCrearDeviceId() {

    let deviceId =
        localStorage.getItem(
            STORAGE_DEVICE_ID
        );


    if (!deviceId) {

        deviceId =
            generarIdAleatorio();

        localStorage.setItem(
            STORAGE_DEVICE_ID,
            deviceId
        );

    }


    return deviceId;

}


/*
  TAXISTA
*/

function cargarDatosTaxista(
    taxista
) {

    nombreTaxista.textContent =
        taxista?.nombre ||
        "Taxista";

    codigoMostrado.textContent =
        taxista?.codigo ||
        "---";

    vehiculoTaxista.textContent =
        taxista?.vehiculo ||
        "No registrado";

    placaTaxista.textContent =
        taxista?.placa ||
        "No registrada";

    if (vehiculoResumen) {
        vehiculoResumen.textContent =
            taxista?.vehiculo ||
            "Vehículo";
    }

    if (placaResumen) {
        placaResumen.textContent =
            taxista?.placa ||
            "---";
    }

}


/*
  ESTADO ONLINE
*/

function actualizarUIEnLinea() {

    switchEnLinea.checked =
        enLinea;


    if (enLinea) {

        indicadorConexion.classList.add(
            "activo"
        );

        textoConexion.textContent =
            "EN LÍNEA";

        descripcionConexion.textContent =
            "Estás disponible para recibir carreras.";

    } else {

        indicadorConexion.classList.remove(
            "activo"
        );

        textoConexion.textContent =
            "FUERA DE LÍNEA";

        descripcionConexion.textContent =
            "No recibirás nuevas solicitudes.";

    }


    renderCarreras();

}


/*
  UI CARRERAS
*/

function ocultarEstadosCarreras() {

    ocultar(
        cargandoCarreras
    );

    ocultar(
        estadoOffline
    );

    ocultar(
        sinCarreras
    );

    ocultar(
        carreraCard
    );

}


function renderCarreras() {

    ocultarEstadosCarreras();


    contadorCarreras.textContent =
        String(
            carreras.length
        );


    if (!enLinea) {

        mostrar(
            estadoOffline
        );

        return;

    }


    if (
        carreras.length === 0
    ) {

        mostrar(
            sinCarreras
        );

        return;

    }


    if (
        indiceCarrera >=
        carreras.length
    ) {

        indiceCarrera =
            0;

    }


    const carrera =
        carreras[
        indiceCarrera
        ];


    if (!carrera) {

        mostrar(
            sinCarreras
        );

        return;

    }


    numeroCarrera.textContent =
        `#${carrera.numero}`;

    referenciaCarrera.textContent =
        carrera.referencia ||
        "Sin referencia";

    pagoCarrera.textContent =
        carrera.formaPago ||
        "No especificado";


    mostrar(
        carreraCard
    );


    if (
        carreras.length > 1
    ) {

        mostrar(
            paginacion
        );

        textoPaginacion.textContent =
            `${indiceCarrera + 1} de ${carreras.length}`;

    } else {

        ocultar(
            paginacion
        );

    }


    carreraAnterior.disabled =
        indiceCarrera === 0;

    carreraSiguiente.disabled =
        indiceCarrera ===
        carreras.length - 1;

}

/*
  ======================================
  MAPA + GPS IPHONE
  ======================================
*/


function actualizarEstadoGps(
    estado,
    texto
) {

    gpsTexto.textContent =
        texto;


    gpsPunto.classList.remove(
        "activo",
        "error"
    );


    if (
        estado === "activo"
    ) {

        gpsPunto.classList.add(
            "activo"
        );

    }


    if (
        estado === "error"
    ) {

        gpsPunto.classList.add(
            "error"
        );

    }

}


/*
  ICONOS
*/

function crearIconoTaxi(
    heading = 0
) {

    const rotacion =
        Number.isFinite(
            Number(heading)
        )
            ? Number(heading)
            : 0;


    return L.divIcon({

        className:
            "marcador-personalizado",

        html:
            `
        <div class="taxi-wrapper-web">

          <div
            class="taxi-marker-web"
            style="transform: rotate(${rotacion}deg)"
          >
            🚕
          </div>

        </div>
      `,

        iconSize:
            [54, 54],

        iconAnchor:
            [27, 27],

    });

}


function crearIconoCliente() {

    return L.divIcon({

        className:
            "marcador-personalizado",

        html:
            `
        <div class="cliente-wrapper-web">

          <div class="cliente-marker-web">

            <div class="cliente-centro-web"></div>

          </div>

        </div>
      `,

        iconSize:
            [46, 54],

        iconAnchor:
            [23, 48],

    });

}


/*
  DESTRUIR MAPA
*/

function destruirMapaCarrera() {

    if (
        mapaCarreraLeaflet
    ) {

        mapaCarreraLeaflet.remove();

        mapaCarreraLeaflet =
            null;

    }


    marcadorTaxi =
        null;

    marcadorCliente =
        null;

    lineaRuta =
        null;

    carreraMapaId =
        null;

}


/*
  CREAR MAPA
*/

function crearMapaCarrera(
    latTaxi,
    lngTaxi
) {

    destruirMapaCarrera();

    mapaCarreraLeaflet =
        L.map(
            mapaCarreraElemento,
            {
                zoomControl: false,
                attributionControl: true,
                preferCanvas: true,
            }
        );

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=" +
        CARTO_API_KEY,
        {
            attribution:
                '&copy; OpenStreetMap contributors, &copy; CARTO',
            subdomains: "abcd",
            maxZoom: 20,
        }
    ).addTo(mapaCarreraLeaflet);

    marcadorTaxi =
        L.marker(
            [latTaxi, lngTaxi],
            {
                icon: crearIconoTaxi(
                    ultimaUbicacion?.heading || 0
                ),
            }
        ).addTo(mapaCarreraLeaflet);

    if (carreraActivaActual) {

        const latCliente =
            Number(
                carreraActivaActual.latitud
            );

        const lngCliente =
            Number(
                carreraActivaActual.longitud
            );

        marcadorCliente =
            L.marker(
                [latCliente, lngCliente],
                {
                    icon: crearIconoCliente(),
                }
            ).addTo(mapaCarreraLeaflet);

        const bounds =
            L.latLngBounds([
                [latTaxi, lngTaxi],
                [latCliente, lngCliente],
            ]);

        mapaCarreraLeaflet.fitBounds(
            bounds,
            {
                padding: [58, 58],
                maxZoom: 16,
            }
        );

        carreraMapaId =
            carreraActivaActual.id;

    } else {

        mapaCarreraLeaflet.setView(
            [latTaxi, lngTaxi],
            16
        );

        carreraMapaId = 0;

    }

    if (mapaCargando) {
        ocultar(mapaCargando);
    }

    setTimeout(
        () => {
            mapaCarreraLeaflet
                ?.invalidateSize();
        },
        180
    );

}


/*
  RUTA OSRM
*/

async function calcularRuta(
    latTaxi,
    lngTaxi
) {
    if (
        estadoRutaWeb
    ) {

        estadoRutaWeb.innerHTML =
            'Calculando <strong>ruta...</strong>';

    }

    if (
        !mapaCarreraLeaflet ||
        !carreraActivaActual
    ) {

        return;

    }


    const ahora =
        Date.now();


    /*
      No recalculamos la ruta
      constantemente.
    */

    if (
        ahora -
        ultimaRutaCalculada <
        15000
    ) {

        return;

    }


    ultimaRutaCalculada =
        ahora;


    const latCliente =
        Number(
            carreraActivaActual.latitud
        );

    const lngCliente =
        Number(
            carreraActivaActual.longitud
        );


    try {

        const url =
            "https://router.project-osrm.org/route/v1/driving/" +
            `${lngTaxi},${latTaxi};` +
            `${lngCliente},${latCliente}` +
            "?overview=full&geometries=geojson&steps=true";


        const response =
            await fetch(
                url
            );


        const data =
            await response.json();


        const coordenadas =
            data?.routes?.[0]
                ?.geometry
                ?.coordinates;


        if (
            !Array.isArray(
                coordenadas
            )
        ) {

            return;

        }


        const puntos =
            coordenadas.map(
                punto => [
                    punto[1],
                    punto[0]
                ]
            );


        if (
            lineaRuta
        ) {

            mapaCarreraLeaflet.removeLayer(
                lineaRuta
            );

        }


        /*
          Borde claro
        */

        L.polyline(
            puntos,
            {
                weight:
                    9,

                opacity:
                    0.85,

                color:
                    "#ffffff",
            }
        )
            .addTo(
                mapaCarreraLeaflet
            );


        /*
          Ruta morada
        */

        lineaRuta =
            L.polyline(
                puntos,
                {
                    weight:
                        5,

                    opacity:
                        1,

                    color:
                        "#7B3FE4",
                }
            )
                .addTo(
                    mapaCarreraLeaflet
                );

        const ruta =
            data?.routes?.[0];


        if (
            estadoRutaWeb &&
            ruta
        ) {

            const distanciaKm =
                Number(
                    ruta.distance || 0
                ) / 1000;


            const minutos =
                Math.max(
                    1,
                    Math.round(
                        Number(
                            ruta.duration || 0
                        ) / 60
                    )
                );


            estadoRutaWeb.innerHTML =
                `<strong>${distanciaKm.toFixed(1)} km</strong> · ${minutos} min`;

        }
    } catch (error) {

        console.log(
            "No se pudo calcular ruta:",
            error
        );

    }

}


/*
  ENVIAR GPS AL BACKEND
*/

async function enviarUbicacionBackend(
    latitud,
    longitud
) {

    if (
        !carreraActivaActual ||
        !taxistaActual
    ) {

        return;

    }


    const ahora =
        Date.now();


    /*
      Máximo un envío aprox.
      cada 12 segundos.
    */

    if (
        ahora -
        ultimoEnvioGps <
        12000
    ) {

        return;

    }


    ultimoEnvioGps =
        ahora;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/carreras/app/${carreraActivaActual.id}/ubicacion`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            codigoTaxista:
                                String(
                                    taxistaActual.codigo
                                ).padStart(
                                    3,
                                    "0"
                                ),

                            latitud,

                            longitud,
                        }),
                }
            );


        const data =
            await response
                .json()
                .catch(
                    () => null
                );


        if (!response.ok) {

            console.log(
                "GPS rechazado:",
                data
            );

            return;

        }


        /*
          El backend puede indicarnos
          que ya no debemos seguir
          compartiendo ubicación.
        */

        if (
            data
                ?.seguimientoAproximacionActivo ===
            false
        ) {

            detenerGpsCarrera();

            actualizarEstadoGps(
                "normal",
                "Seguimiento completado"
            );

            return;

        }


        /*
          Recuperamos el estado actualizado:
          ASIGNADA → EN_CAMINO → CERCA...
        */

        await consultarCarreraActiva(
            false
        );


    } catch (error) {

        console.log(
            "Error enviando GPS:",
            error
        );

    }

}


/*
  UBICACIÓN RECIBIDA
*/

async function procesarUbicacion(
    posicion
) {

    if (!taxistaActual) {
        return;
    }

    const latitud =
        posicion.coords.latitude;

    const longitud =
        posicion.coords.longitude;

    const heading =
        posicion.coords.heading;

    ultimaUbicacion = {
        latitud,
        longitud,
        heading,
    };

    actualizarEstadoGps(
        "activo",
        "UBICACIÓN ACTIVA"
    );

    const mapaObjetivoId =
        carreraActivaActual
            ? carreraActivaActual.id
            : 0;

    if (
        !mapaCarreraLeaflet ||
        carreraMapaId !== mapaObjetivoId
    ) {

        crearMapaCarrera(
            latitud,
            longitud
        );

    } else if (marcadorTaxi) {

        marcadorTaxi.setLatLng(
            [latitud, longitud]
        );

        if (
            typeof heading === "number" &&
            Number.isFinite(heading)
        ) {
            marcadorTaxi.setIcon(
                crearIconoTaxi(heading)
            );
        }

    }

    if (mapaCargando) {
        ocultar(mapaCargando);
    }

    if (carreraActivaActual) {

        calcularRuta(
            latitud,
            longitud
        );

        enviarUbicacionBackend(
            latitud,
            longitud
        );

    }

}


/*
  ERROR GPS
*/

function errorGps(
    error
) {

    console.log(
        "Error GPS:",
        error
    );


    let mensaje =
        "No fue posible obtener tu ubicación.";


    if (
        error.code ===
        1
    ) {

        mensaje =
            "Permiso de ubicación desactivado.";

    }


    actualizarEstadoGps(
        "error",
        mensaje
    );

}


/*
  INICIAR GPS
*/

function iniciarGpsCarrera() {

    if (
        gpsWatchId !==
        null
    ) {

        return;

    }


    if (
        !navigator.geolocation
    ) {

        actualizarEstadoGps(
            "error",
            "Este dispositivo no permite GPS."
        );

        return;

    }


    actualizarEstadoGps(
        "normal",
        "Solicitando ubicación..."
    );


    /*
      Primero obtenemos una ubicación
      inmediata.
    */

    navigator.geolocation
        .getCurrentPosition(
            procesarUbicacion,
            errorGps,
            {
                enableHighAccuracy:
                    true,

                timeout:
                    15000,

                maximumAge:
                    3000,
            }
        );


    /*
      Después mantenemos seguimiento
      mientras la PWA siga activa.
    */

    gpsWatchId =
        navigator.geolocation
            .watchPosition(
                procesarUbicacion,
                errorGps,
                {
                    enableHighAccuracy:
                        true,

                    timeout:
                        20000,

                    maximumAge:
                        5000,
                }
            );

}


/*
  DETENER GPS
*/

function detenerGpsCarrera() {

    if (
        gpsWatchId !==
        null
    ) {

        navigator
            .geolocation
            .clearWatch(
                gpsWatchId
            );

        gpsWatchId =
            null;

    }


    ultimaUbicacion =
        null;

}


/*
  REANUDAR AL VOLVER A RAPITAXI
*/

function reactivarGpsCarrera() {

    if (
        !carreraActivaActual
    ) {

        return;

    }


    /*
      Pedimos una posición nueva
      inmediatamente al volver.
    */

    navigator.geolocation
        ?.getCurrentPosition(
            procesarUbicacion,
            errorGps,
            {
                enableHighAccuracy:
                    true,

                timeout:
                    15000,

                maximumAge:
                    0,
            }
        );


    iniciarGpsCarrera();

}

/*
  CARRERA ACTIVA
*/

function estadoHumanoWeb(
    estado
) {

    switch (
    estado
    ) {

        case "ASIGNADA":
            return "ASIGNADA";

        case "EN_CAMINO":
            return "EN CAMINO";

        case "CERCA":
            return "CERCA";

        case "LLEGO":
            return "EN PUNTO";

        default:
            return estado ||
                "CARRERA ACTIVA";

    }

}


function renderCarreraActiva() {

    if (!carreraActivaActual) {

        ocultar(carreraActiva);
        mostrar(zonaCarreras);

        if (estadoRutaWeb) {
            ocultar(estadoRutaWeb);
        }

        if (gpsChip) {
            ocultar(gpsChip);
        }

        if (
            ultimaUbicacion &&
            carreraMapaId !== 0
        ) {
            crearMapaCarrera(
                ultimaUbicacion.latitud,
                ultimaUbicacion.longitud
            );
        }

        return;
    }

    ocultar(zonaCarreras);
    mostrar(carreraActiva);

    if (estadoRutaWeb) {
        mostrar(estadoRutaWeb);
    }

    if (gpsChip) {
        mostrar(gpsChip);
    }

    tituloCarreraActiva.textContent =
        `#${carreraActivaActual.numero}`;

    estadoCarreraActiva.textContent =
        estadoHumanoWeb(
            carreraActivaActual.estado
        );

    referenciaActiva.textContent =
        carreraActivaActual.referencia ||
        "Sin referencia";

    pagoActivo.textContent =
        carreraActivaActual.formaPago ||
        "No especificado";

    const estado =
        carreraActivaActual.estado;

    if (estado === "LLEGO") {
        ocultar(botonLlegue);
        mostrar(botonFinalizar);
    } else {
        mostrar(botonLlegue);
        ocultar(botonFinalizar);
    }

    iniciarGpsCarrera();

    if (
        ultimaUbicacion &&
        carreraMapaId !== carreraActivaActual.id
    ) {
        ultimaRutaCalculada = 0;
        crearMapaCarrera(
            ultimaUbicacion.latitud,
            ultimaUbicacion.longitud
        );
        calcularRuta(
            ultimaUbicacion.latitud,
            ultimaUbicacion.longitud
        );
    }

    setTimeout(
        () => {
            mapaCarreraLeaflet
                ?.invalidateSize();
        },
        120
    );

}


async function consultarCarreraActiva(
    mostrarError = false
) {

    if (
        !taxistaActual
    ) {

        return null;

    }


    try {

        const codigoInterno =
            String(
                taxistaActual.codigo
            ).padStart(
                3,
                "0"
            );


        const response =
            await fetch(
                `${API_BASE_URL}/api/carreras/app/activa/${codigoInterno}`,
                {
                    cache:
                        "no-store",
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            if (mostrarError) {

                console.log(
                    "Error consultando carrera activa:",
                    data
                );

            }

            return null;

        }


        carreraActivaActual =
            data?.carrera ??
            null;


        renderCarreraActiva();


        return carreraActivaActual;

    } catch (error) {

        if (mostrarError) {

            console.log(
                "Error consultando carrera activa:",
                error
            );

        }


        return null;

    }

}


function detenerPollingCarreraActiva() {

    if (
        timerCarreraActiva
    ) {

        clearInterval(
            timerCarreraActiva
        );

        timerCarreraActiva =
            null;

    }

}


function iniciarPollingCarreraActiva() {

    detenerPollingCarreraActiva();


    if (
        !taxistaActual ||
        !carreraActivaActual
    ) {

        return;

    }


    timerCarreraActiva =
        setInterval(
            async () => {

                const activa =
                    await consultarCarreraActiva(
                        false
                    );


                if (!activa) {

                    detenerPollingCarreraActiva();

                    carreraActivaActual =
                        null;

                    renderCarreraActiva();


                    if (
                        enLinea
                    ) {

                        await cargarCarreras(
                            true
                        );

                        iniciarPollingCarreras();

                    }

                }

            },
            10000
        );

}


/*
  ACEPTAR CARRERA
*/

async function aceptarCarrera() {

    if (
        aceptandoCarrera ||
        carreraActivaActual ||
        !taxistaActual
    ) {

        return;

    }


    const carrera =
        carreras[
        indiceCarrera
        ];


    if (!carrera) {

        return;

    }


    try {

        aceptandoCarrera =
            true;

        botonAceptar.disabled =
            true;

        botonAceptar.textContent =
            "ACEPTANDO...";


        const response =
            await fetch(
                `${API_BASE_URL}/api/carreras/${carrera.token}/aceptar`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            codigoTaxista:
                                String(
                                    taxistaActual.codigo
                                ).padStart(
                                    3,
                                    "0"
                                ),
                        }),
                }
            );


        const data =
            await response.json();


        if (
            response.status ===
            409
        ) {

            const mensaje =
                String(
                    data?.message ||
                    ""
                ).toLowerCase();


            if (
                mensaje.includes(
                    "otro taxista"
                )
            ) {

                window.alert(
                    "Otro taxista aceptó esta carrera primero."
                );


                await cargarCarreras(
                    true
                );

                return;

            }


            if (
                mensaje.includes(
                    "carrera activa"
                )
            ) {

                const activa =
                    await consultarCarreraActiva(
                        true
                    );


                if (activa) {

                    detenerPollingCarreras();

                    carreras =
                        [];

                    indiceCarrera =
                        0;

                    iniciarPollingCarreraActiva();


                    window.alert(
                        "Ya tenías una carrera activa. Rapitaxi la recuperó."
                    );

                } else {

                    window.alert(
                        data?.message ||
                        "Ya tienes una carrera activa."
                    );

                }


                return;

            }

        }


        if (!response.ok) {

            window.alert(
                data?.message ||
                "No fue posible aceptar la carrera."
            );


            await cargarCarreras(
                true
            );

            return;

        }


        const activa =
            await consultarCarreraActiva(
                true
            );


        if (!activa) {

            window.alert(
                "La carrera fue asignada, pero no pudimos recuperar sus datos. Recarga Rapitaxi."
            );

            return;

        }


        detenerPollingCarreras();


        carreras =
            [];

        indiceCarrera =
            0;


        contadorCarreras.textContent =
            "0";


        renderCarreraActiva();

        iniciarPollingCarreraActiva();

    } catch (error) {

        console.log(
            "Error aceptando carrera:",
            error
        );


        window.alert(
            "No fue posible comunicarse con Rapitaxi."
        );

    } finally {

        aceptandoCarrera =
            false;

        botonAceptar.disabled =
            false;

        botonAceptar.textContent =
            "ACEPTAR CARRERA";

    }

}

/*
  CARGAR CARRERAS
*/

async function cargarCarreras(
    mostrarCarga = false
) {

    if (
        !taxistaActual ||
        !enLinea
    ) {

        carreras =
            [];

        indiceCarrera =
            0;

        renderCarreras();

        return;

    }


    try {

        if (mostrarCarga) {

            ocultarEstadosCarreras();

            mostrar(
                cargandoCarreras
            );

        }


        const response =
            await fetch(
                `${API_BASE_URL}/api/carreras/app/disponibles`,
                {
                    cache:
                        "no-store",
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.log(
                "Error cargando carreras:",
                data
            );

            return;

        }


        carreras =
            Array.isArray(
                data?.carreras
            )
                ? data.carreras
                : [];


        if (
            indiceCarrera >=
            carreras.length
        ) {

            indiceCarrera =
                0;

        }


        renderCarreras();

    } catch (error) {

        console.log(
            "Error consultando carreras:",
            error
        );

    }

}


/*
  POLLING
*/

function detenerPollingCarreras() {

    if (
        timerCarreras
    ) {

        clearInterval(
            timerCarreras
        );

        timerCarreras =
            null;

    }

}


function iniciarPollingCarreras() {

    detenerPollingCarreras();


    if (
        !enLinea ||
        !taxistaActual
    ) {

        return;

    }


    timerCarreras =
        setInterval(
            () => {

                cargarCarreras(
                    false
                );

            },
            8000
        );

}


/*
  CAMBIAR ONLINE/OFFLINE
*/

async function cambiarEstadoEnLinea(
    nuevoEstado
) {

    if (
        !sessionToken
    ) {

        return;

    }

    if (
        carreraActivaActual &&
        nuevoEstado === false
    ) {

        window.alert(
            "Finaliza primero la carrera actual antes de desconectarte."
        );

        switchEnLinea.checked =
            true;

        return;

    }

    switchEnLinea.disabled =
        true;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/taxistas/app/en-linea`,
                {
                    method:
                        "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${sessionToken}`,

                    },

                    body:
                        JSON.stringify({
                            enLinea:
                                nuevoEstado,
                        }),
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            window.alert(
                data?.message ||
                "No fue posible cambiar tu estado."
            );

            switchEnLinea.checked =
                enLinea;

            return;

        }


        enLinea =
            Boolean(
                data?.enLinea
            );


        actualizarUIEnLinea();


        if (enLinea) {

            await cargarCarreras(
                true
            );

            iniciarPollingCarreras();

        } else {

            detenerPollingCarreras();

            carreras =
                [];

            indiceCarrera =
                0;

            renderCarreras();

        }

    } catch (error) {

        console.log(
            "Error cambiando estado:",
            error
        );


        window.alert(
            "No fue posible conectarse con Rapitaxi."
        );


        switchEnLinea.checked =
            enLinea;

    } finally {

        switchEnLinea.disabled =
            false;

    }

}


/*
  SESIÓN
*/

function limpiarSesionLocal() {
    detenerGpsCarrera();
    destruirMapaCarrera();
    detenerPollingCarreraActiva();

    carreraActivaActual =
        null;
    detenerPollingCarreras();


    localStorage.removeItem(
        STORAGE_TAXISTA
    );

    localStorage.removeItem(
        STORAGE_SESSION_TOKEN
    );


    taxistaActual =
        null;

    sessionToken =
        null;

    carreras =
        [];

    indiceCarrera =
        0;

}


async function validarSesionServidor() {

    if (
        !sessionToken ||
        !taxistaActual
    ) {

        return false;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/taxistas/app/session`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${sessionToken}`,
                    },
                }
            );


        let data =
            null;


        try {

            data =
                await response.json();

        } catch {

            data =
                null;

        }


        if (
            response.status === 401
        ) {

            limpiarSesionLocal();

            return false;

        }


        if (!response.ok) {

            return true;

        }


        const estadoServidor =
            typeof data?.enLinea ===
                "boolean"
                ? data.enLinea
                : data?.session?.enLinea;


        if (
            typeof estadoServidor ===
            "boolean"
        ) {

            enLinea =
                estadoServidor;

        }


        return true;

    } catch (error) {

        console.log(
            "Validación sin conexión:",
            error
        );

        return true;

    }

}


/*
  PANTALLAS
*/

function mostrarLogin() {

    ocultar(
        pantallaCarga
    );

    ocultar(
        pantallaApp
    );

    mostrar(
        pantallaLogin
    );


    setTimeout(
        () =>
            codigoInput.focus(),
        250
    );

}


async function mostrarAplicacion() {

    cargarDatosTaxista(
        taxistaActual
    );

    actualizarUIEnLinea();


    ocultar(
        pantallaCarga
    );

    ocultar(
        pantallaLogin
    );

    mostrar(
        pantallaApp
    );

    if (mapaCargando) {
        mostrar(mapaCargando);
    }

    iniciarGpsCarrera();

    const activa =
        await consultarCarreraActiva(
            false
        );


    if (activa) {

        detenerPollingCarreras();

        iniciarPollingCarreraActiva();

        return;

    }

    if (enLinea) {

        await cargarCarreras(
            true
        );

        iniciarPollingCarreras();

    } else {

        renderCarreras();

    }

}


/*
  CARGAR SESIÓN
*/

async function cargarSesion() {

    try {

        const taxistaGuardado =
            localStorage.getItem(
                STORAGE_TAXISTA
            );

        const tokenGuardado =
            localStorage.getItem(
                STORAGE_SESSION_TOKEN
            );


        if (
            !taxistaGuardado ||
            !tokenGuardado
        ) {

            limpiarSesionLocal();

            mostrarLogin();

            return;

        }


        taxistaActual =
            JSON.parse(
                taxistaGuardado
            );

        sessionToken =
            tokenGuardado;


        const valida =
            await validarSesionServidor();


        if (!valida) {

            mostrarLogin();

            return;

        }


        await mostrarAplicacion();

    } catch (error) {

        console.log(
            "Error cargando sesión:",
            error
        );


        limpiarSesionLocal();

        mostrarLogin();

    }

}


/*
  LOGIN
*/

async function ingresar() {

    limpiarMensaje();


    const codigoLimpio =
        codigoInput.value
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                3
            );


    codigoInput.value =
        codigoLimpio;


    if (
        codigoLimpio.length !==
        3
    ) {

        mostrarMensaje(
            "Ingresa tu código de taxista de 3 dígitos."
        );

        return;

    }


    try {

        botonIngresar.disabled =
            true;

        botonIngresar.textContent =
            "INGRESANDO...";


        const response =
            await fetch(
                `${API_BASE_URL}/api/taxistas/app/login`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({

                            codigo:
                                codigoLimpio,

                            deviceId:
                                obtenerOCrearDeviceId(),

                        }),
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            mostrarMensaje(
                data?.message ||
                "Código de taxista incorrecto."
            );

            return;

        }


        const nuevoToken =
            String(
                data?.sessionToken ||
                ""
            );


        if (
            !data?.taxista ||
            !nuevoToken
        ) {

            mostrarMensaje(
                "No se pudo crear una sesión segura."
            );

            return;

        }


        taxistaActual =
            data.taxista;

        sessionToken =
            nuevoToken;


        enLinea =
            typeof data?.enLinea ===
                "boolean"
                ? data.enLinea
                : true;


        localStorage.setItem(
            STORAGE_TAXISTA,
            JSON.stringify(
                taxistaActual
            )
        );


        localStorage.setItem(
            STORAGE_SESSION_TOKEN,
            sessionToken
        );


        codigoInput.value =
            "";


        await mostrarAplicacion();

    } catch (error) {

        console.log(
            "Error login:",
            error
        );


        mostrarMensaje(
            "No fue posible conectarse con Rapitaxi."
        );

    } finally {

        botonIngresar.disabled =
            false;

        botonIngresar.textContent =
            "INGRESAR";

    }

}


/*
  CERRAR SESIÓN
*/

function cerrarSesion() {

    const confirmar =
        window.confirm(
            "¿Quieres cerrar la sesión de Rapitaxi?"
        );


    if (!confirmar) {

        return;

    }


    limpiarSesionLocal();

    mostrarLogin();

}

/*
  ======================================
  LLEGUÉ
  ======================================
*/

async function marcarLlegada() {

    if (
        marcandoLlegada ||
        !carreraActivaActual ||
        !taxistaActual
    ) {
        return;
    }


    try {

        marcandoLlegada =
            true;

        botonLlegue.disabled =
            true;

        botonLlegue.textContent =
            "MARCANDO LLEGADA...";


        const response =
            await fetch(
                `${API_BASE_URL}/api/carreras/app/${carreraActivaActual.id}/llegue`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            codigoTaxista:
                                String(
                                    taxistaActual.codigo
                                ).padStart(
                                    3,
                                    "0"
                                ),
                        }),
                }
            );


        const data =
            await response
                .json()
                .catch(
                    () => null
                );


        if (!response.ok) {

            window.alert(
                data?.message ||
                "No fue posible marcar la llegada."
            );

            return;

        }


        await consultarCarreraActiva(
            true
        );


        window.alert(
            "Llegada registrada. El cliente fue notificado."
        );


    } catch (error) {

        console.log(
            "Error marcando llegada:",
            error
        );

        window.alert(
            "No fue posible comunicarse con Rapitaxi."
        );

    } finally {

        marcandoLlegada =
            false;

        botonLlegue.disabled =
            false;

        botonLlegue.textContent =
            "📍 LLEGUÉ AL PUNTO DE RECOGIDA";

    }

}


/*
  ======================================
  FINALIZAR
  ======================================
*/

async function finalizarCarrera() {

    if (
        finalizandoCarrera ||
        !carreraActivaActual ||
        !taxistaActual
    ) {
        return;
    }


    const confirmar =
        window.confirm(
            `¿Confirmas que la carrera #${carreraActivaActual.numero} terminó?`
        );


    if (!confirmar) {
        return;
    }


    try {

        finalizandoCarrera =
            true;

        botonFinalizar.disabled =
            true;

        botonFinalizar.textContent =
            "FINALIZANDO...";


        const response =
            await fetch(
                `${API_BASE_URL}/api/carreras/app/${carreraActivaActual.id}/finalizar`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            codigoTaxista:
                                String(
                                    taxistaActual.codigo
                                ).padStart(
                                    3,
                                    "0"
                                ),
                        }),
                }
            );


        const data =
            await response
                .json()
                .catch(
                    () => null
                );


        if (!response.ok) {

            window.alert(
                data?.message ||
                "No fue posible finalizar la carrera."
            );

            return;

        }


        detenerPollingCarreraActiva();

        carreraActivaActual =
            null;


        renderCarreraActiva();

        if (ultimaUbicacion) {
            crearMapaCarrera(
                ultimaUbicacion.latitud,
                ultimaUbicacion.longitud
            );
        }

        if (enLinea) {

            await cargarCarreras(
                true
            );

            iniciarPollingCarreras();

        }


        window.alert(
            "Carrera finalizada. Ya puedes recibir una nueva solicitud."
        );


    } catch (error) {

        console.log(
            "Error finalizando carrera:",
            error
        );

        window.alert(
            "No fue posible finalizar la carrera. Intenta nuevamente."
        );

    } finally {

        finalizandoCarrera =
            false;

        botonFinalizar.disabled =
            false;

        botonFinalizar.textContent =
            "FINALIZAR CARRERA";

    }

}

function centrarMapaEnTaxi() {

    if (
        !mapaCarreraLeaflet ||
        !ultimaUbicacion
    ) {

        return;

    }


    mapaCarreraLeaflet.flyTo(
        [
            ultimaUbicacion.latitud,
            ultimaUbicacion.longitud
        ],
        Math.max(
            mapaCarreraLeaflet.getZoom(),
            16
        ),
        {
            animate: true,
            duration: 0.6,
        }
    );

}


/*
  EVENTOS
*/

botonCentrar.addEventListener(
    "click",
    centrarMapaEnTaxi
);

botonLlegue.addEventListener(
    "click",
    marcarLlegada
);

botonFinalizar.addEventListener(
    "click",
    finalizarCarrera
);

codigoInput.addEventListener(
    "input",
    () => {

        codigoInput.value =
            codigoInput.value
                .replace(
                    /\D/g,
                    ""
                )
                .slice(
                    0,
                    3
                );

        limpiarMensaje();

    }
);


codigoInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            ingresar();

        }

    }
);


botonIngresar.addEventListener(
    "click",
    ingresar
);


botonSalir.addEventListener(
    "click",
    cerrarSesion
);


switchEnLinea.addEventListener(
    "change",
    () => {

        cambiarEstadoEnLinea(
            switchEnLinea.checked
        );

    }
);


carreraAnterior.addEventListener(
    "click",
    () => {

        if (
            indiceCarrera > 0
        ) {

            indiceCarrera--;

            renderCarreras();

        }

    }
);


carreraSiguiente.addEventListener(
    "click",
    () => {

        if (
            indiceCarrera <
            carreras.length - 1
        ) {

            indiceCarrera++;

            renderCarreras();

        }

    }
);
botonMaps.addEventListener(
    "click",
    () => {

        const url =
            carreraActivaActual
                ?.enlaceGoogleMaps;


        if (!url) {

            window.alert(
                "Google Maps no está disponible."
            );

            return;

        }


        window.location.href =
            url;

    }
);


botonWhatsapp.addEventListener(
    "click",
    () => {

        const url =
            carreraActivaActual
                ?.enlaceWhatsAppCliente;


        if (!url) {

            window.alert(
                "WhatsApp no está disponible."
            );

            return;

        }


        window.location.href =
            url;

    }
);

/*
  VISIBILIDAD
*/

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            await validarSesionServidor();

            iniciarGpsCarrera();

            const activa =
                await consultarCarreraActiva(
                    false
                );


            if (activa) {

                reactivarGpsCarrera();

                return;

            }


            if (
                taxistaActual &&
                enLinea
            ) {

                cargarCarreras(
                    false
                );

            }

        }

    }
);


/*
  SERVICE WORKER
*/

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        async () => {

            try {

                await navigator
                    .serviceWorker
                    .register(
                        "/taxista/sw.js"
                    );

            } catch (error) {

                console.log(
                    "Error Service Worker:",
                    error
                );

            }

        }
    );

}


/*
  INICIO
*/

cargarSesion();