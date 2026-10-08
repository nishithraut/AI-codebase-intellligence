import { Request, Response } from "express";
import mongoose from "mongoose";

import { Repository } from "../models/repository.model.js";
import { RepositoryFile } from "../models/repository-file.model.js";

export const getRepository = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { repositoryId } = req.params;

    // Make sure repositoryId exists and is a string
    if (
      typeof repositoryId !== "string" ||
      !mongoose.Types.ObjectId.isValid(repositoryId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid repository ID"
      });
      return;
    }

    const repository = await Repository.findById(repositoryId).lean();

    if (!repository) {
      res.status(404).json({
        success: false,
        message: "Repository not found"
      });
      return;
    }

    const files = await RepositoryFile.find({
      repositoryId: repository._id
    })
      .select("_id path content")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        repository,
        files
      }
    });
  } catch (error) {
    console.error("Get repository error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch repository"
    });
  }
};