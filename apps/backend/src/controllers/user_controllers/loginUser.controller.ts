import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { comparePassword } from "../../utils/auth/password.js";
import { generateToken } from "../../utils/auth/token.js";
import { sendError, sendSuccess } from "../../utils/common/response.js";
import { LoginInput } from "../../types/user.types.js";

export const loginUser = async (
  req: Request<{}, {}, LoginInput>,
  res: Response
): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    // Find user by either email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      sendError(res, 401, "Invalid credentials. Please check your username/email and password.");
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      sendError(res, 401, "Invalid credentials. Please check your username/email and password.");
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    sendSuccess(res, 200, "Login successful", {
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    sendError(res, 500, "An error occurred during login.", error);
  }
};
