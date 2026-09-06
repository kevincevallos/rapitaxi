const form =
  document.getElementById("formCarrera");

const crearBtn =
  document.getElementById("crearBtn");

const resultado =
  document.getElementById("resultado");

const errorBox =
  document.getElementById("error");

const numeroBox =
  document.getElementById("numero");

const mensajeBox =
  document.getElementById("mensaje");

const copiarBtn =
  document.getElementById("copiarBtn");

const whatsappBtn =
  document.getElementById("whatsappBtn");

let mensajeActual = "";


form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    errorBox.textContent = "";

    resultado.style.display = "none";

    crearBtn.disabled = true;

    crearBtn.textContent =
      "CREANDO...";


    const datos = {

      nombreCliente:
        document.getElementById("nombre").value.trim(),

      whatsappCliente:
        document.getElementById("whatsapp").value.trim(),

      latitud:
        Number(
          document.getElementById("latitud").value
        ),

      longitud:
        Number(
          document.getElementById("longitud").value
        ),

      referencia:
        document.getElementById("referencia").value.trim(),

      formaPago:
        document.getElementById("formaPago").value

    };


    try {

      const response =
        await fetch(
          "/api/carreras",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body:
              JSON.stringify(datos)
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "No se pudo crear la carrera"
        );

      }


      const carrera =
        data.carrera;


      mensajeActual =
`✅🚖 NUEVA CARRERA #${carrera.numero}

📌 *Referencia:* ${carrera.referencia}
💳 *Pago:* ${carrera.formaPago}

🔗 *Acepta la carrera aquí:*
${data.enlacePublico}`;


      numeroBox.textContent =
        `Carrera #${carrera.numero}`;


      mensajeBox.textContent =
        mensajeActual;


      whatsappBtn.href =
        `https://wa.me/?text=${encodeURIComponent(
          mensajeActual
        )}`;


      resultado.style.display =
        "block";


      form.reset();


    } catch (error) {

      console.error(error);

      errorBox.textContent =
        error.message;

    } finally {

      crearBtn.disabled = false;

      crearBtn.textContent =
        "CREAR CARRERA";

    }

  }
);


copiarBtn.addEventListener(
  "click",
  async () => {

    if (!mensajeActual) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        mensajeActual
      );

      copiarBtn.textContent =
        "✓ MENSAJE COPIADO";


      setTimeout(
        () => {

          copiarBtn.textContent =
            "COPIAR MENSAJE";

        },
        1800
      );

    } catch (error) {

      console.error(error);

      alert(
        "No se pudo copiar automáticamente."
      );

    }

  }
);