import { Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { prisma } from "@repo/db";
import { verifyToken } from "../../utils/auth/token.js";
import { sendError } from "../../utils/common/response.js";
import { AuthenticatedRequest } from "../../types/user.types.js";

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      // 2. Check cookies
      token = req.cookies.token;
    }

    if (!token) {
      sendError(res, 401, "Authentication required. Please provide a valid token.");
      return;
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      sendError(res, 401, "Invalid or expired token. Please log in again.");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      sendError(res, 401, "User belonging to this token no longer exists.");
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    sendError(res, 500, "Internal server error during authentication.", error);
  }
};

export const validateRequest = (schema: ZodSchema) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        sendError(res, 400, "Validation failed", formattedErrors);
        return;
      }
      sendError(res, 400, "Invalid request data", error);
    }
  };
};
