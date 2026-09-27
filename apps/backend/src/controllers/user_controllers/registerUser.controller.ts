import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { hashPassword } from "../../utils/auth/password.js";
import { generateToken } from "../../utils/auth/token.js";
import { sendError, sendSuccess } from "../../utils/common/response.js";
import { RegisterInput } from "../../types/user.types.js";

export const registerUser = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password, name } = req.body;

    // Check if user already exists with either email or username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        sendError(res, 409, "A user with this email already exists.");
        return;
      }
      if (existingUser.username === username) {
        sendError(res, 409, "Username is already taken.");
        return;
      }
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
    });

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, 201, "User registered successfully", {
      user: newUser,
      token,
    });
  } catch (error) {
    console.error("Register Error:", error);
    sendError(res, 500, "An error occurred while registering the user.", error);
  }
};
