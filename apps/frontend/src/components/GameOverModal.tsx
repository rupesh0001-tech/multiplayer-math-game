import React from "react";
import { useAuth } from "../context/AuthContext.js";
import { useGame } from "../context/GameContext.js";
import { sounds } from "../utils/audio.js";
import {
  Trophy,
  RotateCcw,
  Home,
  CheckCircle2,
  Zap,
  Target,
  Sparkles,
  Flame,
} from "lucide-react";

export const GameOverModal: React.FC = () => {
  const { user } = useAuth();
  const {
    gameStatus,
    gameOverResult,
    activeGame,
    requestRematch,
    rematchOffered,
    resetGameToLobby,
  } = useGame();

  if (gameStatus !== "game_over" || !gameOverResult || !activeGame) return null;

  const isPlayer1 = activeGame.player1.userId === user?.id;
  const myPlayer = isPlayer1 ? gameOverResult.player1 : gameOverResult.player2;
  const oppPlayer = isPlayer1 ? gameOverResult.player2 : gameOverResult.player1;
  const myUsername = isPlayer1 ? activeGame.player1.username : activeGame.player2.username;
  const oppUsername = isPlayer1 ? activeGame.player2.username : activeGame.player1.username;

  const isWinner = gameOverResult.winnerId === user?.id;
  const isDraw = gameOverResult.isDraw;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg glass-panel-glow rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl text-center">
        {/* Banner Graphic */}
        <div className="mb-6">
          {isWinner ? (
            <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-xl shadow-yellow-500/10 animate-bounce">
              <Trophy className="w-12 h-12" />
            </div>
          ) : isDraw ? (
            <div className="inline-flex p-4 rounded-3xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-2">
              <Sparkles className="w-12 h-12" />
            </div>
          ) : (
            <div className="inline-flex p-4 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-2">
              <Target className="w-12 h-12" />
            </div>
          )}

          <h2
            className={`text-3xl sm:text-4xl font-black tracking-tight mt-2 ${
              isWinner
                ? "neon-text-cyan"
                : isDraw
                ? "text-indigo-300"
                : "text-slate-300"
            }`}
          >
            {isWinner
              ? "VICTORY!"
              : isDraw
              ? "TIED MATCH!"
              : "DEFEAT"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {gameOverResult.forfeited
              ? "Match concluded by player forfeit."
              : "Final score comparison calculated."}
          </p>
        </div>

        {/* Dual Player Card Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* You */}
          <div
            className={`p-4 rounded-2xl border text-left transition-all ${
              isWinner
                ? "bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                : "bg-slate-900/80 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">
                You
              </span>
              {isWinner && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold font-mono">
                  WINNER 👑
                </span>
              )}
            </div>
            <div className="text-sm font-extrabold text-white truncate">
              {myUsername}
            </div>
            <div className="text-2xl font-black font-mono text-cyan-300 mt-1">
              {myPlayer.score} <span className="text-xs font-normal text-slate-400">pts</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Solved:</span>
              <span className="font-bold text-white">
                {myPlayer.solvedCount} / {activeGame.totalQuestions}
              </span>
            </div>
          </div>

          {/* Opponent */}
          <div
            className={`p-4 rounded-2xl border text-left transition-all ${
              !isWinner && !isDraw
                ? "bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/10"
                : "bg-slate-900/80 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono font-bold text-rose-400">
                Opponent
              </span>
              {!isWinner && !isDraw && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold font-mono">
                  WINNER 👑
                </span>
              )}
            </div>
            <div className="text-sm font-extrabold text-white truncate">
              {oppUsername}
            </div>
            <div className="text-2xl font-black font-mono text-rose-300 mt-1">
              {oppPlayer.score} <span className="text-xs font-normal text-slate-400">pts</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Solved:</span>
              <span className="font-bold text-white">
                {oppPlayer.solvedCount} / {activeGame.totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* Rematch Offered Notice */}
        {rematchOffered && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono animate-pulse">
            ⚔️ Opponent requested a rematch! Click Rematch to duel again.
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              requestRematch();
            }}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            {rematchOffered ? "Accept Rematch" : "Request Rematch"}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              resetGameToLobby();
            }}
            className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
