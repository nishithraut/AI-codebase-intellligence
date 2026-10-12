
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardStats from "../../components/dashboard/DashboardStats";
import RecentRepositories from "../../components/dashboard/RecentRepositories";
import { getRepositories } from "../../services/repositoryApi";

const Dashboard = () => {
  const navigate = useNavigate();

  const [repositoryCount, setRepositoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const repositories = await getRepositories();

        if (!cancelled) {
          setRepositoryCount(repositories.length);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load dashboard data"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleConnectRepository = () => {
    navigate("/repositories");
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-0">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Overview of your codebases
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="py-8 text-sm text-zinc-500">
            Loading dashboard...
          </div>
        ) : error ? (
          <div className="py-8 text-sm text-red-400">
            {error}
          </div>
        ) : (
          <DashboardStats repositoryCount={repositoryCount} />
        )}

        {/* Recent Repositories */}
        <div className="mt-10">
          <RecentRepositories />
        </div>

        {/* Connect Repository */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleConnectRepository}
            className="
              rounded-lg
              bg-white
              px-5
              py-2.5
              text-sm
              font-medium
              text-black
              transition-all
              duration-300
              hover:bg-zinc-200
              hover:shadow-lg
              active:scale-95
            "
          >
            + Connect Repository
          </button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
