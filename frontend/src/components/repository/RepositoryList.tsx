
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getRepositories,
  type Repository,
} from "../../services/repositoryApi";

interface RepositoryListProps {
  searchQuery: string;
}

const formatDate = (date?: string): string => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const RepositoryList = ({ searchQuery }: RepositoryListProps) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchRepositories = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRepositories();

        if (!cancelled) {
          setRepositories(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load repositories"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRepositories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Search the repositories returned by the backend.
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

      {/* Repository List */}
      <div className="max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-500">
              Loading repositories...
            </p>
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-red-400">{error}</p>

            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-zinc-300 underline"
            >
              Try again
            </button>
          </div>
        ) : filteredRepositories.length > 0 ? (
          filteredRepositories.map((repo) => (
            <Link
              key={repo._id}
              to={`/repositories/${repo._id}`}
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
              {/* Repository name */}
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

                <span className="break-all text-sm font-medium text-zinc-200">
                  {repo.name}
                </span>
              </div>

              {/* Language stored in MongoDB */}
              <span className="text-sm text-zinc-500">
                {repo.language || "Unknown"}
              </span>

              {/* A saved repository is connected.
                  This does not mean its code has been indexed. */}
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                <span className="text-sm text-zinc-400">
                  Connected
                </span>
              </div>

              {/* Use the stored update date when available */}
              <span className="text-sm text-zinc-600">
                {formatDate(repo.updatedAt || repo.createdAt)}
              </span>
            </Link>
          ))
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-500">
              {repositories.length === 0
                ? "You haven't connected any repositories yet."
                : "No repositories found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryList;
