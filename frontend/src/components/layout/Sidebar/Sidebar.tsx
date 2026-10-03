import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "⌂",
    },
    {
      name: "Repositories",
      path: "/repositories",
      icon: "◈",
    },
    {
      name: "Search",
      path: "/search",
      icon: "⌕",
    },
    {
      name: "Chat",
      path: "/chat",
      icon: "◌",
    },
  ];

  return (
    <aside
      className={`
        fixed
        left-0
        top-16
        z-40
        h-[calc(100vh-4rem)]
        border-r
        border-white/10
        bg-black/80
        backdrop-blur-xl

        transition-all
        duration-300
        ease-in-out

        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <span className="text-sm font-medium text-zinc-400">
            Navigation
          </span>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-zinc-400
            transition
            duration-200
            hover:bg-white/10
            hover:text-white
          "
          aria-label="Toggle sidebar"
        >
          <span
            className={`transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
          >
            ‹
          </span>
        </button>
      </div>

      {/* Scrollable Navigation */}
      <div className="h-[calc(100%-4rem)] overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-sm
                  transition-all
                  duration-200

                  ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                  }

                  ${collapsed ? "justify-center" : ""}
                `}
              >
                {/* Icon */}
                <span
                  className={`
                    flex
                    h-5
                    w-5
                    shrink-0
                    items-center
                    justify-center
                    text-base

                    ${
                      isActive
                        ? "text-white"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    }
                  `}
                >
                  {item.icon}
                </span>

                {/* Label */}
                {!collapsed && (
                  <span className="whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Example additional section */}
        {!collapsed && (
          <div className="mt-8">
            <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-zinc-600">
              Workspace
            </p>

            <nav className="space-y-1">
              <Link
                to="/settings"
                className="
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-sm
                  text-zinc-500
                  transition
                  hover:bg-white/5
                  hover:text-zinc-200
                "
              >
                <span className="flex h-5 w-5 items-center justify-center">
                  ⚙
                </span>

                <span>Settings</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
};


export default Sidebar;