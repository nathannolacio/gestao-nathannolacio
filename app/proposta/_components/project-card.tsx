import Image from "next/image";

type Project = {
  name: string;
  description: string;
  url?: string;
  image?: string;
};

// Card grande de portfólio: a captura do hero ocupa tudo; o texto aparece sobre ela.
export function ProjectCard({ project }: { project: Project }) {
  const body = (
    <>
      {project.image ? (
        <Image
          src={project.image}
          alt={`Primeira tela do site ${project.name}`}
          fill
          sizes="(min-width: 1152px) 552px, (min-width: 640px) 45vw, 100vw"
          className="object-cover object-top transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-dourado/25 to-bronze/35 transition duration-500 group-hover:scale-105" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-grafite/90 via-grafite/55 to-transparent p-6 pt-24 text-marfim">
        <h3 className="font-display text-2xl">{project.name}</h3>
        <div className="grid grid-rows-[1fr] transition-all duration-300 lg:grid-rows-[0fr] lg:group-focus-visible:grid-rows-[1fr] lg:group-hover:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <p className="mt-1 text-base text-marfim/80">{project.description}</p>
            {project.url && (
              <span className="mt-3 inline-block text-base font-medium text-dourado">
                Ver projeto →
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const cls =
    "group relative block aspect-16/10 overflow-hidden rounded-3xl border border-(--line) bg-(--card)";

  return project.url ? (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
    >
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}
