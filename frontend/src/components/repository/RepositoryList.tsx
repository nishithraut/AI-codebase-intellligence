
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getRepositories,
  getRepositoryIndexStatus,
  type Repository,
  type RepositoryIndexStatus,
} from "../../services/repositoryApi";

interface RepositoryListProps {
  searchQuery: string;
  refreshKey?: number;
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

const statusDetails: Record<
  RepositoryIndexStatus,
  { label: string; className: string; dotClassName: string }
> = {
  not_indexed: {
    label: "Not indexed",
    className: "border-zinc-700 bg-zinc-800/60 text-zinc-300",
    dotClassName: "bg-zinc-500",
  },
  indexing: {
    label: "Indexing",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    dotClassName: "animate-pulse bg-amber-400",
  },
  completed: {
    label: "Completed",
    className: "border-green-500/20 bg-green-500/10 text-green-400",
    dotClassName: "bg-green-400",
  },
  failed: {
    label: "Failed",
    className: "border-red-500/20 bg-red-500/10 text-red-400",
    dotClassName: "bg-red-400",
  },
  unknown: {
    label: "Unknown",
    className: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
    dotClassName: "bg-zinc-500",
  },
};

const RepositoryList = ({
  searchQuery,
  refreshKey = 0,
}: RepositoryListProps) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [statuses, setStatuses] = useState<
    Record<string, RepositoryIndexStatus>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    const fetchRepositoriesAndStatuses = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getRepositories();

        if (cancelled) return;

        setRepositories(data);

        const statusEntries = await Promise.all(
          data.map(async (repository) => {
            try {
              const status = await getRepositoryIndexStatus(
                repository._id
              );

              return [repository._id, status] as const;
            } catch {
              return [repository._id, "unknown"] as const;
            }
          })
        );

        if (cancelled) return;

        const nextStatuses = Object.fromEntries(statusEntries) as Record<
          string,
          RepositoryIndexStatus
        >;

        setStatuses(nextStatuses);

        const allFinished = data.every((repository) => {
          const status = nextStatuses[repository._id];
          return status === "completed" || status === "failed";
        });

        if (allFinished || data.length === 0) return;

        // Keep checking for indexing to start, but don't poll indefinitely.
        const stopAt = Date.now() + 120_000;

        intervalId = window.setInterval(async () => {
          if (cancelled) return;

          if (Date.now() >= stopAt) {
            if (intervalId !== undefined) {
              window.clearInterval(intervalId);
            }
            return;
          }

          const entries = await Promise.all(
            data.map(async (repository) => {
              try {
                const status = await getRepositoryIndexStatus(
                  repository._id
                );

                return [repository._id, status] as const;
              } catch {
                return [
                  repository._id,
                  "unknown",
                ] as const;
              }
            })
          );

          if (cancelled) return;

          const updatedStatuses = Object.fromEntries(entries) as Record<
            string,
            RepositoryIndexStatus
          >;

          setStatuses(updatedStatuses);

          const finished = data.every((repository) => {
            const status = updatedStatuses[repository._id];
            return status === "completed" || status === "failed";
          });

          if (finished && intervalId !== undefined) {
            window.clearInterval(intervalId);
          }
        }, 3000);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load repositories."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchRepositoriesAndStatuses();

    return () => {
      cancelled = true;

      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [refreshKey]);

  const filteredRepositories = repositories.filter((repository) =>
    repository.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="grid grid-cols-[2fr_1fr_1fr] border-b border-white/10 bg-white/[0.02] px-5 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          Repository
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          Language
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          Updated
        </span>
      </div>

      <div className="max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            Loading repositories...
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
          filteredRepositories.map((repository) => {
            const status =
              statuses[repository._id] ?? "unknown";
            const details = statusDetails[status];

            return (
              <Link
                key={repository._id}
                to={`/repositories/${repository._id}`}
                className="grid grid-cols-[2fr_1fr_1fr] items-center border-b border-white/5 px-5 py-4 transition-colors last:border-b-0 hover:bg-white/[0.04]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs ${details.className}`}
                    title={`Indexing status: ${details.label}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${details.dotClassName}`}
                    />
                    {details.label}
                  </span>

                  <span className="break-all text-sm font-medium text-zinc-200">
                    {repository.name}
                  </span>
                </div>

                <span className="text-sm text-zinc-500">
                  {repository.language || "Unknown"}
                </span>

                <span className="text-sm text-zinc-600">
                  {formatDate(
                    repository.updatedAt || repository.createdAt
                  )}
                </span>
              </Link>
            );
          })
        ) : (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            {repositories.length === 0
              ? "You haven't connected any repositories yet."
              : "No repositories found."}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryList;
