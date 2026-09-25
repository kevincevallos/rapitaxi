"use strict";


/*
  RAPITAXI TAXISTA PWA
*/

const API_BASE_URL =
    window.location.origin;

const GOOGLE_MAPS_WEB_API_KEY =
    "AIzaSyCLbTCVv-e_pddJvQoU4haU-VcODm_E5Qg";

const GOOGLE_MAPS_DARK_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#1D1B22" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#B8B2C0" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1D1B22" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#5A5261" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#242129" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#91899A" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#3A3542" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#29252F" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#D5D0DA" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#554C60" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#28242E" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#111720" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6D7582" }] },
];

/*
MAPA / GPS
*/

let googleMapsPromise = null;
let mapaGoogle = null;
let marcadorTaxi = null;
let marcadorCliente = null;
let lineaRutaBorde = null;
let lineaRuta = null;
let gpsWatchId = null;
let ultimaUbicacion = null;
let ultimoEnvioGps = 0;
let ultimaRutaCalculada = 0;
let carreraMapaId = null;
let carrerasRechazadas = new Set();
let idsCarrerasConocidas = new Set();
let sonidoNuevaCarrera = null;
let audioDesbloqueado = false;

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

const nombreClienteCarrera = document.getElementById("nombreClienteCarrera");
const metaClienteCarrera = document.getElementById("metaClienteCarrera");
const distanciaCarrera = document.getElementById("distanciaCarrera");
const botonRechazar = document.getElementById("botonRechazar");

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

const botonActivarUbicacion = document.getElementById("botonActivarUbicacion");
const textoMapaCargando = document.getElementById("textoMapaCargando");
const spinnerUbicacion = document.getElementById("spinnerUbicacion");
const ayudaUbicacion = document.getElementById("ayudaUbicacion");
const botonNotificaciones =
    document.getElementById(
        "botonNotificaciones"
    );
let timerMostrarBotonUbicacion = null;


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


function textoDistanciaCarrera(distanciaKm) {
    if (typeof distanciaKm !== "number" || !Number.isFinite(distanciaKm)) {
        return "Calculando...";
    }
    if (distanciaKm < 1) {
        return `${Math.max(1, Math.round(distanciaKm * 1000))} m`;
    }
    return `${distanciaKm.toFixed(1)} km`;
}

function textoPagoCorto(formaPago) {
    const texto = String(formaPago || "");
    if (/pichincha/i.test(texto)) return "Transf. Pichincha";
    if (/guayaquil/i.test(texto)) return "Transf. Guayaquil";
    return texto || "No indicado";
}

function desbloquearAudioNuevaCarrera() {
    if (audioDesbloqueado) return;
    try {
        sonidoNuevaCarrera = sonidoNuevaCarrera || new Audio("/taxista/sounds/un_rapi.wav");
        sonidoNuevaCarrera.preload = "auto";
        sonidoNuevaCarrera.volume = 1;
        sonidoNuevaCarrera.muted = true;
        const intento = sonidoNuevaCarrera.play();
        if (intento && typeof intento.then === "function") {
            intento.then(() => {
                sonidoNuevaCarrera.pause();
                sonidoNuevaCarrera.currentTime = 0;
                sonidoNuevaCarrera.muted = false;
                audioDesbloqueado = true;
            }).catch(() => {});
        }
    } catch {}
}

document.addEventListener("pointerdown", desbloquearAudioNuevaCarrera, { once: true });
document.addEventListener("touchstart", desbloquearAudioNuevaCarrera, { once: true, passive: true });

function reproducirSonidoNuevaCarrera() {
    try {
        sonidoNuevaCarrera = sonidoNuevaCarrera || new Audio("/taxista/sounds/un_rapi.wav");
        sonidoNuevaCarrera.currentTime = 0;
        sonidoNuevaCarrera.muted = false;
        sonidoNuevaCarrera.play().catch(() => {});
    } catch {}
}

function renderCarreras() {
    ocultarEstadosCarreras();
    contadorCarreras.textContent = String(carreras.length);

    if (!enLinea) {
        mostrar(estadoOffline);
        return;
    }

    if (carreras.length === 0) {
        mostrar(sinCarreras);
        return;
    }

    if (indiceCarrera >= carreras.length) indiceCarrera = 0;
    const carrera = carreras[indiceCarrera];
    if (!carrera) {
        mostrar(sinCarreras);
        return;
    }

    numeroCarrera.textContent = `#${carrera.numero}`;
    nombreClienteCarrera.textContent = carrera.nombreCliente || "Cliente Rapitaxi";
    const viajes = Number(carrera.viajesCliente ?? 0);
    metaClienteCarrera.textContent = `${carrera.tipoCliente || "Cliente nuevo"} · ${viajes} ${viajes === 1 ? "viaje" : "viajes"}`;
    distanciaCarrera.textContent = `${typeof carrera.etaMinutos === "number" ? `${carrera.etaMinutos} min` : "-- min"} · ${textoDistanciaCarrera(carrera.distanciaKm)}`;
    referenciaCarrera.textContent = carrera.referencia || "Sin referencia";
    pagoCarrera.textContent = textoPagoCorto(carrera.formaPago);

    mostrar(carreraCard);

    if (carreras.length > 1) {
        mostrar(paginacion);
        textoPaginacion.textContent = `${indiceCarrera + 1} de ${carreras.length}`;
    } else {
        ocultar(paginacion);
    }

    carreraAnterior.disabled = indiceCarrera === 0;
    carreraSiguiente.disabled = indiceCarrera === carreras.length - 1;
}

function rechazarCarreraLocal() {
    const carrera = carreras[indiceCarrera];
    if (!carrera) return;
    carrerasRechazadas.add(carrera.id);
    carreras = carreras.filter(item => item.id !== carrera.id);
    indiceCarrera = 0;
    renderCarreras();
}

/*
  ======================================
  GOOGLE MAPS + GPS IPHONE
  ======================================
*/

function actualizarEstadoGps(estado, texto) {
    gpsTexto.textContent = texto;
    gpsPunto.classList.remove("activo", "error");
    if (estado === "activo") gpsPunto.classList.add("activo");
    if (estado === "error") gpsPunto.classList.add("error");
}

function cargarGoogleMaps() {
    if (window.google?.maps) return Promise.resolve(window.google.maps);
    if (googleMapsPromise) return googleMapsPromise;

    googleMapsPromise = new Promise((resolve, reject) => {
        if (!GOOGLE_MAPS_WEB_API_KEY || GOOGLE_MAPS_WEB_API_KEY.includes("PEGA_AQUI")) {
            reject(new Error("Falta configurar GOOGLE_MAPS_WEB_API_KEY en /taxista/app.js"));
            return;
        }

        const callback = "__rapitaxiGoogleMapsReady";
        window[callback] = () => {
            delete window[callback];
            resolve(window.google.maps);
        };

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_WEB_API_KEY)}&v=weekly&loading=async&callback=${callback}`;
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error("No se pudo cargar Google Maps JavaScript API"));
        document.head.appendChild(script);
    });

    return googleMapsPromise;
}

function iconoTaxiGoogle(heading = 0) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 18,
        fillColor: "#F2C94C",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 4,
        rotation: Number.isFinite(Number(heading)) ? Number(heading) : 0,
    };
}

function iconoClienteGoogle() {
    return {
        path: "M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z",
        scale: 1.45,
        fillColor: "#6D28D9",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2.5,
        anchor: new google.maps.Point(12, 22),
    };
}

function limpiarRutaGoogle() {
    lineaRutaBorde?.setMap(null);
    lineaRuta?.setMap(null);
    lineaRutaBorde = null;
    lineaRuta = null;
}

function destruirMapaCarrera() {
    limpiarRutaGoogle();
    marcadorTaxi?.setMap(null);
    marcadorCliente?.setMap(null);
    marcadorTaxi = null;
    marcadorCliente = null;
    mapaGoogle = null;
    carreraMapaId = null;
    if (mapaCarreraElemento) mapaCarreraElemento.innerHTML = "";
}

async function crearMapaCarrera(latTaxi, lngTaxi) {
    try {
        await cargarGoogleMaps();

        const posicionTaxi = { lat: latTaxi, lng: lngTaxi };
        if (!mapaGoogle) {
            mapaGoogle = new google.maps.Map(mapaCarreraElemento, {
                center: posicionTaxi,
                zoom: 16,
                styles: GOOGLE_MAPS_DARK_STYLE,
                disableDefaultUI: true,
                clickableIcons: false,
                gestureHandling: "greedy",
                backgroundColor: "#17111F",
            });
        }

        if (!marcadorTaxi) {
            marcadorTaxi = new google.maps.Marker({
                map: mapaGoogle,
                position: posicionTaxi,
                icon: iconoTaxiGoogle(ultimaUbicacion?.heading || 0),
                label: { text: "🚕", fontSize: "22px" },
                optimized: false,
                zIndex: 1000,
            });
        } else {
            marcadorTaxi.setPosition(posicionTaxi);
        }

        if (carreraActivaActual) {
            const posicionCliente = {
                lat: Number(carreraActivaActual.latitud),
                lng: Number(carreraActivaActual.longitud),
            };

            if (!marcadorCliente) {
                marcadorCliente = new google.maps.Marker({
                    map: mapaGoogle,
                    position: posicionCliente,
                    icon: iconoClienteGoogle(),
                    zIndex: 900,
                });
            } else {
                marcadorCliente.setMap(mapaGoogle);
                marcadorCliente.setPosition(posicionCliente);
            }

            if (carreraMapaId !== carreraActivaActual.id) {
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(posicionTaxi);
                bounds.extend(posicionCliente);
                mapaGoogle.fitBounds(bounds, 70);
            }
            carreraMapaId = carreraActivaActual.id;
        } else {
            marcadorCliente?.setMap(null);
            limpiarRutaGoogle();
            mapaGoogle.setCenter(posicionTaxi);
            mapaGoogle.setZoom(16);
            carreraMapaId = 0;
        }

        ocultar(mapaCargando);
    } catch (error) {
        console.error("Google Maps:", error);
        if (textoMapaCargando) textoMapaCargando.textContent = "No se pudo cargar Google Maps";
    }
}

function actualizarCamaraNavegacion(latitud, longitud, heading) {
    if (!mapaGoogle) return;
    const centro = { lat: latitud, lng: longitud };
    mapaGoogle.panTo(centro);
    if (carreraActivaActual) {
        if ((mapaGoogle.getZoom() || 0) < 17) mapaGoogle.setZoom(17);
        try {
            if (typeof heading === "number" && Number.isFinite(heading) && heading >= 0) {
                mapaGoogle.setHeading(heading);
            }
            mapaGoogle.setTilt(45);
        } catch {}
    }
}

function decodificarPolyline(encoded) {
    if (!encoded) return [];
    const puntos = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += dlat;
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += dlng;
        puntos.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return puntos;
}

async function calcularRuta(latTaxi, lngTaxi, forzar = false) {
    if (!mapaGoogle || !carreraActivaActual || !taxistaActual) return;
    const ahora = Date.now();
    if (!forzar && ahora - ultimaRutaCalculada < 120000) return;
    ultimaRutaCalculada = ahora;

    if (estadoRutaWeb) estadoRutaWeb.innerHTML = 'Calculando <strong>ruta...</strong>';

    try {
        const codigo = String(taxistaActual.codigo).padStart(3, "0");
        const url = `${API_BASE_URL}/api/carreras/app/${carreraActivaActual.id}/ruta` +
            `?codigoTaxista=${encodeURIComponent(codigo)}` +
            `&latitud=${encodeURIComponent(String(latTaxi))}` +
            `&longitud=${encodeURIComponent(String(lngTaxi))}`;

        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ruta) throw new Error(data?.message || "Ruta no disponible");

        const ruta = data.ruta;
        const puntos = decodificarPolyline(ruta.encodedPolyline);
        if (puntos.length > 1) {
            limpiarRutaGoogle();
            lineaRutaBorde = new google.maps.Polyline({
                map: mapaGoogle,
                path: puntos,
                strokeColor: "#FFFFFF",
                strokeOpacity: 0.78,
                strokeWeight: 9,
                geodesic: true,
            });
            lineaRuta = new google.maps.Polyline({
                map: mapaGoogle,
                path: puntos,
                strokeColor: "#6D28D9",
                strokeOpacity: 1,
                strokeWeight: 6,
                geodesic: true,
            });
        }

        const metros = Number(ruta.distanciaMetros || 0);
        const distanciaTexto = metros > 0 && metros < 1000
            ? `${Math.round(metros)} m`
            : `${Number(ruta.distanciaKm || 0).toFixed(1)} km`;
        const minutos = Math.max(1, Number(ruta.etaMinutos || 1));
        if (estadoRutaWeb) estadoRutaWeb.innerHTML = `<strong>${minutos} min</strong> · ${distanciaTexto}`;
        actualizarCamaraNavegacion(latTaxi, lngTaxi, ultimaUbicacion?.heading);
    } catch (error) {
        console.log("No se pudo calcular ruta Google:", error);
        if (estadoRutaWeb) estadoRutaWeb.innerHTML = 'Ruta <strong>no disponible</strong>';
    }
}

async function enviarUbicacionBackend(latitud, longitud) {
    if (!carreraActivaActual || !taxistaActual) return;
    const ahora = Date.now();
    if (ahora - ultimoEnvioGps < 12000) return;
    ultimoEnvioGps = ahora;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/carreras/app/${carreraActivaActual.id}/ubicacion`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    codigoTaxista: String(taxistaActual.codigo).padStart(3, "0"),
                    latitud,
                    longitud,
                }),
            }
        );
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            console.log("GPS rechazado:", data);
            return;
        }
        if (data?.seguimientoAproximacionActivo === false) {
            actualizarEstadoGps("activo", "UBICACIÓN ACTIVA");
        }
        await consultarCarreraActiva(false);
    } catch (error) {
        console.log("Error enviando GPS:", error);
    }
}

async function procesarUbicacion(posicion) {
    if (!taxistaActual) return;
    const latitud = posicion.coords.latitude;
    const longitud = posicion.coords.longitude;
    const heading = posicion.coords.heading;
    ultimaUbicacion = { latitud, longitud, heading };
    ocultarSolicitudUbicacion();
    actualizarEstadoGps("activo", "UBICACIÓN ACTIVA");

    await crearMapaCarrera(latitud, longitud);

    if (marcadorTaxi) {
        marcadorTaxi.setPosition({ lat: latitud, lng: longitud });
        if (window.google?.maps) marcadorTaxi.setIcon(iconoTaxiGoogle(heading));
    }

    actualizarCamaraNavegacion(latitud, longitud, heading);

    if (carreraActivaActual) {
        calcularRuta(latitud, longitud);
        enviarUbicacionBackend(latitud, longitud);
    }
}

function errorGps(error) {
    console.log("Error GPS:", error);
    let mensaje = "No fue posible obtener tu ubicación.";
    if (error.code === 1) mensaje = "Permiso de ubicación desactivado.";
    actualizarEstadoGps("error", mensaje);
}

function mostrarBotonUbicacion(mensaje = "Toca para permitir tu ubicación") {
    if (textoMapaCargando) textoMapaCargando.textContent = mensaje;
    spinnerUbicacion?.classList.add("oculto");
    botonActivarUbicacion?.classList.remove("oculto");
    ayudaUbicacion?.classList.remove("oculto");
    mapaCargando?.classList.remove("oculto");
}

function ocultarSolicitudUbicacion() {
    if (timerMostrarBotonUbicacion) {
        clearTimeout(timerMostrarBotonUbicacion);
        timerMostrarBotonUbicacion = null;
    }
    botonActivarUbicacion?.classList.add("oculto");
    ayudaUbicacion?.classList.add("oculto");
    spinnerUbicacion?.classList.remove("oculto");
    if (ultimaUbicacion) mapaCargando?.classList.add("oculto");
}

function iniciarWatchGps() {
    if (gpsWatchId !== null || !navigator.geolocation || (!enLinea && !carreraActivaActual)) return;
    gpsWatchId = navigator.geolocation.watchPosition(
        posicion => { ocultarSolicitudUbicacion(); procesarUbicacion(posicion); },
        error => {
            errorGps(error);
            if (error?.code === 1) mostrarBotonUbicacion("Rapitaxi necesita permiso de ubicación");
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );
}

function solicitarUbicacion(porUsuario = false) {
    if (!navigator.geolocation) {
        actualizarEstadoGps("error", "Este dispositivo no permite GPS.");
        mostrarBotonUbicacion("GPS no disponible en este dispositivo");
        return;
    }
    if (!enLinea && !carreraActivaActual) return;
    if (textoMapaCargando) textoMapaCargando.textContent = porUsuario ? "Autorizando ubicación..." : "Ubicando tu taxi...";
    spinnerUbicacion?.classList.remove("oculto");
    navigator.geolocation.getCurrentPosition(
        posicion => { ocultarSolicitudUbicacion(); procesarUbicacion(posicion); iniciarWatchGps(); },
        error => {
            errorGps(error);
            if (porUsuario || [1,2,3].includes(error?.code)) {
                mostrarBotonUbicacion(error?.code === 1 ? "Permite la ubicación para continuar" : "No pudimos obtener tu ubicación. Toca para reintentar");
            }
        },
        { enableHighAccuracy: !porUsuario, timeout: porUsuario ? 12000 : 15000, maximumAge: porUsuario ? 60000 : 3000 }
    );
}

function iniciarGpsCarrera() {
    if ((!enLinea && !carreraActivaActual) || gpsWatchId !== null) return;
    actualizarEstadoGps("normal", "Solicitando ubicación...");
    solicitarUbicacion(false);
    if (!ultimaUbicacion) {
        clearTimeout(timerMostrarBotonUbicacion);
        timerMostrarBotonUbicacion = setTimeout(() => {
            if (!ultimaUbicacion && gpsWatchId === null) mostrarBotonUbicacion();
        }, 1800);
    }
}

function detenerGpsCarrera(limpiarUbicacion = false) {
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    if (limpiarUbicacion) ultimaUbicacion = null;
}

function reactivarGpsCarrera() {
    if (!taxistaActual || (!enLinea && !carreraActivaActual)) return;
    navigator.geolocation?.getCurrentPosition(
        procesarUbicacion,
        errorGps,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
            ultimaUbicacion.longitud,
            true
        );
    }


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

async function cargarCarreras(mostrarCarga = false) {
    if (!taxistaActual || !enLinea) {
        carreras = [];
        indiceCarrera = 0;
        renderCarreras();
        return;
    }

    try {
        if (mostrarCarga) {
            ocultarEstadosCarreras();
            mostrar(cargandoCarreras);
        }

        let url = `${API_BASE_URL}/api/carreras/app/disponibles`;
        if (ultimaUbicacion) {
            const codigo = String(taxistaActual.codigo).padStart(3, "0");
            url += `?codigoTaxista=${encodeURIComponent(codigo)}` +
                `&latitud=${encodeURIComponent(String(ultimaUbicacion.latitud))}` +
                `&longitud=${encodeURIComponent(String(ultimaUbicacion.longitud))}`;
        }

        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
            console.log("Error cargando carreras:", data);
            return;
        }

        const recibidas = Array.isArray(data?.carreras) ? data.carreras : [];
        const idsDisponibles = new Set(recibidas.map(c => c.id));
        for (const id of Array.from(carrerasRechazadas)) {
            if (!idsDisponibles.has(id)) carrerasRechazadas.delete(id);
        }

        const nuevas = recibidas.filter(c => !idsCarrerasConocidas.has(c.id));
        idsCarrerasConocidas = idsDisponibles;
        carreras = recibidas.filter(c => !carrerasRechazadas.has(c.id));

        if (nuevas.length > 0 && document.visibilityState === "visible") {
            reproducirSonidoNuevaCarrera();
        }

        if (indiceCarrera >= carreras.length) indiceCarrera = 0;
        renderCarreras();
    } catch (error) {
        console.log("Error consultando carreras:", error);
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
            iniciarGpsCarrera();

            await cargarCarreras(
                true
            );

            iniciarPollingCarreras();

        } else {

            detenerPollingCarreras();
            detenerGpsCarrera(false);

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
    detenerGpsCarrera(true);
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
    if (!mapaGoogle || !ultimaUbicacion) return;
    mapaGoogle.panTo({ lat: ultimaUbicacion.latitud, lng: ultimaUbicacion.longitud });
    mapaGoogle.setZoom(Math.max(mapaGoogle.getZoom() || 0, carreraActivaActual ? 17 : 16));
    actualizarCamaraNavegacion(ultimaUbicacion.latitud, ultimaUbicacion.longitud, ultimaUbicacion.heading);
}

/*
  ======================================
  WEB PUSH IPHONE
  ======================================
*/


function convertirBase64UrlAUint8Array(
    base64String
) {

    const padding =
        "=".repeat(
            (
                4 -
                base64String.length %
                4
            ) % 4
        );


    const base64 =
        (
            base64String +
            padding
        )
            .replace(
                /-/g,
                "+"
            )
            .replace(
                /_/g,
                "/"
            );


    const rawData =
        window.atob(
            base64
        );


    return Uint8Array.from(
        [...rawData].map(
            caracter =>
                caracter.charCodeAt(
                    0
                )
        )
    );

}


async function obtenerRegistroServiceWorker() {

    if (
        !(
            "serviceWorker"
            in navigator
        )
    ) {

        throw new Error(
            "SERVICE_WORKER_NO_DISPONIBLE"
        );

    }


    await navigator
        .serviceWorker
        .register(
            "/taxista/sw.js",
            {
                scope:
                    "/taxista/",
            }
        );


    return navigator
        .serviceWorker
        .ready;

}


async function actualizarEstadoNotificaciones() {

    if (
        !botonNotificaciones
    ) {
        return;
    }


    if (
        !(
            "Notification"
            in window
        ) ||
        !(
            "PushManager"
            in window
        ) ||
        !(
            "serviceWorker"
            in navigator
        )
    ) {

        botonNotificaciones
            .textContent =
            "🔕 NO DISPONIBLE";

        botonNotificaciones
            .disabled =
            true;

        return;

    }


    if (
        Notification.permission ===
        "denied"
    ) {

        botonNotificaciones
            .textContent =
            "🔕 BLOQUEADAS";

        botonNotificaciones
            .classList
            .add(
                "bloqueado"
            );

        return;

    }


    try {

        const registration =
            await obtenerRegistroServiceWorker();


        const subscription =
            await registration
                .pushManager
                .getSubscription();


        if (
            Notification.permission ===
            "granted" &&
            subscription
        ) {

            botonNotificaciones
                .textContent =
                "🔔 ACTIVAS";

            botonNotificaciones
                .classList
                .add(
                    "activo"
                );

            return;

        }

    } catch (
    error
    ) {

        console.log(
            "Estado Web Push:",
            error
        );

    }


    botonNotificaciones
        .textContent =
        "🔔 ACTIVAR";

}


async function activarNotificaciones() {

    if (
        !sessionToken
    ) {

        window.alert(
            "Inicia sesión antes de activar las notificaciones."
        );

        return;

    }


    if (
        !(
            "Notification"
            in window
        ) ||
        !(
            "PushManager"
            in window
        ) ||
        !(
            "serviceWorker"
            in navigator
        )
    ) {

        window.alert(
            "Este dispositivo no admite notificaciones Web Push."
        );

        return;

    }


    botonNotificaciones.disabled =
        true;

    botonNotificaciones.textContent =
        "ACTIVANDO...";


    try {

        /*
          En iPhone este permiso debe
          pedirse como consecuencia directa
          del toque del taxista.
        */

        const permission =
            await Notification
                .requestPermission();


        if (
            permission !==
            "granted"
        ) {

            if (
                permission ===
                "denied"
            ) {

                window.alert(
                    "Las notificaciones están bloqueadas. Debes habilitarlas en Ajustes de iPhone para Rapitaxi."
                );

            }


            await actualizarEstadoNotificaciones();

            return;

        }


        const registration =
            await obtenerRegistroServiceWorker();


        let subscription =
            await registration
                .pushManager
                .getSubscription();


        if (!subscription) {

            const responseKey =
                await fetch(
                    `${API_BASE_URL}/api/web-push/public-key`
                );


            const dataKey =
                await responseKey
                    .json();


            if (
                !responseKey.ok ||
                !dataKey?.publicKey
            ) {

                throw new Error(
                    "No se pudo obtener la clave Web Push."
                );

            }


            subscription =
                await registration
                    .pushManager
                    .subscribe({
                        userVisibleOnly:
                            true,

                        applicationServerKey:
                            convertirBase64UrlAUint8Array(
                                dataKey.publicKey
                            ),
                    });

        }


        const response =
            await fetch(
                `${API_BASE_URL}/api/web-push/subscribe`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${sessionToken}`,
                    },

                    body:
                        JSON.stringify({
                            subscription:
                                subscription.toJSON(),
                        }),
                }
            );


        const data =
            await response
                .json()
                .catch(
                    () => null
                );


        if (
            !response.ok
        ) {

            throw new Error(
                data?.message ||
                "No se pudo registrar el iPhone."
            );

        }


        botonNotificaciones
            .textContent =
            "🔔 ACTIVAS";

        botonNotificaciones
            .classList
            .remove(
                "bloqueado"
            );

        botonNotificaciones
            .classList
            .add(
                "activo"
            );


        window.alert(
            "Notificaciones activadas correctamente. Rapitaxi podrá avisarte cuando llegue una nueva carrera."
        );

    } catch (
    error
    ) {

        console.error(
            "Error activando Web Push:",
            error
        );


        window.alert(
            error?.message ||
            "No fue posible activar las notificaciones."
        );


        await actualizarEstadoNotificaciones();

    } finally {

        botonNotificaciones.disabled =
            false;

    }

}

/*
  EVENTOS
*/
botonNotificaciones
    ?.addEventListener(
        "click",
        activarNotificaciones
    );

botonAceptar?.addEventListener("click", aceptarCarrera);
botonRechazar?.addEventListener("click", rechazarCarreraLocal);

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

if (botonActivarUbicacion) {
    botonActivarUbicacion.addEventListener("click", () => {
        // Muy importante para iOS: getCurrentPosition se llama
        // directamente desde el gesto del usuario.
        solicitarUbicacion(true);
    });
}


if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", event => {
        if (event?.data?.tipo === "NUEVA_CARRERA") {
            if (document.visibilityState === "visible") reproducirSonidoNuevaCarrera();
            if (taxistaActual && enLinea && !carreraActivaActual) cargarCarreras(false);
        }
    });
}

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

if (
  "serviceWorker" in navigator
) {

  navigator
    .serviceWorker
    .register(
      "/taxista/sw.js",
      {
        scope:
          "/taxista/",
      }
    )
    .then(
      () =>
        actualizarEstadoNotificaciones()
    )
    .catch(
      error =>
        console.log(
          "Service Worker:",
          error
        )
    );

}
/*
  INICIO
*/

cargarSesion();