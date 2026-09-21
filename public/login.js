const formLogin =
  document.getElementById(
    "formLogin"
  );

const btnEntrar =
  document.getElementById(
    "btnEntrar"
  );

const mensajeLogin =
  document.getElementById(
    "mensajeLogin"
  );


function mostrarMensajeLogin(
  texto,
  tipo = "error"
) {
  mensajeLogin.textContent =
    texto;

  mensajeLogin.className =
    `mensaje visible ${tipo}`;
}


async function comprobarSesion() {
  try {
    const response =
      await fetch(
        "/api/admin/auth/me"
      );

    if (response.ok) {
      window.location.replace(
        "/admin.html"
      );
    }
  } catch {
    // El formulario seguirá disponible.
  }
}


formLogin.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    btnEntrar.disabled =
      true;

    btnEntrar.textContent =
      "Verificando...";

    mensajeLogin.className =
      "mensaje";

    try {
      const response =
        await fetch(
          "/api/admin/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              usuario:
                document
                  .getElementById(
                    "usuario"
                  )
                  .value
                  .trim(),
              password:
                document
                  .getElementById(
                    "password"
                  )
                  .value,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        mostrarMensajeLogin(
          data.message ||
          "No se pudo iniciar sesión."
        );
        return;
      }

      mostrarMensajeLogin(
        "Acceso correcto.",
        "ok"
      );

      window.location.replace(
        "/admin.html"
      );

    } catch (error) {
      console.error(error);
      mostrarMensajeLogin(
        "No se pudo conectar con el servidor."
      );

    } finally {
      btnEntrar.disabled =
        false;

      btnEntrar.textContent =
        "Entrar al panel";
    }
  }
);


comprobarSesion();
