// Service worker: recebe o push e mostra a notificação, mesmo com o app fechado.
// Roda fora da página (sem acesso ao React/DOM). Fica em public/ para ser servido em /sw.js.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // payload que não é JSON: cai no texto padrão abaixo
  }

  const title = data.title || "Gestão";
  const options = {
    body: data.body || "Você tem uma novidade.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/propostas" },
  };

  // O iOS exige mostrar uma notificação a cada push (userVisibleOnly):
  // por isso o showNotification sempre roda, mesmo com payload vazio.
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Só caminho interno (anti open redirect): "/algo", nunca "//host" nem URL externa.
  const raw = event.notification.data && event.notification.data.url;
  const path = typeof raw === "string" && /^\/(?![/\\])/.test(raw) ? raw : "/propostas";
  const target = new URL(path, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Reaproveita uma janela do app já aberta; senão abre uma nova.
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
