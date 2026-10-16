import Image from "next/image";

type Project = {
  name: string; // só para o texto alternativo da imagem; não aparece na página
  description: string;
  image?: string;
  video?: string;
};

// Card de portfólio: a gravação do site rolando em cima (a capa aparece enquanto o vídeo carrega);
// só a descrição embaixo, sem nome e sem link.
export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-(--line) bg-(--card)">
      <div className="relative aspect-16/10 overflow-hidden">
        {project.image ? (
          <Image
            src={project.image}
            alt={`Primeira tela do site ${project.name}`}
            fill
            sizes="(min-width: 1152px) 552px, (min-width: 640px) 45vw, 100vw"
            className="object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-dourado/25 to-bronze/35" />
        )}
        {project.video && (
          <video
            src={project.video}
            poster={project.image}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            className="absolute inset-0 size-full object-cover object-top"
          />
        )}
      </div>
      <p className="p-6 text-base leading-7 text-(--mute)">{project.description}</p>
    </div>
  );
}
