
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { Repository } from "../models/repository.model.js";

interface PythonChatResponse {
  success: boolean;
  data?: {
    conversationId: string;
    repositoryId: string;
    answer: string;
    sources: Array<{
      path: string | null;
      language: string | null;
      startLine: number | null;
      endLine: number | null;
      score: number | null;
    }>;
  };
  detail?: string;
}

export const chatWithRepository = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = res.locals.userId as string;
    const repositoryId = req.params.repositoryId;
    const { query, conversationId, limit } = req.body as {
      query?: unknown;
      conversationId?: unknown;
      limit?: unknown;
    };

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

    if (
      typeof query !== "string" ||
      !query.trim() ||
      query.length > 10000
    ) {
      res.status(400).json({
        success: false,
        message: "Query must contain between 1 and 10000 characters.",
      });
      return;
    }

    if (
      conversationId !== undefined &&
      (typeof conversationId !== "string" ||
        !conversationId.trim() ||
        conversationId.length > 64)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
      return;
    }

    const requestedLimit = limit === undefined ? 5 : limit;

    if (
      typeof requestedLimit !== "number" ||
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1 ||
      requestedLimit > 10
    ) {
      res.status(400).json({
        success: false,
        message: "Limit must be an integer between 1 and 10.",
      });
      return;
    }

    const repository = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repositoryId),
      userId,
    })
      .select("_id")
      .lean();

    if (!repository) {
      res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
      return;
    }

    const pythonResponse = await fetch(
      `${env.PYTHON_API_URL.replace(/\/+$/, "")}/api/v1/repositories/${repositoryId}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Api-Secret": env.INTERNAL_API_SECRET,
          "X-User-Id": userId,
        },
        body: JSON.stringify({
          query: query.trim(),
          ...(conversationId ? { conversationId } : {}),
          limit: requestedLimit,
        }),
        signal: AbortSignal.timeout(120000),
      }
    );

    const responseBody = (await pythonResponse.json().catch(() => null)) as
      | PythonChatResponse
      | null;

    if (!pythonResponse.ok) {
      if (
        pythonResponse.status >= 400 &&
        pythonResponse.status < 500 &&
        pythonResponse.status !== 401 &&
        pythonResponse.status !== 403
      ) {
        res.status(pythonResponse.status).json({
          success: false,
          message:
            responseBody?.detail ?? "The chat request could not be processed.",
        });
        return;
      }

      console.error(
        "FastAPI chat request failed with status:",
        pythonResponse.status
      );

      res.status(502).json({
        success: false,
        message: "The AI service could not process your request.",
      });
      return;
    }

    if (!responseBody?.success || !responseBody.data) {
      res.status(502).json({
        success: false,
        message: "The AI service returned an invalid response.",
      });
      return;
    }

    res.status(200).json(responseBody);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      res.status(504).json({
        success: false,
        message: "The AI service took too long to respond. Please try again.",
      });
      return;
    }

    console.error("Repository chat error:", error);

    res.status(502).json({
      success: false,
      message: "Unable to reach the AI service. Check that FastAPI is running.",
    });
  }
};

export const streamChatWithRepository = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const abortController = new AbortController();
  let streamFinished = false;

  try {
    const repositoryId = req.params.repositoryId;
    const userId = res.locals.userId as string;
    const { query, conversationId, limit = 5 } = req.body ?? {};

    if (
      typeof repositoryId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(repositoryId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid repository ID.",
      });
      return;
    }

    if (typeof query !== "string" || !query.trim()) {
      res.status(400).json({
        success: false,
        message: "Query is required.",
      });
      return;
    }

    if (query.length > 10000) {
      res.status(400).json({
        success: false,
        message: "Query is too long.",
      });
      return;
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 10
    ) {
      res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 10.",
      });
      return;
    }

    if (
      conversationId !== undefined &&
      (typeof conversationId !== "string" ||
        !conversationId.trim() ||
        conversationId.length > 64)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
      return;
    }

    const repository = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repositoryId),
      userId,
    }).select("_id");

    if (!repository) {
      res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
      return;
    }

    const pythonUrl =
      `${env.PYTHON_API_URL.replace(/\/+$/, "")}/api/v1/repositories/` +
      `${encodeURIComponent(repositoryId)}/chat/stream`;

    const pythonResponse = await fetch(pythonUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Api-Secret": env.INTERNAL_API_SECRET,
        "X-User-Id": userId,
      },
      body: JSON.stringify({
        query: query.trim(),
        ...(conversationId ? { conversationId } : {}),
        limit,
      }),
      signal: abortController.signal,
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();

      let message = "The AI service could not start streaming.";

      try {
        const errorBody = JSON.parse(errorText);
        message = errorBody.detail ?? errorBody.message ?? message;
      } catch {
        // Keep the generic message if the upstream response isn't JSON.
      }

      res.status(pythonResponse.status).json({
        success: false,
        message,
      });
      return;
    }

    if (!pythonResponse.body) {
      res.status(502).json({
        success: false,
        message: "The AI service returned an empty stream.",
      });
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    req.on("close", () => {
      if (!streamFinished) {
        abortController.abort();
      }
    });

    const reader = pythonResponse.body.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (res.destroyed) {
          await reader.cancel();
          break;
        }

        if (!res.write(Buffer.from(value))) {
          await new Promise<void>((resolve) => {
            res.once("drain", resolve);
          });
        }
      }
    } finally {
      streamFinished = true;
      reader.releaseLock();

      if (!res.writableEnded && !res.destroyed) {
        res.end();
      }
    }
  } catch (error) {
    if (abortController.signal.aborted) {
      return;
    }

    if (res.headersSent) {
      if (!res.destroyed) res.end();
      return;
    }

    next(error);
  }
};
