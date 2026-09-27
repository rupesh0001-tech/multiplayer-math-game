import { Response } from "express";
import { prisma } from "@repo/db";
import { AuthenticatedRequest } from "../../types/user.types.js";
import { sendError, sendSuccess } from "../../utils/common/response.js";

export const getGameHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 401, "Unauthorized");
      return;
    }

    const games = await prisma.game.findMany({
      where: {
        OR: [{ user1Id: req.user.id }, { user2Id: req.user.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user1: { select: { id: true, username: true, name: true } },
        user2: { select: { id: true, username: true, name: true } },
      },
    });

    const formattedHistory = games.map((game) => {
      const isUser1 = game.user1Id === req.user!.id;
      const opponent = isUser1 ? game.user2 : game.user1;
      const mySolved = isUser1 ? game.user1SolvedCount : game.user2SolvedCount;
      const opponentSolved = isUser1
        ? game.user2SolvedCount
        : game.user1SolvedCount;

      let result: "WIN" | "LOSS" | "DRAW" = "DRAW";
      if (game.winnerId === req.user!.id) {
        result = "WIN";
      } else if (game.winnerId) {
        result = "LOSS";
      }

      return {
        id: game.id,
        opponent,
        mySolved,
        opponentSolved,
        result,
        startedAt: game.startedAt,
        finishedAt: game.finishedAt,
      };
    });

    sendSuccess(res, 200, "Game history fetched successfully", formattedHistory);
  } catch (error) {
    console.error("Game History Error:", error);
    sendError(res, 500, "An error occurred while fetching game history.", error);
  }
};
