
import type { Request, Response } from "express";
import { env } from "../config/env.js";

const pythonUrl = env.PYTHON_API_URL.replace(/\/+$/, "");

const forwardConversationRequest = async (
  path: string,
  userId: string
) => {
  return fetch(`${pythonUrl}/api/v1/conversations${path}`, {
    method: "GET",
    headers: {
      "X-Internal-Api-Secret": env.INTERNAL_API_SECRET,
      "X-User-Id": userId,
    },
    signal: AbortSignal.timeout(30000),
  });
};

const handleProxyError = (error: unknown, res: Response) => {
  if (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  ) {
    res.status(504).json({
      success: false,
      message: "The AI service took too long to respond.",
    });
    return;
  }

  console.error("Conversation history proxy error:", error);

  res.status(502).json({
    success: false,
    message: "Unable to retrieve conversation history.",
  });
};

export const listConversations = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const response = await forwardConversationRequest(
      "",
      res.locals.userId as string
    );

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      res.status(response.status >= 500 ? 502 : response.status).json({
        success: false,
        message: "Failed to retrieve conversations.",
      });
      return;
    }

    res.status(200).json(body);
  } catch (error) {
    handleProxyError(error, res);
  }
};

export const getConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const conversationId = req.params.conversationId;

    if (
      typeof conversationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(conversationId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
      return;
    }

    const response = await forwardConversationRequest(
      `/${encodeURIComponent(conversationId)}`,
      res.locals.userId as string
    );

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const status =
        response.status === 404
          ? 404
          : response.status >= 500
            ? 502
            : response.status;

      res.status(status).json({
        success: false,
        message:
          body && typeof body.detail === "string"
            ? body.detail
            : "Failed to retrieve conversation.",
      });
      return;
    }

    res.status(200).json(body);
  } catch (error) {
    handleProxyError(error, res);
  }
};
