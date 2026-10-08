import type { Repository } from "../../types/repository";

interface RepositoryHeaderProps {
  repository: Repository;
}

const RepositoryHeader = ({
  repository,
}: RepositoryHeaderProps) => {
  return (
    <header className="px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-white">
            {repository.name}
          </h1>

          <p className="mt-1 truncate text-sm text-gray-500">
            {repository.url}
          </p>
        </div>

        <span className="ml-6 shrink-0 text-xs text-gray-500">
          Repository
        </span>
      </div>
    </header>
  );
};

export default RepositoryHeader;