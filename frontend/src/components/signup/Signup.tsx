import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    console.log({
      email,
      password,
    });

    // TODO: Call signup API here

    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight"
          >
            AI<span className="text-zinc-600">Project</span>
          </Link>

          <h1 className="mt-8 text-2xl font-semibold">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Start exploring your codebases with AI
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl">

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="
                  w-full
                  rounded-lg
                  border
                  border-white/10
                  bg-black/40
                  px-4
                  py-3
                  text-sm
                  text-white
                  outline-none
                  transition
                  duration-300
                  placeholder:text-zinc-700
                  focus:border-white/30
                  focus:bg-white/[0.05]
                "
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="
                  w-full
                  rounded-lg
                  border
                  border-white/10
                  bg-black/40
                  px-4
                  py-3
                  text-sm
                  text-white
                  outline-none
                  transition
                  duration-300
                  placeholder:text-zinc-700
                  focus:border-white/30
                  focus:bg-white/[0.05]
                "
              />

              <p className="mt-2 text-xs text-zinc-600">
                Password must be at least 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="
                  w-full
                  rounded-lg
                  border
                  border-white/10
                  bg-black/40
                  px-4
                  py-3
                  text-sm
                  text-white
                  outline-none
                  transition
                  duration-300
                  placeholder:text-zinc-700
                  focus:border-white/30
                  focus:bg-white/[0.05]
                "
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="
                w-full
                rounded-lg
                bg-white
                py-3
                text-sm
                font-medium
                text-black
                transition-all
                duration-300
                hover:bg-zinc-200
                active:scale-[0.98]
              "
            >
              Create Account
            </button>

          </form>
        </div>

        {/* Login */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-white transition hover:text-zinc-300"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;

