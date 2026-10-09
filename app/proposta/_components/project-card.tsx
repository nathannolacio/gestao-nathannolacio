type Project = { name: string; description: string; url?: string };

// Card grande de portfólio: a imagem ocupa tudo; o texto aparece sobre ela.
// TODO: trocar o placeholder pela imagem real do projeto.
export function ProjectCard({ project }: { project: Project }) {
  const body = (
    <>
      <div className="absolute inset-0 bg-linear-to-br from-white/10 to-white/5 transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-grafite via-grafite/70 to-transparent p-6 pt-24">
        <h3 className="font-display text-xl">{project.name}</h3>
        <div className="grid grid-rows-[1fr] transition-all duration-300 lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <p className="mt-1 text-sm text-marfim/70">{project.description}</p>
            {project.url && (
              <span className="mt-3 inline-block text-sm font-medium text-dourado">
                Ver projeto →
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const cls =
    "group relative block aspect-4/3 overflow-hidden rounded-3xl border border-(--line) bg-(--card)";

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
