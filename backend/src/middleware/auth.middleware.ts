
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

interface AuthTokenPayload {
  userId: string;
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.token;

  if (typeof token !== "string" || !token) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string"
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
      return;
    }

    const payload = decoded as jwt.JwtPayload & AuthTokenPayload;

    res.locals.userId = payload.userId;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Your session is invalid or expired. Please log in again.",
    });
  }
};
