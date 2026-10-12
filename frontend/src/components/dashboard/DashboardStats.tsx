interface DashboardStatsProps {
  repositoryCount: number;
}

const DashboardStats = ({
  repositoryCount,
}: DashboardStatsProps) => {
  const stats = [
    {
      label: "Repositories",
      value: String(repositoryCount),
      description: "Connected",
    },
    {
      label: "Questions",
      value: "—",
      description: "Not available yet",
    },
    {
      label: "Usage",
      value: "—",
      description: "Not available yet",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="
            rounded-xl
            border border-white/10
            bg-white/[0.03]
            p-5
            transition-all
            duration-300
            hover:border-white/20
            hover:bg-white/[0.05]
          "
        >
          <p className="text-sm text-zinc-500">
            {stat.label}
          </p>

          <p className="mt-2 text-3xl font-semibold text-white">
            {stat.value}
          </p>

          {stat.description && (
            <p className="mt-1 text-xs text-zinc-600">
              {stat.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
