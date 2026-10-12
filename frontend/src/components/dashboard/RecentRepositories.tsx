
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getRepositories,
  type Repository,
} from "../../services/repositoryApi";


const RecentRepositories = () => {
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
          // Sort newest first, then show only the latest three.
          const sorted = [...data].sort((a, b) => {
            const dateA = new Date(
              a.updatedAt || a.createdAt || 0
            ).getTime();

            const dateB = new Date(
              b.updatedAt || b.createdAt || 0
            ).getTime();

            return dateB - dateA;
          });

          setRepositories(sorted.slice(0, 3));
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

        {/* Loading state */}
        {loading && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-zinc-500">
              Loading repositories...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Repository Rows */}
        {!loading && !error && repositories.length > 0 &&
          repositories.map((repo) => (
            <Link
              key={repo._id}
              to={`/repositories/${repo._id}`}
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
              <div className="flex min-w-0 items-center gap-3">
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

                <span className="truncate text-sm font-medium text-zinc-200">
                  {repo.name}
                </span>
              </div>

              {/* Language */}
              <span className="truncate text-sm text-zinc-500">
                {repo.language || "Unknown"}
              </span>

              {/* Connection status */}
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                <span className="text-sm text-zinc-400">
                  Connected
                </span>
              </div>
            </Link>
          ))}

        {/* Empty state */}
        {!loading && !error && repositories.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-zinc-500">
              No repositories connected yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentRepositories;
