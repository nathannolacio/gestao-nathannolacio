import { Fragment } from "react";

// Converte *trecho* em destaque. "title": cor de destaque (--accent, definida
// pelo tom da seção); "body": negrito.
export function Rich({
  text,
  as = "body",
}: {
  text: string;
  as?: "title" | "body";
}) {
  const cls = as === "title" ? "text-(--accent)" : "font-semibold text-(--strong)";
  return (
    <>
      {text.split("*").map((part, i) => (
        <Fragment key={i}>
          {i % 2 === 1 ? <span className={cls}>{part}</span> : part}
        </Fragment>
      ))}
    </>
  );
}
