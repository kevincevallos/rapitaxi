const parametros =
  new URLSearchParams(
    window.location.search
  );


/*
  ========================================
  TOKEN DE SEGUIMIENTO
  ========================================

  Soporta:

  /s/TOKEN

  y

  /seguimiento.html?token=TOKEN
*/

let token =
  parametros.get(
    "token"
  );


if (!token) {

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

      <h2>
        Enlace no válido
      </h2>

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

  Leaflet continúa siendo el motor.

  Cambiamos solamente el estilo visual
  del mapa a uno más limpio y moderno.
*/

const map =
  L.map(
    "map",
    {
      zoomControl:
        true,

      attributionControl:
        true,
    }
  )
    .setView(
      [
        -0.6985,
        -80.0925,
      ],

      15
    );


/*
  Mapa claro de CARTO basado en
  OpenStreetMap.

  No necesita API key.
*/

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",

  {
    subdomains:
      "abcd",

    maxZoom:
      20,

    attribution:
      "&copy; OpenStreetMap contributors &copy; CARTO",
  }
)
  .addTo(
    map
  );


/*
  ========================================
  ICONOS
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
        4 4 0 0 0 0-8Zm16 0
        a4 4 0 1 0 0 8
        4 4 0 0 0 0-8Z
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
        M32 5
        C20.4 5 11 14.4 11 26
        c0 15.5
        18.4 31.2
        19.2 31.9

        a2.8 2.8 0 0 0
        3.6 0

        C34.6 57.2
        53 41.5
        53 26

        C53 14.4
        43.6 5
        32 5

        Z

        m0 29

        a8 8 0 1 1
        0-16

        a8 8 0 0 1
        0 16
      "
    />
  </svg>
`;


/*
  Taxi amarillo
*/

const iconoTaxi =
  L.divIcon({

    className:
      "taxi-marker",

    html:
      `<div class="taxi-pin">${svgTaxi}</div>`,

    iconSize:
      [
        54,
        62,
      ],

    iconAnchor:
      [
        27,
        59,
      ],

    popupAnchor:
      [
        0,
        -54,
      ],

  });


/*
  Ubicación cliente
*/

const iconoCliente =
  L.divIcon({

    className:
      "client-marker",

    html:
      `<div class="client-pin">${svgPin}</div>`,

    iconSize:
      [
        48,
        54,
      ],

    iconAnchor:
      [
        24,
        51,
      ],

    popupAnchor:
      [
        0,
        -46,
      ],

  });


/*
  ========================================
  VARIABLES
  ========================================
*/

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
  IMPORTANTE:

  Solo centramos el mapa automáticamente
  la primera vez.

  Después el usuario puede moverlo y
  hacer zoom sin que el sistema lo
  obligue a regresar cada 15 segundos.
*/

let mapaAjustadoInicialmente =
  false;


/*
  Guardamos la última posición conocida
  para el botón de recentrar.
*/

let ultimoTaxi =
  null;


let ultimoDestino =
  null;


/*
  requestAnimationFrame usado para
  movimiento suave del taxi.
*/

let animacionTaxi =
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

      return (
        "Tu taxi fue asignado"
      );


    case "EN_CAMINO":

      return (
        "Tu taxi viene en camino"
      );


    case "CERCA":

      return (
        "Tu taxi está cerca"
      );


    case "LLEGO":

      /*
        CORREGIDO:

        antes decía que estaba llegando.
      */

      return (
        "Tu taxi ya llegó"
      );


    case "COMPLETADA":

      return (
        "Carrera finalizada"
      );


    case "CANCELADA":

      return (
        "Carrera cancelada"
      );


    default:

      return (
        "Seguimiento activo"
      );

  }

}


/*
  ========================================
  ACTUALIZAR ESTADO VISUAL
  ========================================
*/

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


  const estadoContenedor =
    document.getElementById(
      "estado"
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


  /*
    Permite cambiar visualmente
    CERCA / LLEGO / etc.
  */

  if (
    estadoContenedor
  ) {

    estadoContenedor.dataset.state =
      estado ||
      "ASIGNADA";

  }

}


/*
  ========================================
  CLAVE DE RUTA
  ========================================
*/

function crearRutaKey(
  taxi,
  destino
) {

  return [

    Number(
      taxi.latitud
    )
      .toFixed(
        5
      ),


    Number(
      taxi.longitud
    )
      .toFixed(
        5
      ),


    Number(
      destino.latitud
    )
      .toFixed(
        5
      ),


    Number(
      destino.longitud
    )
      .toFixed(
        5
      ),

  ]
    .join(
      "|"
    );

}


/*
  ========================================
  LIMPIAR RUTA
  ========================================
*/

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
  ========================================
  DIBUJAR RUTA
  ========================================

  Usamos OSRM para intentar seguir
  calles reales.

  Si OSRM falla, mostramos una línea
  de respaldo.
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
    key ===
    ultimaRutaKey
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
      data
        ?.routes
        ?.[0]
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

        (
          [
            longitud,
            latitud,
          ]
        ) => [

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
            0.88,

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
              0.88,

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


  } catch (
    error
  ) {

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

  forzar = false:

  solo se ejecuta una vez automáticamente.

  forzar = true:

  se usa cuando el cliente pulsa ◎
*/

function ajustarMapa(
  taxi,
  destino,
  forzar = false
) {

  /*
    Ya se ajustó una vez y el usuario
    NO pidió recentrar.
  */

  if (
    !forzar &&
    mapaAjustadoInicialmente
  ) {

    return;

  }


  /*
    Tenemos taxi + cliente.
  */

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
          [
            55,
            75,
          ],

        paddingBottomRight:
          [
            55,
            125,
          ],

        maxZoom:
          17,

        animate:
          true,

        duration:
          0.65,

      }

    );


    mapaAjustadoInicialmente =
      true;


    return;

  }


  /*
    Solo tenemos destino.
  */

  if (
    destino
  ) {

    map.setView(

      [
        destino.latitud,
        destino.longitud,
      ],

      16,

      {
        animate:
          true,
      }

    );


    mapaAjustadoInicialmente =
      true;

  }

}


/*
  ========================================
  BOTÓN RECENTRAR
  ========================================
*/

const btnRecentrar =
  document.getElementById(
    "btnRecentrar"
  );


if (
  btnRecentrar
) {

  btnRecentrar
    .addEventListener(

      "click",

      () => {

        ajustarMapa(

          ultimoTaxi,
          ultimoDestino,
          true

        );

      }

    );

}


/*
  ========================================
  MOVIMIENTO SUAVE TAXI
  ========================================

  Antes:

  marcador.setLatLng(...)
  y el taxi saltaba.

  Ahora:

  interpolamos entre la posición anterior
  y la nueva durante 1.2 segundos.
*/

function animarMarcadorTaxi(
  nuevaPosicion
) {

  if (
    !marcadorTaxi
  ) {

    return;

  }


  const inicio =
    marcadorTaxi
      .getLatLng();


  const fin =
    L.latLng(

      nuevaPosicion[0],
      nuevaPosicion[1]

    );


  /*
    Si prácticamente no se movió,
    no animamos.
  */

  if (

    Math.abs(
      inicio.lat -
      fin.lat
    ) <
    0.000001

    &&

    Math.abs(
      inicio.lng -
      fin.lng
    ) <
    0.000001

  ) {

    return;

  }


  /*
    Cancelamos una animación anterior
    si todavía estaba activa.
  */

  if (
    animacionTaxi
  ) {

    cancelAnimationFrame(
      animacionTaxi
    );

  }


  const duracion =
    1200;


  const comienzo =
    performance.now();


  function frame(
    ahora
  ) {

    const progreso =
      Math.min(

        1,

        (
          ahora -
          comienzo
        ) /
        duracion

      );


    /*
      Ease-out cúbico.
    */

    const suavizado =
      1 -
      Math.pow(
        1 -
        progreso,
        3
      );


    const lat =
      inicio.lat +

      (
        fin.lat -
        inicio.lat
      ) *
      suavizado;


    const lng =
      inicio.lng +

      (
        fin.lng -
        inicio.lng
      ) *
      suavizado;


    marcadorTaxi
      .setLatLng(
        [
          lat,
          lng,
        ]
      );


    if (
      progreso <
      1
    ) {

      animacionTaxi =
        requestAnimationFrame(
          frame
        );

    } else {

      animacionTaxi =
        null;

    }

  }


  animacionTaxi =
    requestAnimationFrame(
      frame
    );

}


/*
  ========================================
  ACTUALIZAR SEGUIMIENTO
  ========================================
*/

async function actualizarSeguimiento() {

  /*
    Evita consultas simultáneas
    si una petición tarda demasiado.
  */

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

        `/api/carreras/seguimiento/${encodeURIComponent(
          token
        )}`,

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
      ========================================
      NÚMERO DE CARRERA
      ========================================
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
      ========================================
      ESTADO
      ========================================
    */

    actualizarEstadoVisual(
      seguimiento.estado
    );


    /*
      ========================================
      CARRERA FINALIZADA / CANCELADA
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
      TAXISTA / VEHÍCULO
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

        seguimiento.taxista
          .vehiculo,

        seguimiento.taxista
          .colorVehiculo,

        seguimiento.taxista
          .placa,

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
      DISTANCIA
      ========================================
    */

    const distanciaElement =
      document.getElementById(
        "distancia"
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


    /*
      ========================================
      ETA
      ========================================
    */

    const etaElement =
      document.getElementById(
        "eta"
      );


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


    ultimoDestino =
      destino ||
      null;


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

      /*
        Guardamos la ubicación para
        poder recentrar después.
      */

      ultimoTaxi =
        seguimiento.taxi;


      const posicionTaxi = [

        seguimiento.taxi.latitud,
        seguimiento.taxi.longitud,

      ];


      /*
        Crear marcador primera vez.
      */

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

        /*
          Movimiento suave.
        */

        animarMarcadorTaxi(
          posicionTaxi
        );

      }


      /*
        ========================================
        RUTA
        ========================================
      */

      if (
        destino
      ) {

        await dibujarRuta(

          seguimiento.taxi,
          destino

        );


        /*
          Solo ocurre automáticamente
          la primera vez.
        */

        ajustarMapa(

          seguimiento.taxi,
          destino

        );

      }


      /*
        ========================================
        MENSAJE INFERIOR
        ========================================
      */

      const mensajeElement =
        document.getElementById(
          "mensaje"
        );


      if (
        mensajeElement
      ) {

        /*
          ========================================
          LLEGÓ
          ========================================
        */

        if (

          seguimiento.estado ===
          "LLEGO"

        ) {

          /*
            CORREGIDO:

            Ya NO dice
            "está llegando".

            Ahora confirma que ya llegó.
          */

          mensajeElement.textContent =

            "Tu taxi ya llegó al punto de recogida. Puedes acercarte al vehículo.";

        }


        /*
          ========================================
          CERCA
          ========================================
        */

        else if (

          seguimiento.estado ===
          "CERCA"

        ) {

          mensajeElement.textContent =

            "Tu taxi está muy cerca. Te recomendamos estar atento.";

        }


        /*
          ========================================
          EN CAMINO
          ========================================
        */

        else if (

          seguimiento.estado ===
          "EN_CAMINO"

        ) {

          mensajeElement.textContent =

            "Tu taxista va en camino. Puedes seguir su recorrido en el mapa.";

        }


        /*
          ========================================
          OTROS
          ========================================
        */

        else {

          mensajeElement.textContent =

            "La posición y la ruta del taxi se actualizan automáticamente.";

        }

      }

    }


    /*
      ========================================
      TODAVÍA NO HAY GPS TAXISTA
      ========================================
    */

    else if (
      destino
    ) {

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
      FIN DEL SEGUIMIENTO DE APROXIMACIÓN
      ========================================

      Esto ocurre cuando el taxista pulsa
      LLEGUÉ.

      Importante:

      La última posición permanece visible,
      pero dejamos de consultar nuevas
      posiciones según la lógica existente.
    */

    if (

      seguimiento
        .seguimientoAproximacionActivo ===
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


      const distanciaElement2 =
        document.getElementById(
          "distancia"
        );


      const etaElement2 =
        document.getElementById(
          "eta"
        );


      const estadoTextoElement =
        document.getElementById(
          "estadoTexto"
        );


      const estadoContenedor =
        document.getElementById(
          "estado"
        );


      /*
        Texto principal.
      */

      if (
        estadoTextoElement
      ) {

        estadoTextoElement.textContent =

          "Tu taxi ya llegó";

      }


      /*
        Color visual LLEGO.
      */

      if (
        estadoContenedor
      ) {

        estadoContenedor.dataset.state =

          "LLEGO";

      }


      /*
        Texto inferior.
      */

      if (
        mensajeElement
      ) {

        mensajeElement.textContent =

          seguimiento.mensaje ||

          "Tu taxi ya llegó al punto de recogida. El seguimiento de aproximación ha finalizado.";

      }


      /*
        Texto flotante mapa.
      */

      if (
        mapEstadoElement
      ) {

        mapEstadoElement.textContent =

          "Tu taxi ya llegó";

      }


      /*
        Ya no necesitamos ETA
        ni distancia.
      */

      if (
        distanciaElement2
      ) {

        distanciaElement2.textContent =
          "--";

      }


      if (
        etaElement2
      ) {

        etaElement2.textContent =
          "--";

      }


      /*
        Dejamos de consultar nuevas
        posiciones.
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

        "Seguimiento de aproximación finalizado."

      );

    }


  } catch (
    error
  ) {

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
  El backend sigue consultándose
  cada 15 segundos.

  Lo que cambia es que ahora el mapa
  NO se recentra automáticamente
  después de la primera carga.
*/

intervaloSeguimiento =

  setInterval(

    actualizarSeguimiento,

    10000

  );