import { Request, Response } from "express";
import { User } from "../models/user.model.js";
import { Repository } from "../models/repository.model.js";
import { RepositoryFile } from "../models/repository-file.model.js";

export const createTestData = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.create({
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      password: "test-password"
    });

    const repository = await Repository.create({
      userId: user._id,
      name: "test-repository",
      url: "https://github.com/test/test-repository"
    });

    const file = await RepositoryFile.create({
      repositoryId: repository._id,
      path: "src/App.tsx",
      content: "export default function App() { return <h1>Hello</h1>; }"
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        repository,
        file
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create test data"
    });
  }
};