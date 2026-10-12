
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      setMenuOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ease-in-out ${
        scrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          to={user ? "/dashboard" : "/login"}
          className="text-xl font-bold tracking-tight text-white"
          onClick={closeMenu}
        >
          AI<span className="text-zinc-500">Project</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            to="/dashboard"
            className="text-sm text-zinc-300 transition-colors duration-300 hover:text-white"
          >
            Dashboard
          </Link>

          <Link
            to="/repositories"
            className="text-sm text-zinc-300 transition-colors duration-300 hover:text-white"
          >
            Repositories
          </Link>

          <Link
            to="/chat"
            className="text-sm text-zinc-300 transition-colors duration-300 hover:text-white"
          >
            Chat
          </Link>

          <Link
            to="/about"
            className="text-sm text-zinc-300 transition-colors duration-300 hover:text-white"
          >
            About
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <span className="max-w-40 truncate text-sm text-zinc-400">
                {user.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition duration-300 hover:bg-zinc-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span
            className={`h-0.5 w-6 bg-white transition-all duration-300 ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />

          <span
            className={`h-0.5 w-6 bg-white transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />

          <span
            className={`h-0.5 w-6 bg-white transition-all duration-300 ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-black/90 backdrop-blur-xl transition-all duration-500 md:hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-4 px-6 py-6">
          <Link
            to="/dashboard"
            className="text-zinc-300 transition hover:text-white"
            onClick={closeMenu}
          >
            Dashboard
          </Link>

          <Link
            to="/repositories"
            className="text-zinc-300 transition hover:text-white"
            onClick={closeMenu}
          >
            Repositories
          </Link>

          <Link
            to="/chat"
            className="text-zinc-300 transition hover:text-white"
            onClick={closeMenu}
          >
            Chat
          </Link>

          <Link
            to="/about"
            className="text-zinc-300 transition hover:text-white"
            onClick={closeMenu}
          >
            About
          </Link>

          <div className="mt-2 flex gap-3">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-zinc-300 disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-center text-sm text-zinc-300"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex-1 rounded-lg bg-white py-2 text-center text-sm font-medium text-black"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
