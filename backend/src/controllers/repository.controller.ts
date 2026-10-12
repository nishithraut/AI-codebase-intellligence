
import type { Request, Response } from "express";
import mongoose from "mongoose";

import { Repository } from "../models/repository.model.js";
import { RepositoryFile } from "../models/repository-file.model.js";

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
