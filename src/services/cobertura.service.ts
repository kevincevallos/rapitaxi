const CHONE_LAT =
  -0.69850423;

const CHONE_LON =
  -80.09250171;

const RADIO_CHONE_KM =
  8;


function gradosARadianes(
  grados: number
) {
  return (
    grados *
    Math.PI /
    180
  );
}


function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {

  const RADIO_TIERRA_KM =
    6371;


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


  return (
    RADIO_TIERRA_KM *
    c
  );
}


export function estaDentroDeChone(
  latitud: number,
  longitud: number
) {

  const distancia =
    calcularDistanciaKm(
      CHONE_LAT,
      CHONE_LON,
      latitud,
      longitud
    );


  return {
    permitido:
      distancia <=
      RADIO_CHONE_KM,

    distanciaKm:
      distancia
  };
}