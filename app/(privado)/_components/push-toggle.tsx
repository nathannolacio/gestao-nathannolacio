"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/(privado)/notificacoes/actions";
import { BellIcon } from "./icons";

type Status = "checking" | "unsupported" | "denied" | "off" | "on" | "busy";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// A chave VAPID pública vem em base64url; o subscribe() quer bytes.
function keyToBytes(base64Url: string) {
  const padded = base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// Botão do menu que liga as notificações push neste aparelho.
export function PushToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  // Ao abrir, descobre o estado atual (suporte, permissão e se já há inscrição).
  useEffect(() => {
    let cancelled = false;
    async function check() {
      let next: Status;
      if (!pushSupported()) {
        next = "unsupported";
      } else if (Notification.permission === "denied") {
        next = "denied";
      } else {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        const subscription = await registration?.pushManager.getSubscription();
        next = subscription && Notification.permission === "granted" ? "on" : "off";
      }
      if (!cancelled) setStatus(next);
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setError(null);
    if (!PUBLIC_KEY) {
      setError("Chave de notificação não configurada.");
      return;
    }
    setStatus("busy");
    try {
      // A permissão só pode ser pedida dentro de um clique (exigência do iOS).
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(PUBLIC_KEY),
        }));

      const result = await savePushSubscription(subscription.toJSON());
      if (!result.ok) {
        await subscription.unsubscribe();
        setError(result.error);
        setStatus("off");
        return;
      }
      setStatus("on");
    } catch {
      setError("Não foi possível ativar as notificações.");
      setStatus("off");
    }
  }

  const base =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";

  if (status === "on") {
    return (
      <div className={`${base} text-admin-muted`}>
        <BellIcon />
        Notificações ativas
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="px-3 py-2 text-xs leading-relaxed text-admin-muted">
        Notificações indisponíveis aqui. No iPhone, abra o menu de compartilhar do Safari, toque em
        “Adicionar à Tela de Início” e abra o sistema pelo ícone.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="px-3 py-2 text-xs leading-relaxed text-admin-muted">
        Notificações bloqueadas neste aparelho. Libere nos Ajustes do iPhone, em Notificações.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={enable}
        disabled={status !== "off"}
        className={`${base} cursor-pointer text-admin-muted hover:bg-admin-raised hover:text-admin-text disabled:cursor-wait disabled:opacity-60`}
      >
        <BellIcon />
        {status === "busy" ? "Ativando..." : "Ativar notificações"}
      </button>
      {error && (
        <p role="alert" className="px-3 pt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
