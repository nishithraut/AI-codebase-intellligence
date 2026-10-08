import DashboardStats from "../../components/dashboard/DashboardStats";
import RecentRepositories from "../../components/dashboard/RecentRepositories";

const Dashboard = () => {
  const handleConnectRepository = () => {
    console.log("Connect repository");
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-6 pt-0 pb-20">

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
        <DashboardStats />

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