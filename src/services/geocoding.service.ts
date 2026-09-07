export async function obtenerDireccionDesdeCoordenadas(
  latitud: number,
  longitud: number
): Promise<string | null> {

  try {

    if (
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud)
    ) {
      console.error(
        "❌ Geocoding: coordenadas inválidas:",
        latitud,
        longitud
      );

      return null;
    }


    console.log(
      `📍 Geocoding iniciado: ${latitud}, ${longitud}`
    );


    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        8000
      );


    const url =
      "https://nominatim.openstreetmap.org/reverse" +
      "?format=jsonv2" +
      `&lat=${encodeURIComponent(latitud)}` +
      `&lon=${encodeURIComponent(longitud)}` +
      "&zoom=18" +
      "&addressdetails=1" +
      "&namedetails=1";


    const response =
      await fetch(
        url,
        {
          headers: {
            "User-Agent":
              "Rapitaxi/1.0 (https://rapitaxi-production.up.railway.app)",

            "Accept":
              "application/json",

            "Accept-Language":
              "es"
          },

          signal:
            controller.signal
        }
      );


    clearTimeout(
      timeout
    );


    console.log(
      `🌍 Geocoding HTTP: ${response.status}`
    );


    if (!response.ok) {

      const texto =
        await response.text();

      console.error(
        "❌ Error Nominatim:",
        response.status,
        texto
      );

      return null;
    }


    const data: any =
      await response.json();


    console.log(
      "✅ Respuesta geocoding:",
      JSON.stringify(
        data
      )
    );


    const address =
      data.address || {};


    /*
      Primero intentamos conseguir
      una referencia corta y útil.
    */

    const nombreLugar =
      data.name ||
      address.amenity ||
      address.shop ||
      address.building ||
      address.tourism ||
      address.leisure ||
      null;


    const calle =
      address.road ||
      address.pedestrian ||
      address.residential ||
      address.footway ||
      address.path ||
      null;


    const numeroCasa =
      address.house_number ||
      null;


    const sector =
      address.neighbourhood ||
      address.suburb ||
      address.quarter ||
      address.city_district ||
      null;


    const ciudad =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      null;


    const canton =
      address.county ||
      null;


    const partes: string[] =
      [];


    if (nombreLugar) {

      partes.push(
        String(
          nombreLugar
        )
      );

    }


    if (calle) {

      const calleCompleta =
        numeroCasa
          ? `${calle} ${numeroCasa}`
          : calle;


      if (
        !partes.includes(
          calleCompleta
        )
      ) {
        partes.push(
          calleCompleta
        );
      }
    }


    if (
      sector &&
      !partes.includes(
        sector
      )
    ) {

      partes.push(
        sector
      );

    }


    if (
      ciudad &&
      !partes.includes(
        ciudad
      )
    ) {

      partes.push(
        ciudad
      );

    }


    if (
      partes.length > 0
    ) {

      const referencia =
        partes.join(
          ", "
        );


      console.log(
        "📌 Referencia generada:",
        referencia
      );


      return referencia;
    }


    /*
      Si OpenStreetMap no tiene
      suficientes campos separados,
      usamos display_name.
    */

    if (
      data.display_name &&
      String(
        data.display_name
      ).trim()
    ) {

      const referencia =
        String(
          data.display_name
        ).trim();


      console.log(
        "📌 Referencia display_name:",
        referencia
      );


      return referencia;
    }


    /*
      Último intento:
      ciudad / cantón.
    */

    if (
      ciudad ||
      canton
    ) {

      const referencia =
        [
          ciudad,
          canton
        ]
          .filter(
            Boolean
          )
          .join(
            ", "
          );


      console.log(
        "📌 Referencia básica:",
        referencia
      );


      return referencia;
    }


    console.error(
      "❌ Nominatim respondió pero no encontró referencia."
    );


    return null;


  } catch (error: any) {

    if (
      error?.name ===
      "AbortError"
    ) {

      console.error(
        "❌ Geocoding: tiempo de espera agotado."
      );

    } else {

      console.error(
        "❌ Error obteniendo dirección:",
        error
      );

    }


    return null;
  }
}