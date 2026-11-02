
import { env } from "../config/env.js";

const GITHUB_API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly rateLimitRemaining: string | null,
    public readonly rateLimitReset: string | null,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export const githubApiGet = async <T>(
  endpoint: string,
): Promise<T> => {
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const response = await fetch(
    `${GITHUB_API_BASE}${normalizedEndpoint}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ai-codebase-intelligence",
        ...(env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` }
          : {}),
      },
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    let message = "GitHub API request failed.";

    try {
      const parsed = JSON.parse(body) as {
        message?: string;
      };

      message = parsed.message ?? message;
    } catch {
      // Keep the default error message.
    }

    throw new GitHubApiError(
      message,
      response.status,
      response.headers.get("x-ratelimit-remaining"),
      response.headers.get("x-ratelimit-reset"),
    );
  }

  return (await response.json()) as T;
};
