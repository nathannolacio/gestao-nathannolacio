// Card flutuante da capa com a marca do cliente. Sem logo (clients.logo_url nulo),
// mostra as iniciais.
export function ClientCard({
  clientName,
  logoUrl,
}: {
  clientName: string;
  logoUrl: string | null;
}) {
  const initials = clientName
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="animate-card-in relative w-full max-w-sm">
      {/* halo dourado atrás do card */}
      <div
        aria-hidden
        className="animate-glow-pulse absolute -inset-2 rounded-[3rem] bg-linear-to-br from-dourado to-bronze blur-2xl lg:-inset-6 lg:blur-3xl"
      />
      <div className="animate-float relative">
        {/* camadas atrás, para dar profundidade */}
        <div
          aria-hidden
          className="absolute inset-0 translate-x-3 translate-y-4 rotate-3 rounded-3xl bg-grafite/10"
        />
        <div
          aria-hidden
          className="absolute inset-0 -translate-x-2 translate-y-2 -rotate-2 rounded-3xl bg-dourado/30"
        />
        <div className="relative rounded-3xl border border-white bg-linear-to-b from-white to-marfim p-6 shadow-[0_30px_60px_-15px_rgb(22_22_28/0.35),0_10px_20px_-10px_rgb(124_90_52/0.35)]">
          <p className="mb-4 text-xs uppercase tracking-widest text-cinza">
            Preparada para
          </p>
          {logoUrl ? (
            // Com logo: a imagem PREENCHE a moldura 4:3 (object-cover, cantos arredondados).
            // Se a proporção da imagem for outra, as bordas são cortadas; por isso o ideal
            // é enviar a logo já em 4:3 (ex.: 800 × 600 px).
            <div className="aspect-4/3 overflow-hidden rounded-2xl border border-dashed border-dourado/60 bg-marfim p-2">
              {/* <img> simples: a URL já é de CDN (Vercel Blob). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`Logo de ${clientName}`}
                className="size-full rounded-xl object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-4/3 items-center justify-center rounded-2xl border border-dashed border-dourado/60 bg-marfim">
              <span className="font-display text-6xl font-bold text-bronze">
                {initials}
              </span>
            </div>
          )}
          <p className="mt-5 text-center font-display text-lg">{clientName}</p>
        </div>
      </div>
    </div>
  );
}
