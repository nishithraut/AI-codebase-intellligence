
import type { Request, Response } from "express";
import mongoose from "mongoose";

import { Repository } from "../models/repository.model.js";
import { RepositoryFile } from "../models/repository-file.model.js";

import { ingestGitHubRepository } from "../services/github-ingestion.service.js";

interface GitHubRepositoryResponse {
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  language: string | null;
}

/**
 * FUNCTION: connectRepository()
 *
 * PURPOSE:
 * Validates a public GitHub repository URL, fetches its metadata,
 * and saves it under the currently authenticated user.
 *
 * API:
 * POST /api/repositories
 *
 * SECURITY:
 * The owner is taken from res.locals.userId, never from the request body.
 */
export const connectRepository = async (
  req: Request,
  res: Response
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

    // Accept only a GitHub URL pointing directly to owner/repository.
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

    let owner: string;
    let repositoryName: string;

    const ownerPart = pathParts[0];
    const repositoryPart = pathParts[1];

    if (!ownerPart || !repositoryPart) {
      res.status(400).json({
        success: false,
        message: "Use this format: https://github.com/owner/repository",
      });
      return;
    }

    try {
      owner = decodeURIComponent(ownerPart);
      repositoryName = decodeURIComponent(repositoryPart).replace(/\.git$/i, "");
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

    // Fetch repository metadata from GitHub's public API.
    const githubResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repositoryName)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "ai-intelligence-codebase",
        },
      }
    );

    if (githubResponse.status === 404) {
      res.status(404).json({
        success: false,
        message:
          "Repository not found. Check the URL and make sure the repository is public.",
      });
      return;
    }

    if (githubResponse.status === 403) {
      res.status(502).json({
        success: false,
        message: "GitHub API rate limit or access restriction encountered. Try again later.",
      });
      return;
    }

    if (!githubResponse.ok) {
      res.status(502).json({
        success: false,
        message: "Unable to retrieve repository details from GitHub.",
      });
      return;
    }

    const githubRepository =
      (await githubResponse.json()) as GitHubRepositoryResponse;

    if (githubRepository.private) {
      res.status(400).json({
        success: false,
        message: "Private repositories are not supported yet.",
      });
      return;
    }

    // Use GitHub's canonical URL to keep stored URLs consistent.
    const canonicalUrl = githubRepository.html_url.replace(/\/$/, "");

    // Prevent the same user from connecting the same repository twice.
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

    // Save ownership using the authenticated user's ID.
    const repository = await Repository.create({
      userId,
      name: githubRepository.name,
      url: canonicalUrl,
      language: githubRepository.language ?? "Unknown",
    });

    const ingestion = await ingestGitHubRepository(
      repository._id,
      owner,
      repositoryName
    );

    res.status(201).json({
      success: true,
      message: ingestion.partial
        ? "Repository connected with partial ingestion."
        : "Repository connected and ingested successfully.",
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
 * FUNCTION 1: getRepositories()
 *
 * PURPOSE:
 * Fetches ALL repositories belonging to the currently logged-in user.
 *
 * USED BY:
 * The Repositories page, where the user sees their repository list.
 *
 * API:
 * GET /api/repositories
 *
 * SECURITY:
 * Uses res.locals.userId, which is set by the authentication middleware.
 * It does not return repositories belonging to other users.
 */
export const getRepositories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the ID of the currently authenticated user.
    const userId = res.locals.userId as string;

    // Find only repositories owned by this user.
    // Sorting by newest first makes recently added repositories appear first.
    const repositories = await Repository.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Return the user's repository list.
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
 * FUNCTION 2: getRepository()
 *
 * PURPOSE:
 * Fetches ONE specific repository and all its stored files.
 *
 * USED BY:
 * The Repository Details page, when the user clicks a repository
 * or opens a URL containing its MongoDB ID.
 *
 * API:
 * GET /api/repositories/:repositoryId
 *
 * SECURITY:
 * Checks both the repository ID and the logged-in user's ID.
 * A user cannot access another user's repository through its ID.
 */
export const getRepository = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Read the repository ID from the URL.
    const { repositoryId } = req.params;

    // Get the ID of the currently authenticated user.
    const userId = res.locals.userId as string;

    // Validate the ID before querying MongoDB.
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

    // Find this repository only if it belongs to the logged-in user.
    const repository = await Repository.findOne({
      _id: repositoryId,
      userId,
    }).lean();

    // Return 404 if the repository does not exist
    // or does not belong to the logged-in user.
    if (!repository) {
      res.status(404).json({
        success: false,
        message: "Repository not found",
      });
      return;
    }

    // Fetch the files associated with this repository.
    const files = await RepositoryFile.find({
      repositoryId: repository._id,
    })
      .select("_id path content")
      .lean();

    // Return the repository information and its files.
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
