import dotenv from "dotenv";
dotenv.config();

import { WebSocketServer, WebSocket } from "ws";
import { verifyJWT, JWT_SECRET, generateQues, Question, SafeQuestion } from "@repo/common";
import { prisma } from "@repo/db";

const PORT = Number(process.env.PORT) || 8080;

const wss = new WebSocketServer({
  port: PORT,
});

export interface OnlineUser {
  userId: string;
  username: string;
  email: string;
  socket: WebSocket;
  currentRoomId?: string;
  inMatchmaking?: boolean;
}

export interface PlayerState {
  userId: string;
  username: string;
  score: number;
  solvedCount: number;
  currentQuestionIndex: number;
  streak: number;
  finished: boolean;
}

export interface ActiveGame {
  id: string;
  roomCode?: string;
  player1: PlayerState;
  player2: PlayerState;
  questions: Question[];
  status: "waiting" | "in_progress" | "completed" | "cancelled";
  startedAt: number;
  winnerId?: string | null;
  rematchRequestedBy?: string | null;
}

// In-memory state
const onlineUsers = new Map<string, OnlineUser>();
const activeGames = new Map<string, ActiveGame>();
let matchmakingQueue: string[] = []; // userIds waiting for quick match

// Helper: Broadcast online users list to all connected clients
function broadcastOnlineUsers() {
  const usersList = Array.from(onlineUsers.values()).map((u) => ({
    userId: u.userId,
    username: u.username,
    inGame: Boolean(u.currentRoomId),
    inQueue: Boolean(u.inMatchmaking),
  }));

  const payload = JSON.stringify({
    type: "online_users_update",
    users: usersList,
    count: usersList.length,
  });

  for (const user of onlineUsers.values()) {
    if (user.socket.readyState === WebSocket.OPEN) {
      user.socket.send(payload);
    }
  }
}

// Helper: Sanitize questions before sending to clients (omit answers)
function sanitizeQuestions(questions: Question[]): SafeQuestion[] {
  return questions.map(({ ans, ...safe }) => safe);
}

// Helper: Send message to specific user
function sendToUser(userId: string, data: any) {
  const user = onlineUsers.get(userId);
  if (user && user.socket.readyState === WebSocket.OPEN) {
    user.socket.send(JSON.stringify(data));
  }
}

// Helper: Start a game between two players
async function startMatch(player1Id: string, player2Id: string, roomCode?: string) {
  const p1 = onlineUsers.get(player1Id);
  const p2 = onlineUsers.get(player2Id);

  if (!p1 || !p2) return;

  const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const questions = generateQues(10);
  const safeQuestions = sanitizeQuestions(questions);

  const newGame: ActiveGame = {
    id: gameId,
    roomCode,
    player1: {
      userId: p1.userId,
      username: p1.username,
      score: 0,
      solvedCount: 0,
      currentQuestionIndex: 0,
      streak: 0,
      finished: false,
    },
    player2: {
      userId: p2.userId,
      username: p2.username,
      score: 0,
      solvedCount: 0,
      currentQuestionIndex: 0,
      streak: 0,
      finished: false,
    },
    questions,
    status: "in_progress",
    startedAt: Date.now(),
  };

  activeGames.set(gameId, newGame);
  p1.currentRoomId = gameId;
  p2.currentRoomId = gameId;
  p1.inMatchmaking = false;
  p2.inMatchmaking = false;

  // Remove from queue if present
  matchmakingQueue = matchmakingQueue.filter(
    (id) => id !== player1Id && id !== player2Id
  );

  const startPayload = {
    type: "game_started",
    gameId,
    roomCode,
    player1: { userId: p1.userId, username: p1.username },
    player2: { userId: p2.userId, username: p2.username },
    questions: safeQuestions,
    totalQuestions: questions.length,
    startedAt: newGame.startedAt,
    timeLimitSeconds: 90,
  };

  sendToUser(player1Id, startPayload);
  sendToUser(player2Id, startPayload);

  broadcastOnlineUsers();
  console.log(`🎮 Game started: ${p1.username} vs ${p2.username} (ID: ${gameId})`);
}

// Helper: End a game and persist to database
async function finishGame(game: ActiveGame, forfeitUserId?: string) {
  if (game.status === "completed" || game.status === "cancelled") return;

  game.status = "completed";

  let winnerId: string | null = null;
  if (forfeitUserId) {
    winnerId =
      forfeitUserId === game.player1.userId
        ? game.player2.userId
        : game.player1.userId;
  } else {
    if (game.player1.score > game.player2.score) {
      winnerId = game.player1.userId;
    } else if (game.player2.score > game.player1.score) {
      winnerId = game.player2.userId;
    } else {
      // Tie breaker: higher solved count
      if (game.player1.solvedCount > game.player2.solvedCount) {
        winnerId = game.player1.userId;
      } else if (game.player2.solvedCount > game.player1.solvedCount) {
        winnerId = game.player2.userId;
      } else {
        winnerId = null; // Draw
      }
    }
  }

  game.winnerId = winnerId;

  const resultPayload = {
    type: "game_over",
    gameId: game.id,
    winnerId,
    isDraw: winnerId === null,
    forfeited: Boolean(forfeitUserId),
    player1: game.player1,
    player2: game.player2,
  };

  sendToUser(game.player1.userId, resultPayload);
  sendToUser(game.player2.userId, resultPayload);

  // Clear room assignments
  const p1 = onlineUsers.get(game.player1.userId);
  const p2 = onlineUsers.get(game.player2.userId);
  if (p1) p1.currentRoomId = undefined;
  if (p2) p2.currentRoomId = undefined;

  broadcastOnlineUsers();

  // Save to database asynchronously
  try {
    await prisma.game.create({
      data: {
        id: game.id,
        user1Id: game.player1.userId,
        user2Id: game.player2.userId,
        user1SolvedCount: game.player1.solvedCount,
        user2SolvedCount: game.player2.solvedCount,
        status: "COMPLETED",
        winnerId: winnerId,
        startedAt: new Date(game.startedAt),
        finishedAt: new Date(),
      },
    });
    console.log(`💾 Saved game record to database: ${game.id}`);
  } catch (err) {
    console.warn("Notice: could not save game record to DB (ignoring gracefully):", err);
  }
}

wss.on("connection", (socket: WebSocket) => {
  let authenticatedUserId: string | null = null;

  socket.on("message", async (rawEvent) => {
    try {
      const data = JSON.parse(rawEvent.toString());

      // 1. Authenticate WebSocket Connection
      if (data.type === "connect") {
        const token = data.token;
        const decoded = verifyJWT(token, JWT_SECRET);

        if (!decoded || !decoded.userId) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Authentication failed. Invalid or expired token.",
            })
          );
          socket.close();
          return;
        }

        authenticatedUserId = decoded.userId;

        onlineUsers.set(authenticatedUserId, {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          socket,
        });

        socket.send(
          JSON.stringify({
            type: "connected",
            message: "Successfully connected to game server",
            user: {
              userId: decoded.userId,
              username: decoded.username,
              email: decoded.email,
            },
          })
        );

        console.log(`👤 User connected: ${decoded.username} (${decoded.userId})`);
        broadcastOnlineUsers();
        return;
      }

      if (!authenticatedUserId) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Unauthorized. Please authenticate first.",
          })
        );
        return;
      }

      const currentUser = onlineUsers.get(authenticatedUserId);
      if (!currentUser) return;

      // 2. Matchmaking: Quick Match
      if (data.type === "find_match") {
        if (currentUser.currentRoomId) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "You are already in a game.",
            })
          );
          return;
        }

        // Check if someone else is already waiting
        const opponentId = matchmakingQueue.find((id) => id !== authenticatedUserId);

        if (opponentId) {
          matchmakingQueue = matchmakingQueue.filter((id) => id !== opponentId);
          await startMatch(opponentId, authenticatedUserId);
        } else {
          if (!matchmakingQueue.includes(authenticatedUserId)) {
            matchmakingQueue.push(authenticatedUserId);
          }
          currentUser.inMatchmaking = true;
          socket.send(
            JSON.stringify({
              type: "matchmaking_queued",
              message: "Searching for an opponent...",
            })
          );
          broadcastOnlineUsers();
        }
        return;
      }

      // 3. Cancel Matchmaking
      if (data.type === "cancel_match") {
        matchmakingQueue = matchmakingQueue.filter((id) => id !== authenticatedUserId);
        currentUser.inMatchmaking = false;
        socket.send(
          JSON.stringify({
            type: "matchmaking_cancelled",
            message: "Matchmaking cancelled.",
          })
        );
        broadcastOnlineUsers();
        return;
      }

      // 4. Create Private Custom Lobby
      if (data.type === "create_room") {
        const roomCode =
          data.roomCode ||
          Math.random().toString(36).substring(2, 8).toUpperCase();

        const gameId = `room_${roomCode}`;
        const questions = generateQues(10);

        const newGame: ActiveGame = {
          id: gameId,
          roomCode,
          player1: {
            userId: currentUser.userId,
            username: currentUser.username,
            score: 0,
            solvedCount: 0,
            currentQuestionIndex: 0,
            streak: 0,
            finished: false,
          },
          player2: {
            userId: "",
            username: "Waiting...",
            score: 0,
            solvedCount: 0,
            currentQuestionIndex: 0,
            streak: 0,
            finished: false,
          },
          questions,
          status: "waiting",
          startedAt: 0,
        };

        activeGames.set(gameId, newGame);
        currentUser.currentRoomId = gameId;

        socket.send(
          JSON.stringify({
            type: "room_created",
            roomCode,
            gameId,
            message: `Room ${roomCode} created! Share this code with a friend.`,
          })
        );
        return;
      }

      // 5. Join Private Custom Lobby
      if (data.type === "join_room") {
        const roomCode = (data.roomCode || "").toUpperCase().trim();
        const game = Array.from(activeGames.values()).find(
          (g) => g.roomCode === roomCode && g.status === "waiting"
        );

        if (!game) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Room not found or game already started.",
            })
          );
          return;
        }

        if (game.player1.userId === authenticatedUserId) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "You cannot join your own room as opponent.",
            })
          );
          return;
        }

        await startMatch(game.player1.userId, authenticatedUserId, roomCode);
        return;
      }

      // 6. Direct 1v1 Challenge
      if (data.type === "send_challenge") {
        const targetUserId = data.targetUserId;
        const targetUser = onlineUsers.get(targetUserId);

        if (!targetUser) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "User is offline.",
            })
          );
          return;
        }

        if (targetUser.currentRoomId) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "User is currently in a match.",
            })
          );
          return;
        }

        sendToUser(targetUserId, {
          type: "challenge_received",
          fromUserId: currentUser.userId,
          fromUsername: currentUser.username,
          message: `${currentUser.username} challenged you to a 10-Question Math Duel!`,
        });

        socket.send(
          JSON.stringify({
            type: "challenge_sent",
            targetUserId,
            message: `Challenge sent to ${targetUser.username}. Waiting for response...`,
          })
        );
        return;
      }

      // 7. Respond to Challenge (Accept / Decline)
      if (data.type === "respond_challenge") {
        const { fromUserId, accepted } = data;
        const challenger = onlineUsers.get(fromUserId);

        if (!accepted) {
          if (challenger) {
            sendToUser(fromUserId, {
              type: "challenge_declined",
              fromUsername: currentUser.username,
              message: `${currentUser.username} declined your challenge.`,
            });
          }
          return;
        }

        if (challenger && !challenger.currentRoomId && !currentUser.currentRoomId) {
          await startMatch(fromUserId, authenticatedUserId);
        } else {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Could not start match. Player is no longer available.",
            })
          );
        }
        return;
      }

      // 8. Submit Answer
      if (data.type === "submit_answer") {
        const { gameId, questionIndex, answer } = data;
        const game = activeGames.get(gameId);

        if (!game || game.status !== "in_progress") {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Game is not active.",
            })
          );
          return;
        }

        const isPlayer1 = game.player1.userId === authenticatedUserId;
        const player = isPlayer1 ? game.player1 : game.player2;
        const opponent = isPlayer1 ? game.player2 : game.player1;

        const currentQuestion = game.questions[questionIndex];
        if (!currentQuestion) return;

        const isCorrect = Number(answer) === currentQuestion.ans;

        if (isCorrect) {
          player.streak += 1;
          player.solvedCount += 1;
          // Base 100 points + streak bonus + fast bonus
          const pointsEarned = 100 + player.streak * 20;
          player.score += pointsEarned;
        } else {
          player.streak = 0;
        }

        player.currentQuestionIndex = questionIndex + 1;
        if (player.currentQuestionIndex >= game.questions.length) {
          player.finished = true;
        }

        // Send individual feedback to player
        socket.send(
          JSON.stringify({
            type: "answer_result",
            questionIndex,
            isCorrect,
            correctAnswer: currentQuestion.ans,
            newScore: player.score,
            streak: player.streak,
            nextQuestionIndex: player.currentQuestionIndex,
          })
        );

        // Broadcast game update to both players
        const updatePayload = {
          type: "game_update",
          gameId,
          player1: {
            userId: game.player1.userId,
            score: game.player1.score,
            solvedCount: game.player1.solvedCount,
            currentQuestionIndex: game.player1.currentQuestionIndex,
            finished: game.player1.finished,
          },
          player2: {
            userId: game.player2.userId,
            score: game.player2.score,
            solvedCount: game.player2.solvedCount,
            currentQuestionIndex: game.player2.currentQuestionIndex,
            finished: game.player2.finished,
          },
          lastAnswerBy: player.userId,
          wasCorrect: isCorrect,
        };

        sendToUser(game.player1.userId, updatePayload);
        sendToUser(game.player2.userId, updatePayload);

        // Check if both players finished
        if (game.player1.finished && game.player2.finished) {
          await finishGame(game);
        }
        return;
      }

      // 9. Leave / Forfeit Game
      if (data.type === "leave_game") {
        const { gameId } = data;
        const game = activeGames.get(gameId);
        if (game && game.status === "in_progress") {
          await finishGame(game, authenticatedUserId);
        }
        return;
      }

      // 10. Request Rematch
      if (data.type === "request_rematch") {
        const { gameId } = data;
        const game = activeGames.get(gameId);
        if (!game) return;

        const opponentId =
          game.player1.userId === authenticatedUserId
            ? game.player2.userId
            : game.player1.userId;

        if (game.rematchRequestedBy === opponentId) {
          // Opponent already requested rematch, start fresh game!
          game.rematchRequestedBy = null;
          await startMatch(game.player1.userId, game.player2.userId);
        } else {
          game.rematchRequestedBy = authenticatedUserId;
          sendToUser(opponentId, {
            type: "rematch_offered",
            fromUserId: authenticatedUserId,
            fromUsername: currentUser.username,
            message: `${currentUser.username} wants a rematch!`,
          });
          socket.send(
            JSON.stringify({
              type: "rematch_sent",
              message: "Rematch offer sent to opponent.",
            })
          );
        }
        return;
      }
    } catch (err) {
      console.error("Error processing websocket message:", err);
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  });

  socket.on("close", async () => {
    if (authenticatedUserId) {
      const user = onlineUsers.get(authenticatedUserId);
      if (user) {
        // Remove from matchmaking
        matchmakingQueue = matchmakingQueue.filter((id) => id !== authenticatedUserId);

        // Forfeit any active game
        if (user.currentRoomId) {
          const game = activeGames.get(user.currentRoomId);
          if (game && game.status === "in_progress") {
            await finishGame(game, authenticatedUserId);
          }
        }

        onlineUsers.delete(authenticatedUserId);
        console.log(`❌ User disconnected: ${user.username} (${authenticatedUserId})`);
        broadcastOnlineUsers();
      }
    }
  });
});

console.log(`⚡ WebSocket Server running on ws://localhost:${PORT}`);