import { useState } from "react";
import RepositoryList from "../../components/repository/RepositoryList";
import { connectRepository } from "../../services/repositoryApi";

const Repositories = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Open the form and clear messages from the previous attempt.
  const handleOpenConnectForm = () => {
    setRepositoryUrl("");
    setError("");
    setSuccess("");
    setShowConnectForm(true);
  };

  // Submit the URL to the backend and refresh the repository list.
  const handleConnectRepository = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setConnecting(true);
    setError("");
    setSuccess("");

    try {
      const repository = await connectRepository(repositoryUrl.trim());

      setSuccess(`${repository.name} connected successfully.`);
      setRepositoryUrl("");
      setShowConnectForm(false);
      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect repository."
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Repositories
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage and explore your connected codebases
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenConnectForm}
            className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            + Connect Repo
          </button>
        </div>

        {success && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400"
          >
            {success}
          </p>
        )}

        <div className="mt-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search repositories..."
            aria-label="Search repositories"
            className="mb-5 w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 sm:max-w-sm"
          />

          <RepositoryList
            searchQuery={searchQuery}
            refreshKey={refreshKey}
          />
        </div>
      </div>

      {showConnectForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !connecting) {
              setShowConnectForm(false);
              setError("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-repository-title"
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="connect-repository-title"
                  className="text-xl font-semibold text-white"
                >
                  Connect repository
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Enter the URL of a public GitHub repository.
                </p>
              </div>

              <button
                type="button"
                disabled={connecting}
                onClick={() => {
                  setShowConnectForm(false);
                  setError("");
                }}
                aria-label="Close dialog"
                className="rounded-md px-2 py-1 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectRepository} className="mt-6">
              <label
                htmlFor="repository-url"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                GitHub repository URL
              </label>

              <input
                id="repository-url"
                type="url"
                required
                autoFocus
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={connecting}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30 disabled:opacity-50"
              />

              <p className="mt-2 text-xs text-zinc-600">
                Private repositories are not supported yet.
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400"
                >
                  {error}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={connecting}
                  onClick={() => {
                    setShowConnectForm(false);
                    setError("");
                  }}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={connecting || !repositoryUrl.trim()}
                  className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Connect repository"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repositories;
