import { useState } from "react";
import RepositoryList from "./RepositoryList";

const Repositories = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleConnectRepository = () => {
    console.log("Connect repository");
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Repositories
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage and explore your connected codebases
            </p>
          </div>

          {/* Connect Repository */}
          <button
            onClick={handleConnectRepository}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-white
              px-4
              py-2.5
              text-sm
              font-medium
              text-black
              transition-all
              duration-300
              hover:bg-zinc-200
              active:scale-95
            "
          >
            <span className="text-lg leading-none">
              +
            </span>

            Connect Repo
          </button>
        </div>

        {/* Search */}
        <div className="mt-8">
          <div className="relative">
            {/* Search Icon */}
            <span
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-zinc-600
              "
            >
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/[0.03]
                py-3
                pl-11
                pr-4
                text-sm
                text-white
                outline-none
                transition-all
                duration-300
                placeholder:text-zinc-700
                focus:border-white/20
                focus:bg-white/[0.05]
              "
            />
          </div>
        </div>

        {/* Repository List */}
        <div className="mt-6">
          <RepositoryList searchQuery={searchQuery} />
        </div>

      </div>
    </div>
  );
};

export default Repositories;