let taxistasActuales = [];


/*
  ========================================
  ELEMENTOS GENERALES
  ========================================
*/

const menuAdmin =
  document.getElementById(
    "menuAdmin"
  );

const menuAdminBoton =
  document.getElementById(
    "menuAdminBoton"
  );

const menuAdminTitulo =
  document.getElementById(
    "menuAdminTitulo"
  );

const panelCarreras =
  document.getElementById(
    "panelCarreras"
  );

const panelTaxistas =
  document.getElementById(
    "panelTaxistas"
  );

const panelChats =
  document.getElementById(
    "panelChats"
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
  MENÚ / SECCIONES
  ========================================
*/

function mostrarSeccion(
  seccion
) {
  panelCarreras.classList.remove(
    "activo"
  );

  panelTaxistas.classList.remove(
    "activo"
  );

  panelChats.classList.remove(
    "activo"
  );


  document
    .querySelectorAll(
      ".menu-opcion"
    )
    .forEach(
      opcion => {
        opcion.classList.toggle(
          "activo",
          opcion.dataset.seccion ===
          seccion
        );
      }
    );


  btnNuevoTaxista.style.display =
    seccion === "taxistas"
      ? "inline-block"
      : "none";


  if (seccion === "taxistas") {
    panelTaxistas.classList.add(
      "activo"
    );

    menuAdminTitulo.textContent =
      "👤 Taxistas";

    cargarTaxistas();

  } else if (
    seccion === "chats"
  ) {
    panelChats.classList.add(
      "activo"
    );

    menuAdminTitulo.textContent =
      "💬 Chats";

    if (
      window.innerWidth <= 800 &&
      !telefonoChatActivo
    ) {
      volverAListaChats();
    }

    cargarChats();

  } else {
    panelCarreras.classList.add(
      "activo"
    );

    menuAdminTitulo.textContent =
      "🚕 Carreras";
  }


  menuAdmin.classList.remove(
    "abierto"
  );
}


menuAdminBoton.addEventListener(
  "click",
  () => {
    menuAdmin.classList.toggle(
      "abierto"
    );
  }
);


document
  .querySelectorAll(
    ".menu-opcion"
  )
  .forEach(
    opcion => {
      opcion.addEventListener(
        "click",
        () => {
          mostrarSeccion(
            opcion.dataset.seccion
          );
        }
      );
    }
  );


document.addEventListener(
  "click",
  event => {
    if (
      !menuAdmin.contains(
        event.target
      )
    ) {
      menuAdmin.classList.remove(
        "abierto"
      );
    }
  }
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
      RESUMEN CÓDIGOS ÚNICOS
      ========================================

      Limite tecnico: 55.

      50 son para campaña.
      5 quedan disponibles para pruebas.

      CANCELADA no consume cupo.
    */

    const usadosCupon =
      carreras.filter(
        carrera =>
          Boolean(
            carrera.cuponCodigo
          ) &&
          carrera.estado ===
          "COMPLETADA"
      ).length;


    const reservadosCupon =
      carreras.filter(
        carrera =>
          Boolean(
            carrera.cuponCodigo
          ) &&
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
        `🎟️ <strong>CÓDIGOS ÚNICOS</strong>` +
        ` · Usados: ${usadosCupon}` +
        ` · Reservados: ${reservadosCupon}` +
        ` · Disponibles técnicos: ${disponiblesCupon}/55` +
        ` · 50 campaña + 5 pruebas`;

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
        CUPÓN ÚNICO DE ESTA CARRERA
        ========================================
      */

      const tieneCupon =
        Boolean(
          carrera.cuponCodigo
        );


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

        1. La carrera tiene un código de cupón.
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
              🚨 CUPÓN ${escaparHtml(
            carrera.cuponCodigo
          )}<br>
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

          ${tieneCupon
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
            data-id="${taxista.id}"
          >
            Editar
          </button>


          <button
            type="button"
            class="btn ${taxista.activo

        ? "btn-desactivar"

        : "btn-activar"
      } cambiar-estado-taxista"

            data-id="${taxista.id}"
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
  CHATS WHATSAPP
  ========================================
*/

let chatsActuales = [];
let telefonoChatActivo = null;


const chatShell =
  document.getElementById(
    "chatShell"
  );

const listaChats =
  document.getElementById(
    "listaChats"
  );

const buscarChats =
  document.getElementById(
    "buscarChats"
  );

const chatsContador =
  document.getElementById(
    "chatsContador"
  );

const chatSinSeleccion =
  document.getElementById(
    "chatSinSeleccion"
  );

const chatSeleccionado =
  document.getElementById(
    "chatSeleccionado"
  );

const chatNombre =
  document.getElementById(
    "chatNombre"
  );

const chatTelefono =
  document.getElementById(
    "chatTelefono"
  );

const chatEstado =
  document.getElementById(
    "chatEstado"
  );

const chatMensajes =
  document.getElementById(
    "chatMensajes"
  );

const chatAvatar =
  document.getElementById(
    "chatAvatar"
  );

const btnVolverChats =
  document.getElementById(
    "btnVolverChats"
  );

const btnControlChat =
  document.getElementById(
    "btnControlChat"
  );

const chatModoBanner =
  document.getElementById(
    "chatModoBanner"
  );

const formEnviarChat =
  document.getElementById(
    "formEnviarChat"
  );

const mensajeChat =
  document.getElementById(
    "mensajeChat"
  );

const btnEnviarChat =
  document.getElementById(
    "btnEnviarChat"
  );


function formatearHoraChat(
  fecha
) {
  if (!fecha) {
    return "";
  }

  const d =
    new Date(fecha);

  return d.toLocaleTimeString(
    "es-EC",
    {
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  );
}


function formatearFechaListaChat(
  fecha
) {
  if (!fecha) {
    return "";
  }

  const d =
    new Date(fecha);

  const hoy =
    new Date();

  const mismoDia =
    d.getFullYear() ===
    hoy.getFullYear() &&
    d.getMonth() ===
    hoy.getMonth() &&
    d.getDate() ===
    hoy.getDate();

  if (mismoDia) {
    return formatearHoraChat(
      fecha
    );
  }

  return d.toLocaleDateString(
    "es-EC",
    {
      day: "2-digit",
      month: "2-digit",
    }
  );
}


function inicialesChat(
  nombre,
  telefono
) {
  const texto =
    String(
      nombre || ""
    ).trim();

  if (texto) {
    const partes =
      texto
        .split(/\s+/)
        .filter(Boolean);

    return (
      (partes[0]?.[0] || "") +
      (partes[1]?.[0] || "")
    )
      .toUpperCase()
      .slice(0, 2);
  }

  const limpio =
    String(
      telefono || ""
    ).replace(/\D/g, "");

  return limpio.slice(-2) || "--";
}


function actualizarModoVisualChat(
  atencionManual
) {
  const manual =
    Boolean(
      atencionManual
    );

  btnControlChat.textContent =
    manual
      ? "Devolver al bot"
      : "Tomar control";

  btnControlChat.classList.toggle(
    "manual",
    manual
  );

  chatModoBanner.classList.toggle(
    "manual",
    manual
  );

  chatModoBanner.innerHTML =
    manual
      ? `<span>👤 Atención manual activa.</span><strong>El bot no responderá.</strong>`
      : `<span>🤖 El bot está respondiendo este chat.</span><strong>Toma el control para escribir.</strong>`;

  mensajeChat.disabled =
    !manual;

  btnEnviarChat.disabled =
    !manual;

  mensajeChat.placeholder =
    manual
      ? "Escribe una respuesta..."
      : "Toma el control para escribir";
}


function volverAListaChats() {
  telefonoChatActivo = null;

  chatShell.classList.remove(
    "chat-abierto"
  );

  pintarListaChats();
}


async function cargarChats(
  conservarSeleccion = true
) {
  try {
    const response =
      await fetch(
        "/api/admin/chats"
      );

    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "No se pudieron cargar los chats."
      );
    }


    chatsActuales =
      Array.isArray(
        data.chats
      )
        ? data.chats
        : [];


    pintarListaChats();


    if (
      conservarSeleccion &&
      telefonoChatActivo
    ) {
      const sigueExistiendo =
        chatsActuales.some(
          chat =>
            chat.telefono ===
            telefonoChatActivo
        );

      if (sigueExistiendo) {
        await abrirChat(
          telefonoChatActivo,
          false
        );
      }
    }

  } catch (error) {
    console.error(
      "Error cargando chats:",
      error
    );

    listaChats.innerHTML = `
      <div class="chat-vacio">
        No se pudieron cargar las conversaciones.
      </div>
    `;
  }
}


function pintarListaChats() {
  listaChats.innerHTML =
    "";


  const filtro =
    String(
      buscarChats?.value || ""
    )
      .trim()
      .toLowerCase();


  const filtrados =
    chatsActuales.filter(
      chat => {
        if (!filtro) {
          return true;
        }

        return (
          String(
            chat.nombre || ""
          )
            .toLowerCase()
            .includes(filtro) ||
          String(
            chat.telefono || ""
          ).includes(filtro)
        );
      }
    );


  const noLeidosTotal =
    chatsActuales.reduce(
      (total, chat) =>
        total +
        Number(
          chat.noLeidos || 0
        ),
      0
    );


  chatsContador.textContent =
    String(
      noLeidosTotal > 0
        ? noLeidosTotal
        : chatsActuales.length
    );


  if (
    filtrados.length === 0
  ) {
    listaChats.innerHTML = `
      <div class="chat-vacio">
        ${filtro
        ? "No encontramos conversaciones con esa búsqueda."
        : "Todavía no hay mensajes guardados."
      }
      </div>
    `;

    return;
  }


  for (
    const chat
    of filtrados
  ) {
    const boton =
      document.createElement(
        "button"
      );

    boton.type =
      "button";

    boton.className =
      "chat-item" +
      (
        chat.telefono ===
          telefonoChatActivo
          ? " activo"
          : ""
      );


    const badge =
      Number(chat.noLeidos) > 0
        ? `
          <span class="chat-no-leidos">
            ${escaparHtml(
          chat.noLeidos
        )}
          </span>
        `
        : "";


    const iniciales =
      inicialesChat(
        chat.nombre,
        chat.telefono
      );


    boton.innerHTML = `
      <span class="chat-avatar">
        ${escaparHtml(
      iniciales
    )}
      </span>

      <span class="chat-item-contenido">
        <span class="chat-item-superior">
          <span class="chat-item-nombre">
            ${escaparHtml(
      chat.nombre ||
      chat.telefono
    )}
          </span>

          <span class="chat-item-fecha">
            ${escaparHtml(
      formatearFechaListaChat(
        chat.ultimaFecha
      )
    )}
          </span>
        </span>

        <span class="chat-item-inferior">
          <span class="chat-item-preview">
            ${chat.atencionManual
        ? "👤 "
        : "🤖 "
      }${escaparHtml(
        chat.ultimoMensaje ||
        ""
      )}
          </span>

          ${badge}
        </span>
      </span>
    `;


    boton.addEventListener(
      "click",
      () => {
        abrirChat(
          chat.telefono
        );
      }
    );


    listaChats.appendChild(
      boton
    );
  }
}

async function abrirChat(
  telefono,
  actualizarLista = true
) {
  telefonoChatActivo =
    telefono;

  pintarListaChats();


  try {
    const response =
      await fetch(
        `/api/admin/chats/${encodeURIComponent(
          telefono
        )}`
      );

    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "No se pudo cargar la conversación."
      );
    }


    const chat =
      data.chat;


    chatSinSeleccion.style.display =
      "none";

    chatSeleccionado.style.display =
      "flex";

    chatShell.classList.add(
      "chat-abierto"
    );


    chatNombre.textContent =
      chat.nombre ||
      chat.telefono;

    chatTelefono.textContent =
      `+${chat.telefono}`;

    chatEstado.textContent =
      chat.atencionManual
        ? "Atención manual"
        : `Bot activo · ${chat.estadoBot}`;

    chatAvatar.textContent =
      inicialesChat(
        chat.nombre,
        chat.telefono
      );

    actualizarModoVisualChat(
      chat.atencionManual
    );


    pintarMensajesChat(
      chat.mensajes ||
      []
    );


    if (actualizarLista) {
      const item =
        chatsActuales.find(
          actual =>
            actual.telefono ===
            telefono
        );

      if (item) {
        item.noLeidos = 0;
      }

      pintarListaChats();
    }

  } catch (error) {
    console.error(
      "Error abriendo chat:",
      error
    );

    mostrarMensaje(
      "No se pudo abrir la conversación.",
      "error"
    );
  }
}


function pintarMensajesChat(
  mensajes
) {
  chatMensajes.innerHTML =
    "";


  if (
    mensajes.length === 0
  ) {
    chatMensajes.innerHTML = `
      <div class="chat-vacio">
        No hay mensajes en esta conversación.
      </div>
    `;

    return;
  }


  for (
    const mensaje
    of mensajes
  ) {
    const burbuja =
      document.createElement(
        "div"
      );

    const saliente =
      mensaje.direccion ===
      "SALIENTE";


    burbuja.className =
      `burbuja ${saliente
        ? "saliente"
        : "entrante"
      }`;


    burbuja.innerHTML = `
      <div>
        ${escaparHtml(
      mensaje.contenido ||
      `[${mensaje.tipo}]`
    )}
      </div>

      <span class="burbuja-hora">
        ${escaparHtml(
      formatearHoraChat(
        mensaje.fechaCreacion
      )
    )}
      </span>
    `;


    chatMensajes.appendChild(
      burbuja
    );
  }


  chatMensajes.scrollTop =
    chatMensajes.scrollHeight;
}


formEnviarChat.addEventListener(
  "submit",
  async event => {
    event.preventDefault();


    if (!telefonoChatActivo) {
      return;
    }


    const mensaje =
      mensajeChat.value.trim();


    if (!mensaje) {
      return;
    }


    btnEnviarChat.disabled =
      true;

    btnEnviarChat.textContent =
      "…";


    try {
      const response =
        await fetch(
          `/api/admin/chats/${encodeURIComponent(
            telefonoChatActivo
          )}/mensaje`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                mensaje,
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
          "No se pudo enviar el mensaje."
        );
      }


      mensajeChat.value =
        "";


      await abrirChat(
        telefonoChatActivo
      );

      await cargarChats(
        false
      );


    } catch (error) {
      mostrarMensaje(
        error.message ||
        "No se pudo enviar el mensaje.",
        "error"
      );

    } finally {
      btnEnviarChat.disabled =
        false;

      btnEnviarChat.textContent =
        "➤";
    }
  }
);


btnControlChat.addEventListener(
  "click",
  async () => {
    if (!telefonoChatActivo) {
      return;
    }


    const chatActual =
      chatsActuales.find(
        chat =>
          chat.telefono ===
          telefonoChatActivo
      );


    const activo =
      !Boolean(
        chatActual?.atencionManual
      );


    btnControlChat.disabled =
      true;


    try {
      const response =
        await fetch(
          `/api/admin/chats/${encodeURIComponent(
            telefonoChatActivo
          )}/manual`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                activo,
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
          "No se pudo cambiar el modo."
        );
      }


      if (chatActual) {
        chatActual.atencionManual =
          activo;
      }


      actualizarModoVisualChat(
        activo
      );

      chatEstado.textContent =
        activo
          ? "Atención manual"
          : "Bot activo";


      mostrarMensaje(
        activo
          ? "Atención manual activada. El bot no responderá a este cliente."
          : "Bot automático reactivado para este cliente."
      );


      pintarListaChats();


      if (activo) {
        setTimeout(
          () => {
            mensajeChat.focus();
          },
          50
        );
      }

    } catch (error) {
      mostrarMensaje(
        error.message ||
        "No se pudo cambiar el modo de atención.",
        "error"
      );

    } finally {
      btnControlChat.disabled =
        false;
    }
  }
);


btnVolverChats.addEventListener(
  "click",
  volverAListaChats
);


buscarChats.addEventListener(
  "input",
  pintarListaChats
);

mensajeChat.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      formEnviarChat
        .requestSubmit();
    }
  }
);


setInterval(
  () => {
    if (
      panelChats.classList.contains(
        "activo"
      )
    ) {
      cargarChats();
    }
  },
  5000
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