let taxistasActuales = [];
const tablaCarreras =
  document.getElementById(
    "tablaCarreras"
  );

const tablaTaxistas =
  document.getElementById(
    "tablaTaxistas"
  );


const tabCarreras =
  document.getElementById(
    "tabCarreras"
  );

const tabTaxistas =
  document.getElementById(
    "tabTaxistas"
  );

const panelCarreras =
  document.getElementById(
    "panelCarreras"
  );

const panelTaxistas =
  document.getElementById(
    "panelTaxistas"
  );


const overlay =
  document.getElementById(
    "overlay"
  );

const abrirRegistro =
  document.getElementById(
    "abrirRegistro"
  );

const cerrarRegistro =
  document.getElementById(
    "cerrarRegistro"
  );

const formTaxista =
  document.getElementById(
    "formTaxista"
  );

const codigoInput =
  document.getElementById(
    "codigo"
  );

const codigoPreview =
  document.getElementById(
    "codigoPreview"
  );

const mensajeFormulario =
  document.getElementById(
    "mensajeFormulario"
  );


function cambiarTab(tipo) {

  tabCarreras.classList.remove(
    "active"
  );

  tabTaxistas.classList.remove(
    "active"
  );

  panelCarreras.classList.remove(
    "active"
  );

  panelTaxistas.classList.remove(
    "active"
  );


  if (tipo === "carreras") {

    tabCarreras.classList.add(
      "active"
    );

    panelCarreras.classList.add(
      "active"
    );

    cargarCarreras();

  } else {

    tabTaxistas.classList.add(
      "active"
    );

    panelTaxistas.classList.add(
      "active"
    );

    cargarTaxistas();

  }
}


tabCarreras.addEventListener(
  "click",
  () => cambiarTab("carreras")
);


tabTaxistas.addEventListener(
  "click",
  () => cambiarTab("taxistas")
);


document
  .getElementById(
    "actualizarCarreras"
  )
  .addEventListener(
    "click",
    cargarCarreras
  );


async function cargarCarreras() {

  tablaCarreras.innerHTML =
    `<tr>
      <td colspan="7">
        Cargando...
      </td>
    </tr>`;


  try {

    const response =
      await fetch(
        "/api/carreras/admin/listado"
      );

    const data =
      await response.json();


    if (!data.success) {
      throw new Error();
    }


    if (
      data.carreras.length === 0
    ) {

      tablaCarreras.innerHTML =
        `<tr>
          <td
            colspan="7"
            class="vacio"
          >
            No existen carreras.
          </td>
        </tr>`;

      return;
    }


    tablaCarreras.innerHTML =
      data.carreras
        .map(carrera => {

          const estado =
            carrera.estado ===
            "BUSCANDO"
              ? `<span class="badge buscando">
                   BUSCANDO
                 </span>`
              : `<span class="badge asignada">
                   ASIGNADA
                 </span>`;


          const taxista =
            carrera.taxista
              ? `${carrera.taxista.codigo} - ${carrera.taxista.nombre}`
              : "—";


          const placa =
            carrera.taxista
              ? carrera.taxista.placa
              : "—";


          const fecha =
            new Date(
              carrera.fechaCreacion
            ).toLocaleString();


          return `
            <tr>

              <td>
                <strong>
                  #${carrera.numero}
                </strong>
              </td>

              <td>
                ${estado}
              </td>

              <td>
                ${carrera.referencia}
              </td>

              <td>
                ${carrera.formaPago}
              </td>

              <td>
                ${taxista}
              </td>

              <td>
                ${placa}
              </td>

              <td>
                ${fecha}
              </td>

            </tr>
          `;

        })
        .join("");


  } catch (error) {

    console.error(error);

    tablaCarreras.innerHTML =
      `<tr>
        <td
          colspan="7"
          class="vacio"
        >
          Error cargando carreras.
        </td>
      </tr>`;
  }
}


async function cargarTaxistas() {

  tablaTaxistas.innerHTML =
    `<tr>
      <td colspan="6">
        Cargando...
      </td>
    </tr>`;


  try {

    const response =
      await fetch(
        "/api/taxistas"
      );

    const data =
      await response.json();


    if (!data.success) {
      throw new Error();
    }
    taxistasActuales = data.taxistas;

    if (
      data.taxistas.length === 0
    ) {

      tablaTaxistas.innerHTML =
        `<tr>
          <td
            colspan="6"
            class="vacio"
          >
            No existen taxistas registrados.
          </td>
        </tr>`;

      return;
    }


tablaTaxistas.innerHTML =
  data.taxistas
    .map(taxista => {

      const estado =
        taxista.activo
          ? `<span class="badge activo">
               ACTIVO
             </span>`
          : `<span class="badge inactivo">
               INACTIVO
             </span>`;

      const textoBoton =
        taxista.activo
          ? "DESACTIVAR"
          : "ACTIVAR";

      return `
        <tr>

          <td>
            <strong>
              ${taxista.codigo}
            </strong>
          </td>

          <td>${taxista.nombre}</td>

          <td>${taxista.placa}</td>

          <td>${taxista.vehiculo}</td>

          <td>
            ${taxista.telefono || "—"}
          </td>

          <td>
            ${estado}
          </td>

          <td>

            <button
              type="button"
              class="btn-small btn-edit editar-taxista"
              data-id="${taxista.id}"
            >
              EDITAR
            </button>

            <button
              type="button"
              class="btn-small btn-toggle cambiar-estado-taxista"
              data-id="${taxista.id}"
              data-activo="${taxista.activo}"
            >
              ${textoBoton}
            </button>

          </td>

        </tr>
      `;

    })
    .join("");
document
  .querySelectorAll(".editar-taxista")
  .forEach(boton => {

    boton.addEventListener(
      "click",
      () => {

        const id =
          Number(boton.dataset.id);

        const taxista =
          taxistasActuales.find(
            t => t.id === id
          );

        if (!taxista) {
          console.error(
            "Taxista no encontrado:",
            id
          );

          return;
        }

        editarTaxista(taxista);
      }
    );

  });


document
  .querySelectorAll(
    ".cambiar-estado-taxista"
  )
  .forEach(boton => {

    boton.addEventListener(
      "click",
      async () => {

        const id =
          Number(boton.dataset.id);

        const estadoActual =
          boton.dataset.activo === "true";

        await cambiarEstadoTaxista(
          id,
          !estadoActual
        );
      }
    );

  });

  } catch (error) {

    console.error(error);

    tablaTaxistas.innerHTML =
      `<tr>
        <td
          colspan="6"
          class="vacio"
        >
          Error cargando taxistas.
        </td>
      </tr>`;
  }
}


abrirRegistro.addEventListener(
  "click",
  () => {

    mensajeFormulario.innerHTML =
      "";

    overlay.classList.add(
      "active"
    );

    codigoInput.focus();
  }
);


function cerrarModal() {

  overlay.classList.remove(
    "active"
  );

  formTaxista.reset();

  codigoPreview.textContent =
    "---";

  mensajeFormulario.innerHTML =
    "";
}


cerrarRegistro.addEventListener(
  "click",
  cerrarModal
);


overlay.addEventListener(
  "click",
  event => {

    if (
      event.target === overlay
    ) {
      cerrarModal();
    }

  }
);


codigoInput.addEventListener(
  "input",
  () => {

    codigoInput.value =
      codigoInput.value
        .replace(/\D/g, "")
        .slice(0, 3);


    if (!codigoInput.value) {

      codigoPreview.textContent =
        "---";

      return;
    }


    codigoPreview.textContent =
      codigoInput.value.padStart(
        3,
        "0"
      );
  }
);


formTaxista.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    mensajeFormulario.innerHTML =
      "";


    const boton =
      document.getElementById(
        "guardarTaxista"
      );


    boton.disabled = true;

    boton.textContent =
      "GUARDANDO...";


    const datos = {

      codigo:
        codigoInput.value,

      nombre:
        document
          .getElementById(
            "nombre"
          )
          .value
          .trim(),

      placa:
        document
          .getElementById(
            "placa"
          )
          .value
          .trim(),

      vehiculo:
        document
          .getElementById(
            "vehiculo"
          )
          .value
          .trim(),

      telefono:
        document
          .getElementById(
            "telefono"
          )
          .value
          .trim()

    };


    try {

      const response =
        await fetch(
          "/api/taxistas",
          {
            method:"POST",

            headers:{
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(datos)
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        mensajeFormulario.innerHTML =
          `<div class="error">
             ${data.message}
           </div>`;

        return;
      }


      mensajeFormulario.innerHTML =
        `<div class="success">
           ✓ Taxista ${data.taxista.codigo}
           registrado correctamente
         </div>`;


      await cargarTaxistas();


      setTimeout(
        cerrarModal,
        900
      );


    } catch (error) {

      console.error(error);

      mensajeFormulario.innerHTML =
        `<div class="error">
           Error de conexión
         </div>`;


    } finally {

      boton.disabled = false;

      boton.textContent =
        "GUARDAR TAXISTA";

    }

  }
);


cargarCarreras();

const overlayEditar =
  document.getElementById(
    "overlayEditar"
  );

const cerrarEdicion =
  document.getElementById(
    "cerrarEdicion"
  );

const formEditarTaxista =
  document.getElementById(
    "formEditarTaxista"
  );

const mensajeEdicion =
  document.getElementById(
    "mensajeEdicion"
  );


function editarTaxista(taxista) {

  document.getElementById(
    "editarId"
  ).value =
    taxista.id;

  document.getElementById(
    "editarCodigo"
  ).value =
    taxista.codigo;

  document.getElementById(
    "editarNombre"
  ).value =
    taxista.nombre;

  document.getElementById(
    "editarPlaca"
  ).value =
    taxista.placa;

  document.getElementById(
    "editarVehiculo"
  ).value =
    taxista.vehiculo;

  document.getElementById(
    "editarTelefono"
  ).value =
    taxista.telefono || "";

  mensajeEdicion.innerHTML =
    "";

  overlayEditar.classList.add(
    "active"
  );
}


function cerrarModalEdicion() {

  overlayEditar.classList.remove(
    "active"
  );

  mensajeEdicion.innerHTML =
    "";
}


cerrarEdicion.addEventListener(
  "click",
  cerrarModalEdicion
);


overlayEditar.addEventListener(
  "click",
  event => {

    if (
      event.target === overlayEditar
    ) {
      cerrarModalEdicion();
    }

  }
);


formEditarTaxista.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const id =
      document.getElementById(
        "editarId"
      ).value;

    const boton =
      document.getElementById(
        "guardarEdicion"
      );

    boton.disabled = true;

    boton.textContent =
      "GUARDANDO...";


    try {

      const response =
        await fetch(
          `/api/taxistas/${id}`,
          {
            method:"PATCH",

            headers:{
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({

                nombre:
                  document
                    .getElementById(
                      "editarNombre"
                    )
                    .value
                    .trim(),

                placa:
                  document
                    .getElementById(
                      "editarPlaca"
                    )
                    .value
                    .trim(),

                vehiculo:
                  document
                    .getElementById(
                      "editarVehiculo"
                    )
                    .value
                    .trim(),

                telefono:
                  document
                    .getElementById(
                      "editarTelefono"
                    )
                    .value
                    .trim()

              })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        mensajeEdicion.innerHTML =
          `<div class="error">
             ${data.message}
           </div>`;

        return;
      }


      mensajeEdicion.innerHTML =
        `<div class="success">
           ✓ Cambios guardados
         </div>`;


      await cargarTaxistas();


      setTimeout(
        cerrarModalEdicion,
        700
      );


    } catch (error) {

      console.error(error);

      mensajeEdicion.innerHTML =
        `<div class="error">
           Error de conexión
         </div>`;

    } finally {

      boton.disabled = false;

      boton.textContent =
        "GUARDAR CAMBIOS";

    }

  }
);


async function cambiarEstadoTaxista(
  id,
  nuevoEstado
) {

  try {

    const response =
      await fetch(
        `/api/taxistas/${id}`,
        {
          method:"PATCH",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              activo:nuevoEstado
            })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.message ||
        "No se pudo cambiar el estado"
      );

      return;
    }


    await cargarTaxistas();


  } catch (error) {

    console.error(error);

    alert(
      "Error de conexión"
    );
  }
}

setInterval(
  () => {

    if (
      panelCarreras.classList.contains(
        "active"
      )
    ) {
      cargarCarreras();
    }

  },
  10000
);