const parametros =
  new URLSearchParams(
    window.location.search
  );


const token =
  parametros.get("token");


if (!token) {

  document.body.innerHTML = `
    <div class="error">
      <h2>Enlace no válido</h2>
      <p>
        Este enlace de seguimiento
        no contiene un token válido.
      </p>
    </div>
  `;

  throw new Error(
    "TRACKING_TOKEN_FALTANTE"
  );
}


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


let marcadorTaxi =
  null;


let marcadorCliente =
  null;


function textoEstado(
  estado
) {

  switch (estado) {

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


async function actualizarSeguimiento() {

  try {

    const respuesta =
      await fetch(
        `/api/carreras/seguimiento/${encodeURIComponent(token)}`,
        {
          cache: "no-store",
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


    document
      .getElementById("titulo")
      .textContent =
        `Carrera #${seguimiento.numero}`;


    document
      .getElementById("estado")
      .textContent =
        textoEstado(
          seguimiento.estado
        );


    /*
      Carrera terminada:
      el backend deja de entregar
      coordenadas del taxi.
    */

    if (
      seguimiento.activa === false
    ) {

      document
        .getElementById("taxista")
        .textContent =
          "--";


      document
        .getElementById("vehiculo")
        .textContent =
          "--";


      document
        .getElementById("distancia")
        .textContent =
          "--";


      document
        .getElementById("eta")
        .textContent =
          "--";


      document
        .getElementById("mensaje")
        .textContent =
          seguimiento.mensaje ||
          "Esta carrera ha finalizado.";


      return;
    }


    if (
      seguimiento.taxista
    ) {

      document
        .getElementById("taxista")
        .textContent =
          seguimiento.taxista.nombre ||
          "--";


      const datosVehiculo = [
        seguimiento.taxista.vehiculo,
        seguimiento.taxista.colorVehiculo,
        seguimiento.taxista.placa,
      ]
        .filter(Boolean)
        .join(" · ");


      document
        .getElementById("vehiculo")
        .textContent =
          datosVehiculo || "--";
    }


    document
      .getElementById("distancia")
      .textContent =
        seguimiento.distanciaKm !== null

          ? `${seguimiento.distanciaKm} km`

          : "Calculando...";


    document
      .getElementById("eta")
      .textContent =
        seguimiento.etaMinutos !== null

          ? `${seguimiento.etaMinutos} min`

          : "Calculando...";


    const destino =
      seguimiento.destino;


    if (
      destino
    ) {

      const posicionCliente = [
        destino.latitud,
        destino.longitud,
      ];


      if (!marcadorCliente) {

        marcadorCliente =
          L.marker(
            posicionCliente
          )
          .addTo(map)
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


    if (
      seguimiento.taxi
    ) {

      const posicionTaxi = [
        seguimiento.taxi.latitud,
        seguimiento.taxi.longitud,
      ];


      if (!marcadorTaxi) {

        marcadorTaxi =
          L.marker(
            posicionTaxi
          )
          .addTo(map)
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

        map.fitBounds(
          [
            [
              destino.latitud,
              destino.longitud,
            ],

            posicionTaxi,
          ],

          {
            padding:
              [50, 50],

            maxZoom:
              17,
          }
        );

      }


      document
        .getElementById("mensaje")
        .textContent =
          "La posición del taxi se actualiza automáticamente.";

    } else if (
      destino
    ) {

      map.setView(
        [
          destino.latitud,
          destino.longitud,
        ],
        16
      );


      document
        .getElementById("mensaje")
        .textContent =
          "Esperando la primera ubicación GPS del taxista.";
    }


  } catch (error) {

    console.error(
      "Error actualizando seguimiento:",
      error
    );


    document
      .getElementById("mensaje")
      .textContent =
        "No pudimos actualizar la ubicación. Intentaremos nuevamente.";
  }
}


actualizarSeguimiento();


setInterval(
  actualizarSeguimiento,
  15000
);