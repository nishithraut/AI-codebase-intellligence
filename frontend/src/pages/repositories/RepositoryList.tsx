import { Link } from "react-router-dom";

export interface Repository {
  id: string;
  name: string;
  language: string;
  status: "Indexed" | "Indexing";
  updated: string;
}

const repositories: Repository[] = [
  {
    id: "1",
    name: "my-project",
    language: "TypeScript",
    status: "Indexed",
    updated: "Today",
  },
  {
    id: "2",
    name: "backend-api",
    language: "Python",
    status: "Indexing",
    updated: "Yesterday",
  },
  {
    id: "3",
    name: "frontend",
    language: "React",
    status: "Indexed",
    updated: "Sep 25",
  },
  {
    id: "4",
    name: "auth-service",
    language: "Node.js",
    status: "Indexed",
    updated: "Sep 24",
  },
  {
    id: "5",
    name: "payment-service",
    language: "Java",
    status: "Indexed",
    updated: "Sep 23",
  },
  {
    id: "6",
    name: "ml-pipeline",
    language: "Python",
    status: "Indexing",
    updated: "Sep 22",
  },
  {
    id: "7",
    name: "mobile-app",
    language: "React Native",
    status: "Indexed",
    updated: "Sep 20",
  },
  {
    id: "8",
    name: "notification-service",
    language: "Go",
    status: "Indexed",
    updated: "Sep 18",
  },
  {
    id: "9",
    name: "analytics-engine",
    language: "Rust",
    status: "Indexed",
    updated: "Sep 15",
  },
  {
    id: "10",
    name: "devops-config",
    language: "Docker",
    status: "Indexed",
    updated: "Sep 12",
  },
];

interface RepositoryListProps {
  searchQuery: string;
}

const RepositoryList = ({ searchQuery }: RepositoryListProps) => {
  const filteredRepositories = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">

      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] border-b border-white/10 bg-white/[0.02] px-5 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          Repository
        </span>

        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          Language
        </span>

        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          Status
        </span>

        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          Updated
        </span>
      </div>

      {/* Scrollable Repository List */}
      <div className="max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
        {filteredRepositories.length > 0 ? (
          filteredRepositories.map((repo) => (
            <Link
              key={repo.id}
              to={`/repositories/${repo.id}`}
              className="
                grid
                grid-cols-[2fr_1.5fr_1fr_1fr]
                items-center
                border-b
                border-white/5
                px-5
                py-4
                transition-all
                duration-200
                last:border-b-0
                hover:bg-white/[0.04]
              "
            >
              {/* Repository */}
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-white/5
                    text-xs
                    text-zinc-400
                  "
                >
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

              {/* Updated */}
              <span className="text-sm text-zinc-600">
                {repo.updated}
              </span>
            </Link>
          ))
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-500">
              No repositories found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryList;
