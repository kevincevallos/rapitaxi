const VERSION =
  "rapitaxi-taxista-push-1.0.0";

self.addEventListener(
  "install",
  () => {
    self.skipWaiting();
  }
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      self.clients.claim()
    );
  }
);


self.addEventListener(
  "push",
  (event) => {

    let data = {};

    try {
      data =
        event.data
          ? event.data.json()
          : {};
    } catch {
      data = {
        title:
          "🚕 Nueva carrera",
        body:
          event.data?.text() ||
          "Hay una nueva solicitud.",
      };
    }


    const title =
      data.title ||
      "🚕 Nueva carrera";


    const options = {

      body:
        data.body ||
        "Hay una nueva solicitud disponible.",

      icon:
        "/taxista/icon-192.png",

      badge:
        "/taxista/icon-192.png",

      tag:
        data?.data?.numero
          ? `rapitaxi-carrera-${data.data.numero}`
          : "rapitaxi-carrera",

      renotify:
        true,

      data: {
        url:
          data?.data?.url ||
          "/taxista/",

        tipo:
          data?.data?.tipo ||
          "NUEVA_CARRERA",

        numero:
          data?.data?.numero ||
          null,

        token:
          data?.data?.token ||
          null,
      },
    };


    event.waitUntil(
      self.registration
        .showNotification(
          title,
          options
        )
    );

  }
);


self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();


    const url =
      event.notification
        ?.data
        ?.url ||
      "/taxista/";


    event.waitUntil(
      self.clients
        .matchAll({
          type:
            "window",

          includeUncontrolled:
            true,
        })
        .then(
          async (
            clientes
          ) => {

            for (
              const cliente
              of clientes
            ) {

              if (
                "focus" in cliente
              ) {

                await cliente.focus();

                if (
                  "navigate" in cliente
                ) {
                  await cliente.navigate(
                    url
                  );
                }

                return;
              }

            }


            if (
              self.clients
                .openWindow
            ) {

              return self.clients
                .openWindow(
                  url
                );

            }

          }
        )
    );

  }
);