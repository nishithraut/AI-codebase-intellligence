import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log({
      email,
      password,
    });

    // TODO: Call login API here

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
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Sign in to continue to your account
          </p>
        </div>

        {/* Login Card */}
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
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-zinc-300"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs text-zinc-500 transition hover:text-white"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
              Sign In
            </button>

          </form>
        </div>

        {/* Sign Up */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-white transition hover:text-zinc-300"
          >
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;


