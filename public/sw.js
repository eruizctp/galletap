// Service worker de Galletapp: muestra avisos y abre el partido al tocarlos.
self.addEventListener("push", (event) => {
  const datos = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(datos.titulo || "Galletapp", {
      body: datos.cuerpo || "",
      icon: "/icono.svg",
      badge: "/icono.svg",
      tag: datos.clave,
      data: { url: datos.url || "/partidos" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/partidos";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ("focus" in v) {
          v.navigate(url);
          return v.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
