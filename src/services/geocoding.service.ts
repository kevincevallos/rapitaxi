function limpiarParte(
  valor: unknown
) {
  const texto =
    String(
      valor ?? ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return texto || null;
}


function normalizarComparacion(
  valor: unknown
) {
  return String(
    valor ?? ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function agregarParteUnica(
  partes: string[],
  valor: unknown
) {
  const limpio =
    limpiarParte(
      valor
    );

  if (!limpio) {
    return;
  }


  const normalizado =
    normalizarComparacion(
      limpio
    );


  const yaExiste =
    partes.some(
      parte =>
        normalizarComparacion(
          parte
        ) ===
        normalizado
    );


  if (!yaExiste) {
    partes.push(
      limpio
    );
  }
}


function esReferenciaDemasiadoGenerica(
  valor: unknown
) {
  const texto =
    normalizarComparacion(
      valor
    );


  if (!texto) {
    return true;
  }


  const genericas =
    new Set([
      "chone",
      "chone ecuador",
      "chone manabi",
      "chone manabi ecuador",
      "manabi",
      "manabi ecuador",
      "ecuador",
    ]);


  return genericas.has(
    texto
  );
}


function obtenerReferenciaDesdeDisplayName(
  displayName: unknown,
  ciudad: string | null
) {
  const display =
    limpiarParte(
      displayName
    );


  if (!display) {
    return null;
  }


  const ciudadNormalizada =
    normalizarComparacion(
      ciudad
    );


  const ignorar =
    new Set([
      "ecuador",
      "manabi",
      "provincia de manabi",
    ]);


  const partesOriginales =
    display
      .split(",")
      .map(
        parte =>
          limpiarParte(
            parte
          )
      )
      .filter(
        (
          parte
        ): parte is string =>
          Boolean(
            parte
          )
      );


  const utiles: string[] =
    [];


  for (
    const parte
    of partesOriginales
  ) {

    const normalizada =
      normalizarComparacion(
        parte
      );


    if (
      !normalizada ||
      ignorar.has(
        normalizada
      ) ||
      /^\d{4,6}$/.test(
        normalizada
      )
    ) {
      continue;
    }


    if (
      ciudadNormalizada &&
      normalizada ===
        ciudadNormalizada
    ) {
      continue;
    }


    agregarParteUnica(
      utiles,
      parte
    );


    if (
      utiles.length >=
      3
    ) {
      break;
    }
  }


  if (
    utiles.length === 0
  ) {
    return null;
  }


  if (
    ciudad
  ) {
    agregarParteUnica(
      utiles,
      ciudad
    );
  }


  const referencia =
    utiles
      .slice(
        0,
        4
      )
      .join(
        ", "
      );


  if (
    esReferenciaDemasiadoGenerica(
      referencia
    )
  ) {
    return null;
  }


  return referencia;
}


export async function obtenerDireccionDesdeCoordenadas(
  latitud: number,
  longitud: number
): Promise<string | null> {

  try {

    if (
      !Number.isFinite(
        latitud
      ) ||
      !Number.isFinite(
        longitud
      )
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
        () =>
          controller.abort(),
        8000
      );


    const url =
      "https://nominatim.openstreetmap.org/reverse" +
      "?format=jsonv2" +
      `&lat=${encodeURIComponent(latitud)}` +
      `&lon=${encodeURIComponent(longitud)}` +
      "&zoom=18" +
      "&addressdetails=1" +
      "&namedetails=1" +
      "&extratags=1";


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
              "es",
          },

          signal:
            controller.signal,
        }
      );


    clearTimeout(
      timeout
    );


    console.log(
      `🌍 Geocoding HTTP: ${response.status}`
    );


    if (
      !response.ok
    ) {

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
      data.address ||
      {};


    const nombreLugar =
      limpiarParte(
        data.name ||
        address.amenity ||
        address.shop ||
        address.building ||
        address.tourism ||
        address.leisure ||
        address.office ||
        address.craft ||
        address.historic ||
        address.railway ||
        null
      );


    const calle =
      limpiarParte(
        address.road ||
        address.pedestrian ||
        address.residential ||
        address.footway ||
        address.path ||
        address.cycleway ||
        null
      );


    const numeroCasa =
      limpiarParte(
        address.house_number ||
        null
      );


    const sector =
      limpiarParte(
        address.neighbourhood ||
        address.suburb ||
        address.quarter ||
        address.city_district ||
        address.district ||
        address.city_block ||
        address.hamlet ||
        address.locality ||
        null
      );


    const ciudad =
      limpiarParte(
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        null
      );


    const partes: string[] =
      [];


    if (
      nombreLugar &&
      !esReferenciaDemasiadoGenerica(
        nombreLugar
      )
    ) {
      agregarParteUnica(
        partes,
        nombreLugar
      );
    }


    if (
      calle
    ) {

      const calleCompleta =
        numeroCasa
          ? `${calle} ${numeroCasa}`
          : calle;


      agregarParteUnica(
        partes,
        calleCompleta
      );
    }


    if (
      sector &&
      !esReferenciaDemasiadoGenerica(
        sector
      )
    ) {
      agregarParteUnica(
        partes,
        sector
      );
    }


    if (
      ciudad &&
      partes.length > 0
    ) {
      agregarParteUnica(
        partes,
        ciudad
      );
    }


    if (
      partes.length > 0
    ) {

      const referencia =
        partes
          .slice(
            0,
            4
          )
          .join(
            ", "
          );


      if (
        !esReferenciaDemasiadoGenerica(
          referencia
        )
      ) {

        console.log(
          "📌 Referencia detallada generada:",
          referencia
        );


        return referencia;
      }
    }


    const referenciaDisplay =
      obtenerReferenciaDesdeDisplayName(
        data.display_name,
        ciudad
      );


    if (
      referenciaDisplay
    ) {

      console.log(
        "📌 Referencia obtenida desde display_name:",
        referenciaDisplay
      );


      return referenciaDisplay;
    }


    console.log(
      "⚠️ Geocoding sin referencia específica. Se usará el fallback de WhatsApp."
    );


    return null;


  } catch (
    error: any
  ) {

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
