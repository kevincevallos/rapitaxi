const loading =
  document.getElementById("loading");

const pantallaCarrera =
  document.getElementById("pantallaCarrera");

const pantallaGanador =
  document.getElementById("pantallaGanador");

const pantallaAsignada =
  document.getElementById("pantallaAsignada");

const pantallaError =
  document.getElementById("pantallaError");

const aceptarBtn =
  document.getElementById("aceptarBtn");

const codigoError =
  document.getElementById("codigoError");

const codigoInputs = [
  document.getElementById("codigo1"),
  document.getElementById("codigo2"),
  document.getElementById("codigo3"),
];


function obtenerToken() {
  const partes =
    window.location.pathname
      .split("/")
      .filter(Boolean);

  if (
    partes.length < 2 ||
    partes[0] !== "c"
  ) {
    return null;
  }

  return partes[1];
}


function ocultarTodo() {
  loading.classList.add("hidden");

  pantallaCarrera.classList.add("hidden");

  pantallaGanador.classList.add("hidden");

  pantallaAsignada.classList.add("hidden");

  pantallaError.classList.add("hidden");
}


function mostrarAsignada() {
  ocultarTodo();

  pantallaAsignada.classList.remove("hidden");
}


function mostrarErrorGeneral() {
  ocultarTodo();

  pantallaError.classList.remove("hidden");
}


function mostrarErrorCodigo(mensaje) {
  codigoError.textContent = mensaje;
  codigoError.classList.remove("hidden");
}


function limpiarErrorCodigo() {
  codigoError.textContent = "";
  codigoError.classList.add("hidden");
}


function obtenerCodigoTaxista() {
  return codigoInputs
    .map(input => input.value)
    .join("");
}


codigoInputs.forEach(
  (input, index) => {

    input.addEventListener(
      "input",
      () => {

        input.value =
          input.value.replace(/\D/g, "");

        limpiarErrorCodigo();

        if (
          input.value &&
          index < codigoInputs.length - 1
        ) {
          codigoInputs[index + 1].focus();
        }

      }
    );


    input.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Backspace" &&
          !input.value &&
          index > 0
        ) {
          codigoInputs[index - 1].focus();
        }

      }
    );


    input.addEventListener(
      "paste",
      event => {

        event.preventDefault();

        const texto =
          event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 3);

        texto
          .split("")
          .forEach(
            (numero, posicion) => {

              if (codigoInputs[posicion]) {
                codigoInputs[posicion].value =
                  numero;
              }

            }
          );

        if (texto.length === 3) {
          codigoInputs[2].focus();
        }

      }
    );

  }
);


async function cargarCarrera() {
  const token =
    obtenerToken();

  if (!token) {
    mostrarErrorGeneral();
    return;
  }


  try {

    const response =
      await fetch(
        `/api/carreras/${encodeURIComponent(token)}`
      );


    if (!response.ok) {
      mostrarErrorGeneral();
      return;
    }


    const data =
      await response.json();

    const carrera =
      data.carrera;


    if (
      carrera.estado === "ASIGNADA"
    ) {
      mostrarAsignada();
      return;
    }


    document.getElementById(
      "numeroCarrera"
    ).textContent =
      `#${carrera.numero}`;


    document.getElementById(
      "referencia"
    ).textContent =
      carrera.referencia;


    document.getElementById(
      "formaPago"
    ).textContent =
      carrera.formaPago;


    ocultarTodo();

    pantallaCarrera.classList.remove(
      "hidden"
    );


    setTimeout(
      () => {
        codigoInputs[0].focus();
      },
      300
    );


  } catch (error) {

    console.error(error);

    mostrarErrorGeneral();
  }
}


aceptarBtn.addEventListener(
  "click",
  async () => {

    const token =
      obtenerToken();

    const codigoTaxista =
      obtenerCodigoTaxista();


    limpiarErrorCodigo();


    if (!token) {
      mostrarErrorGeneral();
      return;
    }


    if (!/^\d{3}$/.test(codigoTaxista)) {

      mostrarErrorCodigo(
        "Ingresa tu código completo de 3 dígitos."
      );

      return;
    }


    aceptarBtn.disabled = true;

    aceptarBtn.textContent =
      "VALIDANDO...";


    try {

      const response =
        await fetch(
          `/api/carreras/${encodeURIComponent(token)}/aceptar`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                codigoTaxista
              })
          }
        );


      const data =
        await response.json();


      if (
        response.status === 409 ||
        data.estado === "YA_ASIGNADA"
      ) {

        mostrarAsignada();

        return;
      }


      if (
        data.estado === "TAXISTA_NO_EXISTE"
      ) {

        mostrarErrorCodigo(
          "Código de conductor no registrado."
        );

        aceptarBtn.disabled = false;

        aceptarBtn.textContent =
          "ACEPTAR CARRERA →";

        return;
      }


      if (
        data.estado === "TAXISTA_INACTIVO"
      ) {

        mostrarErrorCodigo(
          "Este conductor no está habilitado."
        );

        aceptarBtn.disabled = false;

        aceptarBtn.textContent =
          "ACEPTAR CARRERA →";

        return;
      }


      if (
        data.estado === "CODIGO_INVALIDO" ||
        data.estado === "CODIGO_REQUERIDO"
      ) {

        mostrarErrorCodigo(
          data.message ||
          "Código de conductor inválido."
        );

        aceptarBtn.disabled = false;

        aceptarBtn.textContent =
          "ACEPTAR CARRERA →";

        return;
      }


      if (!response.ok) {

        aceptarBtn.disabled = false;

        aceptarBtn.textContent =
          "ACEPTAR CARRERA →";

        mostrarErrorCodigo(
          data.message ||
          "No se pudo aceptar la carrera."
        );

        return;
      }


      const carrera =
        data.carrera;


      document.getElementById(
        "mensajeGanador"
      ).textContent =
        `Has tomado la carrera #${carrera.numero}`;


      document.getElementById(
        "referenciaGanador"
      ).textContent =
        carrera.referencia;


      document.getElementById(
        "pagoGanador"
      ).textContent =
        carrera.formaPago;


      const whatsappBtn =
        document.getElementById(
          "whatsappBtn"
        );

      whatsappBtn.href =
        carrera.enlaceWhatsAppCliente;

      whatsappBtn.target =
        "_blank";

      whatsappBtn.rel =
        "noopener noreferrer";

      const ubicacionBtn =
        document.getElementById(
          "ubicacionBtn"
        );

      ubicacionBtn.href =
        carrera.enlaceGoogleMaps;

      ubicacionBtn.target =
        "_blank";

      ubicacionBtn.rel =
        "noopener noreferrer";

      ocultarTodo();

      pantallaGanador.classList.remove(
        "hidden"
      );


    } catch (error) {

      console.error(error);

      aceptarBtn.disabled = false;

      aceptarBtn.textContent =
        "ACEPTAR CARRERA →";

      mostrarErrorCodigo(
        "No se pudo conectar con el servidor."
      );

    }

  }
);


cargarCarrera();