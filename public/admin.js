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


function normalizarTelefonoWhatsapp(
  telefono
) {
  const limpio =
    String(
      telefono || ""
    ).replace(/\D/g, "");


  if (!limpio) {
    return "";
  }


  if (
    limpio.startsWith("593")
  ) {
    return limpio;
  }


  if (
    limpio.startsWith("0")
  ) {
    return (
      "593" +
      limpio.substring(1)
    );
  }


  return limpio;
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


    const carreras =
      Array.isArray(
        data.carreras
      )
        ? data.carreras
        : [];


    /*
      ========================================
      RESUMEN RAPICUPON
      ========================================

      Limite tecnico: 55.

      50 son para campaña.
      5 quedan disponibles para pruebas.

      CANCELADA no consume cupo.
    */

    const usadosCupon =
      carreras.filter(
        carrera =>
          carrera.cuponCodigo ===
          "RAPICUPON" &&
          carrera.estado ===
          "COMPLETADA"
      ).length;


    const reservadosCupon =
      carreras.filter(
        carrera =>
          carrera.cuponCodigo ===
          "RAPICUPON" &&
          carrera.estado !==
          "COMPLETADA" &&
          carrera.estado !==
          "CANCELADA"
      ).length;


    const disponiblesCupon =
      Math.max(
        0,
        55 -
        usadosCupon -
        reservadosCupon
      );


    const resumenCupon =
      document.getElementById(
        "resumenCupon"
      );


    if (resumenCupon) {

      resumenCupon.innerHTML =
        `🎟️ <strong>RAPICUPON</strong>` +
        ` · Usados: ${usadosCupon}` +
        ` · Reservados: ${reservadosCupon}` +
        ` · Disponibles técnicos: ${disponiblesCupon}/55` +
        ` · 5 cupos previstos para pruebas`;

    }


    if (
      carreras.length === 0
    ) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="10"
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
      of carreras
    ) {

      const taxista =
        carrera.taxista;


      const cliente =
        carrera.cliente;


      const fila =
        document.createElement(
          "tr"
        );


      const puedeCancelar =
        carrera.estado !==
        "COMPLETADA" &&
        carrera.estado !==
        "CANCELADA";


      const botonCancelar =
        puedeCancelar
          ? `
            <button
              class="btn btn-desactivar btn-cancelar-carrera"
              data-id="${escaparHtml(
                carrera.id
              )}"
              data-numero="${escaparHtml(
                carrera.numero
              )}"
              type="button"
            >
              Cancelar
            </button>
          `
          : "";


      /*
        ========================================
        RAPICUPON DE ESTA CARRERA
        ========================================
      */

      const tieneCupon =
        carrera.cuponCodigo ===
        "RAPICUPON";


      const telefonoTaxista =
        normalizarTelefonoWhatsapp(
          taxista?.telefono
        );


      const mensajeCupon =
        `DESCUENTO APLICADO CARRERA ASIGNADA #${carrera.numero} 🚨✅\n\n` +
        `El cliente recibió $0,50 de descuento.\n` +
        `Cobra solo $1,00.\n\n` +
        `Rapitaxi te acreditará $0,50 al finalizar.\n\n` +
        `Por favor, no cobres ningún valor adicional. 🚕🙏🏼`;


      const enlaceCupon =
        tieneCupon &&
        telefonoTaxista

          ? `https://wa.me/${telefonoTaxista}?text=${encodeURIComponent(
            mensajeCupon
          )}`

          : "";


      /*
        El boton CUPON aparece solamente cuando:

        1. La carrera tiene RAPICUPON.
        2. Ya existe un taxista asignado.
        3. El taxista tiene telefono registrado.
      */

      const botonCupon =
        tieneCupon &&
        taxista &&
        telefonoTaxista

          ? `
            <a
              href="${escaparHtml(
                enlaceCupon
              )}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display:inline-block;
                text-decoration:none;
                background:#d79b00;
                color:white;
                padding:8px 11px;
                border-radius:8px;
                font-size:12px;
                font-weight:bold;
              "
            >
              🎟️ CUPÓN
            </a>
          `

          : "";


      const alertaCupon =
        tieneCupon

          ? `
            <div
              style="
                margin-top:7px;
                padding:7px 9px;
                border-radius:8px;
                background:#fff0cc;
                color:#8c5d00;
                border:1px solid #e4bd58;
                font-size:11px;
                font-weight:bold;
                white-space:nowrap;
              "
            >
              🚨 RAPICUPON<br>
              CLIENTE PAGA $1,00
            </div>
          `

          : "";


      fila.innerHTML = `

        <td>

          <strong>
            #${escaparHtml(
              carrera.numero
            )}
          </strong>

          ${alertaCupon}

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
          )}

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

          ${
            tieneCupon
              ? `
                <div
                  style="
                    margin-top:5px;
                    font-weight:bold;
                    color:#199447;
                  "
                >
                  Tarifa: $1,00
                </div>
              `
              : ""
          }

        </td>


        <td>

          ${
            taxista

              ? `${escaparHtml(
                taxista.codigo
              )} - ${escaparHtml(
                taxista.nombre
              )}`

              : "-"
          }

        </td>


        <td>

          ${
            taxista

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

            data-numero="${escaparHtml(
              carrera.numero
            )}"

            data-referencia="${escaparHtml(
              carrera.referencia ||
              "-"
            )}"

            data-pago="${escaparHtml(
              carrera.formaPago ||
              "-"
            )}"
          >

            Copiar enlace

          </button>

        </td>


        <td>

          <div class="acciones">

            ${botonCupon}

            ${botonCancelar || "-"}

          </div>

        </td>

      `;


      tbody.appendChild(
        fila
      );

    }


    /*
      ========================================
      BOTONES COPIAR ENLACE
      ========================================
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


              const numero =
                boton.dataset.numero;


              const referencia =
                boton.dataset.referencia ||
                "-";


              const pago =
                boton.dataset.pago ||
                "-";


              const enlace =
                `${window.location.origin}/c/${token}`;


              const mensaje =
                `✅🚕 NUEVA CARRERA #${numero}\n\n` +
                `📌 *Referencia:* ${referencia}\n` +
                `💳 *Pago:* ${pago}\n\n` +
                `🔗 *Acéptala primero:* ${enlace}`;


              try {

                await navigator
                  .clipboard
                  .writeText(
                    mensaje
                  );


                mostrarMensaje(
                  "Mensaje de carrera copiado."
                );

              } catch (error) {

                window.prompt(
                  "Copia este mensaje:",
                  mensaje
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
          class="estado ${
            taxista.activo

              ? "estado-activo"

              : "estado-inactivo"
          }"
        >

          ${
            taxista.activo

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
            data-id="${taxista.id}"
          >
            Editar
          </button>


          <button
            type="button"
            class="btn ${
              taxista.activo

                ? "btn-desactivar"

                : "btn-activar"
            } cambiar-estado-taxista"

            data-id="${taxista.id}"
          >

            ${
              taxista.activo

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


  document
    .getElementById(
      "editarId"
    )
    .value =
    taxista.id;


  document
    .getElementById(
      "editarCodigo"
    )
    .value =
    taxista.codigo ||
    "";


  document
    .getElementById(
      "editarNombre"
    )
    .value =
    taxista.nombre ||
    "";


  document
    .getElementById(
      "editarPlaca"
    )
    .value =
    taxista.placa ||
    "";


  document
    .getElementById(
      "editarVehiculo"
    )
    .value =
    taxista.vehiculo ||
    "";


  document
    .getElementById(
      "editarColorVehiculo"
    )
    .value =
    taxista.colorVehiculo ||
    "";


  document
    .getElementById(
      "editarCooperativa"
    )
    .value =
    taxista.cooperativa ||
    "";


  document
    .getElementById(
      "editarTelefono"
    )
    .value =
    taxista.telefono ||
    "";


  document
    .getElementById(
      "editarTitularPichincha"
    )
    .value =
    taxista.titularPichincha ||
    "";


  document
    .getElementById(
      "editarCuentaPichincha"
    )
    .value =
    taxista.cuentaPichincha ||
    "";


  document
    .getElementById(
      "editarTitularGuayaquil"
    )
    .value =
    taxista.titularGuayaquil ||
    "";


  document
    .getElementById(
      "editarCuentaGuayaquil"
    )
    .value =
    taxista.cuentaGuayaquil ||
    "";


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


/*
  ========================================
  CANCELAR CARRERA DESDE ADMIN
  ========================================
*/

async function cancelarCarreraAdmin(
  carreraId,
  numeroCarrera
) {

  const confirmar =
    window.confirm(

      `¿Cancelar la carrera #${numeroCarrera}?\n\n` +

      "El cliente quedará libre para solicitar otra carrera."

    );


  if (!confirmar) {
    return;
  }


  try {

    const response =
      await fetch(

        `/api/carreras/admin/${carreraId}/cancelar`,

        {
          method:
            "POST",
        }

      );


    const data =
      await response.json();


    if (!response.ok) {

      mostrarMensaje(

        data.message ||
        "No se pudo cancelar la carrera.",

        "error"

      );


      return;

    }


    mostrarMensaje(

      `Carrera #${numeroCarrera} cancelada correctamente.`,

      "ok"

    );


    await cargarCarreras();


  } catch (error) {

    console.error(

      "Error cancelando carrera:",

      error

    );


    mostrarMensaje(

      "No se pudo conectar con el servidor.",

      "error"

    );

  }

}


/*
  Listener único para botones de cancelar.
*/

document.addEventListener(
  "click",
  async event => {

    const boton =
      event.target.closest(
        ".btn-cancelar-carrera"
      );


    if (!boton) {
      return;
    }


    const carreraId =
      Number(
        boton.dataset.id
      );


    const numeroCarrera =
      boton.dataset.numero;


    boton.disabled =
      true;


    boton.textContent =
      "Cancelando...";


    await cancelarCarreraAdmin(
      carreraId,
      numeroCarrera
    );

  }

);