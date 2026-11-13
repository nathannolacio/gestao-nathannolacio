// Service worker: recebe o push e mostra a notificação, mesmo com o app fechado.
// Roda fora da página (sem acesso ao React/DOM). Fica em public/ para ser servido em /sw.js.
// Também guarda uma página "sem conexão" para o app instalado não abrir a tela de erro do navegador.
// Não guarda as telas do sistema em cache: os dados são privados e precisam vir sempre atualizados.

const CACHE = "gestao-offline-v1";
const OFFLINE_URL = "/offline.html";
const OFFLINE_ASSETS = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Só navegação (abrir uma tela). Com rede: segue normal. Sem rede: mostra a página offline.
// O ícone usado na página offline também sai do cache quando não há rede.
self.addEventListener("fetch", (event) => {
  const { pathname } = new URL(event.request.url);
  if (event.request.mode !== "navigate") {
    if (OFFLINE_ASSETS.includes(pathname)) {
      event.respondWith(fetch(event.request).catch(async () => (await caches.match(pathname)) || Response.error()));
    }
    return;
  }
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(OFFLINE_URL);
      return cached || Response.error();
    }),
  );
});

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
    data: { url: data.url || "/hoje" },
  };

  // O iOS exige mostrar uma notificação a cada push (userVisibleOnly):
  // por isso o showNotification sempre roda, mesmo com payload vazio.
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Só caminho interno (anti open redirect): "/algo", nunca "//host" nem URL externa.
  const raw = event.notification.data && event.notification.data.url;
  const path = typeof raw === "string" && /^\/(?![/\\])/.test(raw) ? raw : "/hoje";
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
