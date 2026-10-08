interface Repository {
  name: string;
  language: string;
  status: "Indexed" | "Indexing...";
}

const repositories: Repository[] = [
  {
    name: "project-a",
    language: "React/TS",
    status: "Indexed",
  },
  {
    name: "project-b",
    language: "Python",
    status: "Indexing...",
  },
  {
    name: "project-c",
    language: "Node",
    status: "Indexed",
  },
];

const RecentRepositories = () => {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-medium text-white">
          Recent Repositories
        </h2>

        <p className="mt-1 text-sm text-zinc-600">
          Your recently connected codebases
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        {/* Table Header */}
        <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.02] px-5 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
            Repository
          </span>

          <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
            Language
          </span>

          <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
            Status
          </span>
        </div>

        {/* Repository Rows */}
        {repositories.map((repo) => (
          <div
            key={repo.name}
            className="
              grid
              grid-cols-3
              items-center
              border-b
              border-white/5
              px-5
              py-4
              transition
              duration-200
              last:border-b-0
              hover:bg-white/[0.03]
            "
          >
            {/* Repository */}
            <div className="flex items-center gap-3">
              <div className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                bg-white/5
                text-xs
                text-zinc-400
              ">
                ◈
              </div>

              <span className="text-sm font-medium text-zinc-200">
                {repo.name}
              </span>
            </div>

            {/* Language */}
            <span className="text-sm text-zinc-500">
              {repo.language}
            </span>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span
                className={`
                  h-1.5
                  w-1.5
                  rounded-full
                  ${
                    repo.status === "Indexed"
                      ? "bg-green-500"
                      : "animate-pulse bg-yellow-500"
                  }
                `}
              />

              <span
                className={`
                  text-sm
                  ${
                    repo.status === "Indexed"
                      ? "text-zinc-400"
                      : "text-yellow-500"
                  }
                `}
              >
                {repo.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentRepositories;