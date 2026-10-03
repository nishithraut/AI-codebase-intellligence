import { useEffect, useState } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        <a
          href="/"
          className="text-xl font-bold tracking-tight text-white"
        >
          AI<span className="text-zinc-500">Project</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="/dashboard"
            className="text-sm text-zinc-300 transition-colors duration-300 hover:text-white"
          >
            Dashboard
          </a>

          <a
            href="/repositories"
            className="text-sm text-zinc-300 transition-colors duration-300 hover:text-white"
          >
            Repositories
          </a>

          <a
            href="/chat"
            className="text-sm text-zinc-300 transition-colors duration-300 hover:text-white"
          >
            Chat
          </a>

          <a
            href="/about"
            className="text-sm text-zinc-300 transition-colors duration-300 hover:text-white"
          >
            About
          </a>
        </div>

        {/* Right Side */}
        <div className="hidden items-center gap-4 md:flex">
          <button className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white">
            Login
          </button>

          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition duration-300 hover:bg-zinc-200">
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
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
          <a
            href="/dashboard"
            className="text-zinc-300 transition hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </a>

          <a
            href="/repositories"
            className="text-zinc-300 transition hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Repositories
          </a>

          <a
            href="/chat"
            className="text-zinc-300 transition hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Chat
          </a>

          <a
            href="/about"
            className="text-zinc-300 transition hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            About
          </a>

          <div className="mt-2 flex gap-3">
            <button className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-zinc-300">
              Login
            </button>

            <button className="flex-1 rounded-lg bg-white py-2 text-sm font-medium text-black">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;