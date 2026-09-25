const GOOGLE_MAPS_SERVER_API_KEY =
  String(
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    ""
  ).trim();


function obtenerApiKey() {
  if (!GOOGLE_MAPS_SERVER_API_KEY) {
    throw new Error(
      "GOOGLE_MAPS_SERVER_API_KEY_NO_CONFIGURADA"
    );
  }

  return GOOGLE_MAPS_SERVER_API_KEY;
}


export async function obtenerReferenciaGoogle(
  latitud: number,
  longitud: number
) {
  if (
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud)
  ) {
    return null;
  }

  try {
    const params =
      new URLSearchParams({
        latlng:
          `${latitud},${longitud}`,

        language:
          "es",

        region:
          "ec",

        key:
          obtenerApiKey(),
      });


    const response =
      await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
      );


    if (!response.ok) {
      console.error(
        "Google Geocoding HTTP:",
        response.status
      );

      return null;
    }


    const data: any =
      await response.json();


    if (
      data?.status !== "OK" ||
      !Array.isArray(data?.results) ||
      data.results.length === 0
    ) {
      console.error(
        "Google Geocoding:",
        data?.status,
        data?.error_message || ""
      );

      return null;
    }


    const resultado =
      data.results[0];


    const referencia =
      String(
        resultado?.formatted_address ||
        ""
      ).trim();


    return referencia || null;

  } catch (error) {
    console.error(
      "Error consultando Google Geocoding:",
      error
    );

    return null;
  }
}


export type RutaGoogle = {
  distanciaMetros: number;
  distanciaKm: number;
  duracionSegundos: number;
  etaMinutos: number;
  encodedPolyline: string | null;
};


export async function calcularRutaGoogle(
  latitudOrigen: number,
  longitudOrigen: number,
  latitudDestino: number,
  longitudDestino: number
): Promise<RutaGoogle | null> {

  if (
    !Number.isFinite(latitudOrigen) ||
    !Number.isFinite(longitudOrigen) ||
    !Number.isFinite(latitudDestino) ||
    !Number.isFinite(longitudDestino)
  ) {
    return null;
  }


  try {
    const response =
      await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            "X-Goog-Api-Key":
              obtenerApiKey(),

            "X-Goog-FieldMask":
              [
                "routes.duration",
                "routes.distanceMeters",
                "routes.polyline.encodedPolyline",
              ].join(","),
          },

          body:
            JSON.stringify({
              origin: {
                location: {
                  latLng: {
                    latitude:
                      latitudOrigen,

                    longitude:
                      longitudOrigen,
                  },
                },
              },

              destination: {
                location: {
                  latLng: {
                    latitude:
                      latitudDestino,

                    longitude:
                      longitudDestino,
                  },
                },
              },

              travelMode:
                "DRIVE",

              /*
                Lo dejamos sin tráfico en esta
                primera versión para mantener
                el uso sencillo y predecible.
              */
              routingPreference:
                "TRAFFIC_UNAWARE",

              computeAlternativeRoutes:
                false,

              languageCode:
                "es-EC",

              units:
                "METRIC",
            }),
        }
      );


    if (!response.ok) {
      const texto =
        await response.text();

      console.error(
        "Google Routes HTTP:",
        response.status,
        texto
      );

      return null;
    }


    const data: any =
      await response.json();


    const ruta =
      data?.routes?.[0];


    if (!ruta) {
      return null;
    }


    const distanciaMetros =
      Number(
        ruta.distanceMeters
      );


    const duracionTexto =
      String(
        ruta.duration || "0s"
      );


    const duracionSegundos =
      Math.max(
        0,
        Math.round(
          Number(
            duracionTexto
              .replace(
                "s",
                ""
              )
          )
        )
      );


    if (
      !Number.isFinite(
        distanciaMetros
      ) ||
      !Number.isFinite(
        duracionSegundos
      )
    ) {
      return null;
    }


    return {
      distanciaMetros,

      distanciaKm:
        distanciaMetros /
        1000,

      duracionSegundos,

      etaMinutos:
        Math.max(
          1,
          Math.round(
            duracionSegundos /
            60
          )
        ),

      encodedPolyline:
        ruta?.polyline
          ?.encodedPolyline ||
        null,
    };

  } catch (error) {
    console.error(
      "Error consultando Google Routes:",
      error
    );

    return null;
  }
}