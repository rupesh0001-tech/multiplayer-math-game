import { Response } from "express";
import { prisma } from "@repo/db";
import { AuthenticatedRequest } from "../../types/user.types.js";
import { sendError, sendSuccess } from "../../utils/common/response.js";

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, "Unauthorized");
      return;
    }

    // Fetch user details including basic stats
    const userProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            friendshipsAsUser1: true,
            friendshipsAsUser2: true,
            gamesAsUser1: true,
            gamesAsUser2: true,
          },
        },
      },
    });

    if (!userProfile) {
      sendError(res, 404, "User profile not found");
      return;
    }

    const totalFriends =
      userProfile._count.friendshipsAsUser1 + userProfile._count.friendshipsAsUser2;
    const totalGames =
      userProfile._count.gamesAsUser1 + userProfile._count.gamesAsUser2;

    sendSuccess(res, 200, "User profile fetched successfully", {
      user: {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        name: userProfile.name,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      },
      stats: {
        totalFriends,
        totalGames,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    sendError(res, 500, "An error occurred while fetching user profile.", error);
  }
};
