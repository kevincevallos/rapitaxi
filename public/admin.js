let taxistasActuales = [];


/*
  ========================================
  ELEMENTOS GENERALES
  ========================================
*/

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

const btnNuevoTaxista =
  document.getElementById(
    "btnNuevoTaxista"
  );

const btnActualizarCarreras =
  document.getElementById(
    "btnActualizarCarreras"
  );

const mensajeGeneral =
  document.getElementById(
    "mensajeGeneral"
  );


function mostrarMensaje(
  mensaje,
  tipo = "ok"
) {
  mensajeGeneral.textContent =
    mensaje;

  mensajeGeneral.className =
    `mensaje visible ${tipo}`;


  setTimeout(() => {
    mensajeGeneral.className =
      "mensaje";
  }, 4500);
}


/*
  ========================================
  TABS
  ========================================
*/

function mostrarCarreras() {
  tabCarreras.classList.add(
    "activo"
  );

  tabTaxistas.classList.remove(
    "activo"
  );

  panelCarreras.classList.add(
    "activo"
  );

  panelTaxistas.classList.remove(
    "activo"
  );
}


function mostrarTaxistas() {
  tabTaxistas.classList.add(
    "activo"
  );

  tabCarreras.classList.remove(
    "activo"
  );

  panelTaxistas.classList.add(
    "activo"
  );

  panelCarreras.classList.remove(
    "activo"
  );


  cargarTaxistas();
}


tabCarreras.addEventListener(
  "click",
  mostrarCarreras
);


tabTaxistas.addEventListener(
  "click",
  mostrarTaxistas
);

btnActualizarCarreras.addEventListener(
  "click",
  async () => {

    btnActualizarCarreras.disabled =
      true;

    btnActualizarCarreras.textContent =
      "Actualizando...";

    try {

      await cargarCarreras();

      mostrarMensaje(
        "Tabla de carreras actualizada."
      );

    } finally {

      btnActualizarCarreras.disabled =
        false;

      btnActualizarCarreras.textContent =
        "🔄 Actualizar tabla";
    }
  }
);

/*
  ========================================
  UTILIDADES
  ========================================
*/

function escaparHtml(valor) {
  return String(
    valor ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


function formatearFecha(fecha) {
  if (!fecha) {
    return "-";
  }


  const d =
    new Date(fecha);


  return d.toLocaleString(
    "es-EC",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  );
}


function claseEstadoCarrera(
  estado
) {
  return (
    "estado-" +
    String(estado)
      .toLowerCase()
  );
}


/*
  ========================================
  CARRERAS
  ========================================
*/

async function cargarCarreras() {
  try {
    const response =
      await fetch(
        "/api/carreras/admin/listado"
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "No se pudieron cargar las carreras."
      );
    }


    const tbody =
      document.getElementById(
        "tablaCarreras"
      );


    tbody.innerHTML = "";


    if (
      !Array.isArray(
        data.carreras
      ) ||
      data.carreras.length === 0
    ) {
      tbody.innerHTML = `
        <tr>
          <td
            colspan="9"
            class="vacio"
          >
            No hay carreras registradas.
          </td>
        </tr>
      `;

      return;
    }


    for (
      const carrera
      of data.carreras
    ) {
      const taxista =
        carrera.taxista;


      const cliente =
        carrera.cliente;


      const fila =
        document.createElement(
          "tr"
        );


      fila.innerHTML = `
        <td>
          <strong>
            #${escaparHtml(
        carrera.numero
      )}
          </strong>
        </td>

        <td>
          <span
            class="estado ${claseEstadoCarrera(
        carrera.estado
      )}"
          >
            ${escaparHtml(
        carrera.estado
      )}
          </span>
        </td>

        <td>
          ${escaparHtml(
        cliente?.nombre ||
        carrera.nombreCliente ||
        "-"
      )
        }
        </td>

        <td>
          ${escaparHtml(
          carrera.referencia ||
          "-"
        )}
        </td>

        <td>
          ${escaparHtml(
          carrera.formaPago ||
          "-"
        )}
        </td>

        <td>
          ${taxista
          ? `${escaparHtml(
            taxista.codigo
          )} - ${escaparHtml(
            taxista.nombre
          )}`
          : "-"
        }
        </td>

        <td>
          ${taxista
          ? escaparHtml(
            taxista.placa
          )
          : "-"
        }
        </td>

        <td>
          ${formatearFecha(
          carrera.fechaCreacion
        )}
        </td>

        <td>
          <button
            type="button"
            class="btn btn-editar copiar-carrera"
            data-token="${escaparHtml(
          carrera.token
        )}"
          >
            Copiar enlace
          </button>
        </td>
      `;


      tbody.appendChild(
        fila
      );
    }


    /*
      BOTONES COPIAR ENLACE
    */

    document
      .querySelectorAll(
        ".copiar-carrera"
      )
      .forEach(
        (boton) => {

          boton.addEventListener(
            "click",
            async () => {

              const token =
                boton.dataset.token;


              const enlace =
                `${window.location.origin}/c/${token}`;


              try {
                await navigator
                  .clipboard
                  .writeText(
                    enlace
                  );


                mostrarMensaje(
                  "Enlace de carrera copiado."
                );

              } catch (error) {

                window.prompt(
                  "Copia este enlace:",
                  enlace
                );
              }
            }
          );
        }
      );

  } catch (error) {

    console.error(
      error
    );


    mostrarMensaje(
      "No se pudieron cargar las carreras.",
      "error"
    );
  }
}


/*
  ========================================
  TAXISTAS
  ========================================
*/

async function cargarTaxistas() {
  try {
    const response =
      await fetch(
        "/api/taxistas"
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "No se pudieron cargar los taxistas."
      );
    }


    taxistasActuales =
      Array.isArray(
        data.taxistas
      )
        ? data.taxistas
        : [];


    pintarTaxistas();

  } catch (error) {

    console.error(
      error
    );


    mostrarMensaje(
      "No se pudieron cargar los taxistas.",
      "error"
    );
  }
}


function pintarTaxistas() {
  const tbody =
    document.getElementById(
      "tablaTaxistas"
    );


  tbody.innerHTML = "";


  if (
    taxistasActuales.length === 0
  ) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="9"
          class="vacio"
        >
          No hay taxistas registrados.
        </td>
      </tr>
    `;

    return;
  }


  for (
    const taxista
    of taxistasActuales
  ) {
    const fila =
      document.createElement(
        "tr"
      );


    fila.innerHTML = `
      <td>
        <strong>
          ${escaparHtml(
      taxista.codigo
    )}
        </strong>
      </td>

      <td>
        ${escaparHtml(
      taxista.nombre
    )}
      </td>

      <td>
        ${escaparHtml(
      taxista.placa
    )}
      </td>

      <td>
        ${escaparHtml(
      taxista.vehiculo
    )}
      </td>

      <td>
        ${escaparHtml(
      taxista.colorVehiculo ||
      "-"
    )}
      </td>

      <td>
        ${escaparHtml(
      taxista.cooperativa ||
      "-"
    )}
      </td>

      <td>
        ${escaparHtml(
      taxista.telefono ||
      "-"
    )}
      </td>

      <td>
        <span
          class="estado ${taxista.activo
        ? "estado-activo"
        : "estado-inactivo"
      }"
        >
          ${taxista.activo
        ? "ACTIVO"
        : "INACTIVO"
      }
        </span>
      </td>

      <td>
        <div class="acciones">

          <button
            type="button"
            class="btn btn-editar editar-taxista"
            data-id="${taxista.id
      }"
          >
            Editar
          </button>

          <button
            type="button"
            class="btn ${taxista.activo
        ? "btn-desactivar"
        : "btn-activar"
      } cambiar-estado-taxista"
            data-id="${taxista.id
      }"
          >
            ${taxista.activo
        ? "Desactivar"
        : "Activar"
      }
          </button>

        </div>
      </td>
    `;


    tbody.appendChild(
      fila
    );
  }


  document
    .querySelectorAll(
      ".editar-taxista"
    )
    .forEach(
      (boton) => {

        boton.addEventListener(
          "click",
          () => {

            const id =
              Number(
                boton.dataset.id
              );


            abrirEditarTaxista(
              id
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      ".cambiar-estado-taxista"
    )
    .forEach(
      (boton) => {

        boton.addEventListener(
          "click",
          () => {

            const id =
              Number(
                boton.dataset.id
              );


            cambiarEstadoTaxista(
              id
            );
          }
        );
      }
    );
}


/*
  ========================================
  NUEVO TAXISTA
  ========================================
*/

const modalNuevoTaxista =
  document.getElementById(
    "modalNuevoTaxista"
  );

const formNuevoTaxista =
  document.getElementById(
    "formNuevoTaxista"
  );


function abrirNuevoTaxista() {
  formNuevoTaxista.reset();

  modalNuevoTaxista.classList.add(
    "visible"
  );
}


function cerrarNuevoTaxista() {
  modalNuevoTaxista.classList.remove(
    "visible"
  );
}


btnNuevoTaxista.addEventListener(
  "click",
  abrirNuevoTaxista
);


document
  .getElementById(
    "cancelarNuevoTaxista"
  )
  .addEventListener(
    "click",
    cerrarNuevoTaxista
  );


formNuevoTaxista.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const datos = {
      codigo:
        document
          .getElementById(
            "codigo"
          )
          .value
          .trim(),

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

      colorVehiculo:
        document
          .getElementById(
            "colorVehiculo"
          )
          .value
          .trim(),

      cooperativa:
        document
          .getElementById(
            "cooperativa"
          )
          .value
          .trim(),

      telefono:
        document
          .getElementById(
            "telefono"
          )
          .value
          .trim(),

      titularPichincha:
        document
          .getElementById(
            "titularPichincha"
          )
          .value
          .trim(),

      cuentaPichincha:
        document
          .getElementById(
            "cuentaPichincha"
          )
          .value
          .trim(),

      titularGuayaquil:
        document
          .getElementById(
            "titularGuayaquil"
          )
          .value
          .trim(),

      cuentaGuayaquil:
        document
          .getElementById(
            "cuentaGuayaquil"
          )
          .value
          .trim(),
    };


    try {
      const response =
        await fetch(
          "/api/taxistas",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                datos
              ),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "No se pudo registrar el taxista."
        );
      }


      cerrarNuevoTaxista();


      mostrarMensaje(
        "Taxista registrado correctamente."
      );


      await cargarTaxistas();

    } catch (error) {

      mostrarMensaje(
        error.message ||
        "No se pudo registrar el taxista.",
        "error"
      );
    }
  }
);


/*
  ========================================
  EDITAR TAXISTA
  ========================================
*/

const modalEditarTaxista =
  document.getElementById(
    "modalEditarTaxista"
  );

const formEditarTaxista =
  document.getElementById(
    "formEditarTaxista"
  );


function abrirEditarTaxista(
  id
) {
  const taxista =
    taxistasActuales.find(
      (item) =>
        item.id === id
    );


  if (!taxista) {
    mostrarMensaje(
      "No se encontró el taxista.",
      "error"
    );

    return;
  }


  document.getElementById(
    "editarId"
  ).value =
    taxista.id;


  document.getElementById(
    "editarCodigo"
  ).value =
    taxista.codigo || "";


  document.getElementById(
    "editarNombre"
  ).value =
    taxista.nombre || "";


  document.getElementById(
    "editarPlaca"
  ).value =
    taxista.placa || "";


  document.getElementById(
    "editarVehiculo"
  ).value =
    taxista.vehiculo || "";


  document.getElementById(
    "editarColorVehiculo"
  ).value =
    taxista.colorVehiculo || "";


  document.getElementById(
    "editarCooperativa"
  ).value =
    taxista.cooperativa || "";


  document.getElementById(
    "editarTelefono"
  ).value =
    taxista.telefono || "";


  document.getElementById(
    "editarTitularPichincha"
  ).value =
    taxista.titularPichincha || "";


  document.getElementById(
    "editarCuentaPichincha"
  ).value =
    taxista.cuentaPichincha || "";


  document.getElementById(
    "editarTitularGuayaquil"
  ).value =
    taxista.titularGuayaquil || "";


  document.getElementById(
    "editarCuentaGuayaquil"
  ).value =
    taxista.cuentaGuayaquil || "";


  modalEditarTaxista.classList.add(
    "visible"
  );
}


function cerrarEditarTaxista() {
  modalEditarTaxista.classList.remove(
    "visible"
  );
}


document
  .getElementById(
    "cancelarEditarTaxista"
  )
  .addEventListener(
    "click",
    cerrarEditarTaxista
  );


formEditarTaxista.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const id =
      Number(
        document
          .getElementById(
            "editarId"
          )
          .value
      );


    const datos = {
      codigo:
        document
          .getElementById(
            "editarCodigo"
          )
          .value
          .trim(),

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

      colorVehiculo:
        document
          .getElementById(
            "editarColorVehiculo"
          )
          .value
          .trim(),

      cooperativa:
        document
          .getElementById(
            "editarCooperativa"
          )
          .value
          .trim(),

      telefono:
        document
          .getElementById(
            "editarTelefono"
          )
          .value
          .trim(),

      titularPichincha:
        document
          .getElementById(
            "editarTitularPichincha"
          )
          .value
          .trim(),

      cuentaPichincha:
        document
          .getElementById(
            "editarCuentaPichincha"
          )
          .value
          .trim(),

      titularGuayaquil:
        document
          .getElementById(
            "editarTitularGuayaquil"
          )
          .value
          .trim(),

      cuentaGuayaquil:
        document
          .getElementById(
            "editarCuentaGuayaquil"
          )
          .value
          .trim(),
    };


    try {
      const response =
        await fetch(
          `/api/taxistas/${id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                datos
              ),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "No se pudo actualizar el taxista."
        );
      }


      cerrarEditarTaxista();


      mostrarMensaje(
        "Datos del taxista actualizados."
      );


      await cargarTaxistas();

    } catch (error) {

      mostrarMensaje(
        error.message ||
        "No se pudo actualizar el taxista.",
        "error"
      );
    }
  }
);


/*
  ========================================
  ACTIVAR / DESACTIVAR
  ========================================
*/

async function cambiarEstadoTaxista(
  id
) {
  const taxista =
    taxistasActuales.find(
      (item) =>
        item.id === id
    );


  if (!taxista) {
    return;
  }


  try {
    const response =
      await fetch(
        `/api/taxistas/${id}`,
        {
          method:
            "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              activo:
                !taxista.activo,
            }),
        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "No se pudo cambiar el estado."
      );
    }


    mostrarMensaje(
      data.taxista.activo
        ? "Taxista activado."
        : "Taxista desactivado."
    );


    await cargarTaxistas();

  } catch (error) {

    mostrarMensaje(
      error.message ||
      "No se pudo cambiar el estado.",
      "error"
    );
  }
}


/*
  ========================================
  CERRAR MODALES AL HACER CLICK FUERA
  ========================================
*/

modalNuevoTaxista.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      modalNuevoTaxista
    ) {
      cerrarNuevoTaxista();
    }
  }
);


modalEditarTaxista.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      modalEditarTaxista
    ) {
      cerrarEditarTaxista();
    }
  }
);


/*
  ========================================
  INICIO
  ========================================
*/

cargarCarreras();

cargarTaxistas();


setInterval(
  cargarCarreras,
  10000
);