export async function obtenerDireccionDesdeCoordenadas(
  latitud: number,
  longitud: number
): Promise<string | null> {

  try {

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2` +
      `&lat=${encodeURIComponent(latitud)}` +
      `&lon=${encodeURIComponent(longitud)}` +
      `&zoom=18` +
      `&addressdetails=1`;


    const response =
      await fetch(
        url,
        {
          headers: {
            "User-Agent":
              "Rapitaxi/1.0 (https://rapitaxi-production.up.railway.app)",
            "Accept-Language":
              "es"
          }
        }
      );


    if (!response.ok) {
      console.error(
        "Error geocodificación:",
        response.status
      );

      return null;
    }


    const data: any =
      await response.json();


    const address =
      data.address || {};


    const calle =
      address.road ||
      address.pedestrian ||
      address.residential ||
      address.neighbourhood ||
      address.suburb;


    const sector =
      address.neighbourhood ||
      address.suburb ||
      address.quarter;


    const ciudad =
      address.city ||
      address.town ||
      address.village ||
      address.municipality;


    const partes: string[] = [];


    if (calle) {
      partes.push(calle);
    }


    if (
      sector &&
      sector !== calle
    ) {
      partes.push(sector);
    }


    if (
      ciudad &&
      !partes.includes(ciudad)
    ) {
      partes.push(ciudad);
    }


    if (partes.length > 0) {
      return partes.join(", ");
    }


    if (data.display_name) {
      return data.display_name;
    }


    return null;


  } catch (error) {

    console.error(
      "Error obteniendo dirección:",
      error
    );

    return null;

  }
}