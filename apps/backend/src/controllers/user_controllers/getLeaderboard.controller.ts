import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { sendError, sendSuccess } from "../../utils/common/response.js";

export const getLeaderboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            gamesAsUser1: true,
            gamesAsUser2: true,
          },
        },
      },
      take: 50,
    });

    // Fetch total wins for each user
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const winsCount = await prisma.game.count({
          where: {
            winnerId: user.id,
            status: "COMPLETED",
          },
        });

        const totalGames =
          user._count.gamesAsUser1 + user._count.gamesAsUser2;
        const winRate =
          totalGames > 0 ? Math.round((winsCount / totalGames) * 100) : 0;

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          totalGames,
          wins: winsCount,
          winRate,
        };
      })
    );

    // Sort by wins descending, then by winRate
    leaderboardData.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

    sendSuccess(res, 200, "Leaderboard fetched successfully", leaderboardData);
  } catch (error) {
    console.error("Leaderboard Error:", error);
    sendError(res, 500, "An error occurred while fetching leaderboard.", error);
  }
};
