
import { env } from "../config/env.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";

import { Repository } from "../models/repository.model.js";
import { RepositoryFile } from "../models/repository-file.model.js";

import { ingestGitHubRepository } from "../services/github-ingestion.service.js";
import {
  githubApiGet,
  GitHubApiError,
} from "../services/github-api.service.js";

interface GitHubRepositoryResponse {
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  language: string | null;
}

const triggerPythonIndexing = async (
  repositoryId: string,
  userId: string,
): Promise<void> => {
  const response = await fetch(
    `${env.PYTHON_API_URL}/api/v1/repositories/${encodeURIComponent(repositoryId)}/index`,
    {
      method: "POST",
      headers: {
        "X-Internal-Api-Secret": env.INTERNAL_API_SECRET,
        "X-User-Id": userId,
      },
      signal: AbortSignal.timeout(10 * 60 * 1000),
    },
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(`Python indexing failed (${response.status}): ${message}`);
  }
};

/**
 * Validates a public GitHub repository URL,
 * fetches its metadata, and saves it under the authenticated user.
 */
export const connectRepository = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = res.locals.userId as string;
    const { url } = req.body as { url?: string };

    if (typeof url !== "string" || !url.trim()) {
      res.status(400).json({
        success: false,
        message: "Please provide a GitHub repository URL.",
      });
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url.trim());
    } catch {
      res.status(400).json({
        success: false,
        message: "Please enter a valid GitHub repository URL.",
      });
      return;
    }

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname.toLowerCase() !== "github.com" ||
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      res.status(400).json({
        success: false,
        message: "Only standard HTTPS GitHub repository URLs are supported.",
      });
      return;
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (pathParts.length !== 2) {
      res.status(400).json({
        success: false,
        message: "Use this format: https://github.com/owner/repository",
      });
      return;
    }

    const ownerPart = pathParts[0];
    const repositoryPart = pathParts[1];

    if (!ownerPart || !repositoryPart) {
      res.status(400).json({
        success: false,
        message: "Use this format: https://github.com/owner/repository",
      });
      return;
    }

    let owner: string;
    let repositoryName: string;

    try {
      owner = decodeURIComponent(ownerPart);
      repositoryName = decodeURIComponent(repositoryPart).replace(
        /\.git$/i,
        "",
      );
    } catch {
      res.status(400).json({
        success: false,
        message: "The GitHub repository URL is invalid.",
      });
      return;
    }

    if (
      !owner ||
      !repositoryName ||
      owner.includes("/") ||
      repositoryName.includes("/")
    ) {
      res.status(400).json({
        success: false,
        message: "The GitHub repository URL is invalid.",
      });
      return;
    }

    // Fetch repository metadata using authenticated GitHub API.
    let githubRepository: GitHubRepositoryResponse;

    try {
      githubRepository = await githubApiGet<GitHubRepositoryResponse>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repositoryName)}`,
      );
    } catch (error) {
      if (error instanceof GitHubApiError) {
        if (error.status === 404) {
          res.status(404).json({
            success: false,
            message:
              "Repository not found. Check the URL and make sure the repository is public.",
          });
          return;
        }

        if (error.status === 401) {
          res.status(502).json({
            success: false,
            message: "GitHub authentication failed. Check your GitHub token.",
          });
          return;
        }

        if (error.status === 403 || error.status === 429) {
          res.status(502).json({
            success: false,
            message:
              "GitHub API rate limit or access restriction encountered. Check your GitHub token and try again.",
          });
          return;
        }
      }

      throw error;
    }

    if (githubRepository.private) {
      res.status(400).json({
        success: false,
        message: "Private repositories are not supported yet.",
      });
      return;
    }

    // Use GitHub's canonical URL.
    const canonicalUrl = githubRepository.html_url.replace(/\/$/, "");

    // Prevent duplicate repository connections.
    const existingRepository = await Repository.findOne({
      userId,
      url: canonicalUrl,
    });

    if (existingRepository) {
      res.status(409).json({
        success: false,
        message: "You have already connected this repository.",
      });
      return;
    }

    // Save repository ownership.
    const repository = await Repository.create({
      userId,
      name: githubRepository.name,
      url: canonicalUrl,
      language: githubRepository.language ?? "Unknown",
    });

    const ingestion = await ingestGitHubRepository(
      repository._id,
      owner,
      repositoryName,
    );

    // Start Python indexing without making the user wait.
    void triggerPythonIndexing(repository._id.toString(), userId).catch(
      (error: unknown) => {
        console.error(
          `Indexing failed for repository ${repository._id}:`,
          error,
        );
      },
    );

    res.status(201).json({
      success: true,
      message: ingestion.partial
        ? "Repository connected with partial ingestion. Indexing started."
        : "Repository connected. Indexing started.",
      data: {
        repository,
        ingestion,
      },
    });
  } catch (error) {
    console.error("Connect repository error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to connect repository.",
    });
  }
};

/**
 * Fetches all repositories belonging to the authenticated user.
 */
export const getRepositories = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = res.locals.userId as string;

    const repositories = await Repository.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        repositories,
      },
    });
  } catch (error) {
    console.error("Get repositories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch repositories",
    });
  }
};

/**
 * Fetches one repository and its stored files.
 * Verifies repository ownership before returning data.
 */
export const getRepository = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { repositoryId } = req.params;
    const userId = res.locals.userId as string;

    if (
      typeof repositoryId !== "string" ||
      !mongoose.Types.ObjectId.isValid(repositoryId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid repository ID",
      });
      return;
    }

    const repository = await Repository.findOne({
      _id: repositoryId,
      userId,
    }).lean();

    if (!repository) {
      res.status(404).json({
        success: false,
        message: "Repository not found",
      });
      return;
    }

    const files = await RepositoryFile.find({
      repositoryId: repository._id,
    })
      .select("_id path content")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        repository,
        files,
      },
    });
  } catch (error) {
    console.error("Get repository error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch repository",
    });
  }
};

/**
 * Fetches Python indexing status after verifying repository ownership.
 */
export const getRepositoryIndexStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const repositoryId = req.params.repositoryId;
    const userId = res.locals.userId as string;

    if (
      typeof repositoryId !== "string" ||
      !mongoose.Types.ObjectId.isValid(repositoryId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid repository ID.",
      });
      return;
    }

    const repository = await Repository.findOne({
      _id: repositoryId,
      userId,
    }).select("_id");

    if (!repository) {
      res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
      return;
    }

    const response = await fetch(
      `${env.PYTHON_API_URL}/api/v1/repositories/${encodeURIComponent(repositoryId)}/index-status`,
      {
        method: "GET",
        headers: {
          "X-Internal-Api-Secret": env.INTERNAL_API_SECRET,
          "X-User-Id": userId,
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Python status request failed (${response.status}).`,
      );
    }

    const result = (await response.json()) as {
      success?: boolean;
      data?: {
        status?: string;
      };
    };

    const pythonStatus = result.data?.status ?? "unknown";

    const statusMap: Record<string, string> = {
      not_indexed: "not_indexed",
      queued: "indexing",
      indexing: "indexing",
      ready: "completed",
      completed: "completed",
      failed: "failed",
    };

    res.status(200).json({
      success: true,
      data: {
        repositoryId,
        status: statusMap[pythonStatus] ?? "unknown",
      },
    });
  } catch (error) {
    console.error("Get repository indexing status error:", error);

    res.status(502).json({
      success: false,
      message: "Unable to retrieve indexing status.",
    });
  }
};
