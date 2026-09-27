import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext.js";
import { sounds } from "../utils/audio.js";
import confetti from "canvas-confetti";

export interface SafeQuestion {
  id: string;
  op1: number;
  op2: number;
  operand: string;
  que: string;
}

export interface OnlineUserItem {
  userId: string;
  username: string;
  inGame: boolean;
  inQueue: boolean;
}

export interface PlayerProgress {
  userId: string;
  username?: string;
  score: number;
  solvedCount: number;
  currentQuestionIndex: number;
  finished: boolean;
  streak?: number;
}

export interface ActiveGameData {
  gameId: string;
  roomCode?: string;
  player1: { userId: string; username: string };
  player2: { userId: string; username: string };
  questions: SafeQuestion[];
  totalQuestions: number;
  startedAt: number;
  timeLimitSeconds: number;
}

export interface GameOverResult {
  gameId: string;
  winnerId: string | null;
  isDraw: boolean;
  forfeited: boolean;
  player1: PlayerProgress;
  player2: PlayerProgress;
}

interface GameContextType {
  isConnected: boolean;
  onlineUsers: OnlineUserItem[];
  matchmakingStatus: "idle" | "queued" | "matched";
  gameStatus: "idle" | "countdown" | "playing" | "game_over";
  activeGame: ActiveGameData | null;
  myProgress: PlayerProgress;
  opponentProgress: PlayerProgress;
  lastFeedback: { isCorrect: boolean; correctAnswer?: number } | null;
  gameOverResult: GameOverResult | null;
  incomingChallenge: { fromUserId: string; fromUsername: string; message: string } | null;
  outgoingChallengeUser: string | null;
  rematchOffered: boolean;
  roomCreatedCode: string | null;
  findMatch: () => void;
  cancelMatch: () => void;
  createRoom: (roomCode?: string) => void;
  joinRoom: (roomCode: string) => void;
  sendChallenge: (targetUserId: string) => void;
  respondChallenge: (accepted: boolean) => void;
  submitAnswer: (questionIndex: number, answer: number | string) => void;
  leaveGame: () => void;
  requestRematch: () => void;
  resetGameToLobby: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserItem[]>([]);
  const [matchmakingStatus, setMatchmakingStatus] = useState<"idle" | "queued" | "matched">("idle");
  const [gameStatus, setGameStatus] = useState<"idle" | "countdown" | "playing" | "game_over">("idle");
  const [activeGame, setActiveGame] = useState<ActiveGameData | null>(null);

  const [myProgress, setMyProgress] = useState<PlayerProgress>({
    userId: "",
    score: 0,
    solvedCount: 0,
    currentQuestionIndex: 0,
    finished: false,
    streak: 0,
  });

  const [opponentProgress, setOpponentProgress] = useState<PlayerProgress>({
    userId: "",
    score: 0,
    solvedCount: 0,
    currentQuestionIndex: 0,
    finished: false,
  });

  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; correctAnswer?: number } | null>(null);
  const [gameOverResult, setGameOverResult] = useState<GameOverResult | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<{ fromUserId: string; fromUsername: string; message: string } | null>(null);
  const [outgoingChallengeUser, setOutgoingChallengeUser] = useState<string | null>(null);
  const [rematchOffered, setRematchOffered] = useState(false);
  const [roomCreatedCode, setRoomCreatedCode] = useState<string | null>(null);

  // Connect to WebSocket Server
  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const wsUrl = `ws://${window.location.hostname}:8080`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Authenticate with JWT token
      ws.send(JSON.stringify({ type: "connect", token }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "connected":
            console.log("Connected to game server:", data.user);
            break;

          case "online_users_update":
            setOnlineUsers(data.users || []);
            break;

          case "matchmaking_queued":
            setMatchmakingStatus("queued");
            sounds.playClick();
            break;

          case "matchmaking_cancelled":
            setMatchmakingStatus("idle");
            break;

          case "room_created":
            setRoomCreatedCode(data.roomCode);
            break;

          case "challenge_received":
            setIncomingChallenge({
              fromUserId: data.fromUserId,
              fromUsername: data.fromUsername,
              message: data.message,
            });
            sounds.playCountdown();
            break;

          case "challenge_sent":
            setOutgoingChallengeUser(data.targetUserId);
            break;

          case "challenge_declined":
            setOutgoingChallengeUser(null);
            alert(data.message || "Challenge was declined.");
            break;

          case "game_started":
            setMatchmakingStatus("matched");
            setIncomingChallenge(null);
            setOutgoingChallengeUser(null);
            setRoomCreatedCode(null);
            setGameOverResult(null);
            setRematchOffered(false);

            setActiveGame({
              gameId: data.gameId,
              roomCode: data.roomCode,
              player1: data.player1,
              player2: data.player2,
              questions: data.questions,
              totalQuestions: data.totalQuestions,
              startedAt: data.startedAt,
              timeLimitSeconds: data.timeLimitSeconds,
            });

            const isP1 = data.player1.userId === user.id;
            const myInfo = isP1 ? data.player1 : data.player2;
            const oppInfo = isP1 ? data.player2 : data.player1;

            setMyProgress({
              userId: myInfo.userId,
              username: myInfo.username,
              score: 0,
              solvedCount: 0,
              currentQuestionIndex: 0,
              finished: false,
              streak: 0,
            });

            setOpponentProgress({
              userId: oppInfo.userId,
              username: oppInfo.username,
              score: 0,
              solvedCount: 0,
              currentQuestionIndex: 0,
              finished: false,
            });

            setGameStatus("countdown");
            sounds.playCountdown();

            setTimeout(() => {
              setGameStatus("playing");
              sounds.playCountdown(true);
            }, 2500);
            break;

          case "answer_result":
            setLastFeedback({
              isCorrect: data.isCorrect,
              correctAnswer: data.correctAnswer,
            });

            setMyProgress((prev) => ({
              ...prev,
              score: data.newScore,
              streak: data.streak,
              currentQuestionIndex: data.nextQuestionIndex,
              solvedCount: data.isCorrect ? prev.solvedCount + 1 : prev.solvedCount,
              finished: data.nextQuestionIndex >= (activeGame?.totalQuestions || 10),
            }));

            if (data.isCorrect) {
              sounds.playCorrect();
            } else {
              sounds.playWrong();
            }
            break;

          case "game_update":
            if (activeGame) {
              const isP1 = activeGame.player1.userId === user.id;
              const oppData = isP1 ? data.player2 : data.player1;
              setOpponentProgress((prev) => ({
                ...prev,
                score: oppData.score,
                solvedCount: oppData.solvedCount,
                currentQuestionIndex: oppData.currentQuestionIndex,
                finished: oppData.finished,
              }));
            }
            break;

          case "game_over":
            setGameStatus("game_over");
            setGameOverResult(data);

            if (data.winnerId === user.id) {
              sounds.playVictory();
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
              });
            } else {
              sounds.playWrong();
            }
            break;

          case "rematch_offered":
            setRematchOffered(true);
            break;

          case "error":
            console.error("Game Server Error:", data.message);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [token, user]);

  const sendWS = (payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  const findMatch = () => {
    sendWS({ type: "find_match" });
  };

  const cancelMatch = () => {
    sendWS({ type: "cancel_match" });
    setMatchmakingStatus("idle");
  };

  const createRoom = (roomCode?: string) => {
    sendWS({ type: "create_room", roomCode });
  };

  const joinRoom = (roomCode: string) => {
    sendWS({ type: "join_room", roomCode });
  };

  const sendChallenge = (targetUserId: string) => {
    sendWS({ type: "send_challenge", targetUserId });
  };

  const respondChallenge = (accepted: boolean) => {
    if (incomingChallenge) {
      sendWS({
        type: "respond_challenge",
        fromUserId: incomingChallenge.fromUserId,
        accepted,
      });
      setIncomingChallenge(null);
    }
  };

  const submitAnswer = (questionIndex: number, answer: number | string) => {
    if (activeGame) {
      sendWS({
        type: "submit_answer",
        gameId: activeGame.gameId,
        questionIndex,
        answer,
      });
    }
  };

  const leaveGame = () => {
    if (activeGame) {
      sendWS({ type: "leave_game", gameId: activeGame.gameId });
    }
    resetGameToLobby();
  };

  const requestRematch = () => {
    if (activeGame) {
      sendWS({ type: "request_rematch", gameId: activeGame.gameId });
    }
  };

  const resetGameToLobby = () => {
    setGameStatus("idle");
    setActiveGame(null);
    setGameOverResult(null);
    setLastFeedback(null);
    setMatchmakingStatus("idle");
    setRematchOffered(false);
  };

  return (
    <GameContext.Provider
      value={{
        isConnected,
        onlineUsers,
        matchmakingStatus,
        gameStatus,
        activeGame,
        myProgress,
        opponentProgress,
        lastFeedback,
        gameOverResult,
        incomingChallenge,
        outgoingChallengeUser,
        rematchOffered,
        roomCreatedCode,
        findMatch,
        cancelMatch,
        createRoom,
        joinRoom,
        sendChallenge,
        respondChallenge,
        submitAnswer,
        leaveGame,
        requestRematch,
        resetGameToLobby,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
