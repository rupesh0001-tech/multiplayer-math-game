import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useGame } from "../context/GameContext.js";
import { sounds } from "../utils/audio.js";
import {
  Flame,
  Clock,
  Swords,
  Zap,
  CheckCircle2,
  XCircle,
  Delete,
  CornerDownLeft,
  LogOut,
} from "lucide-react";

export const GameArena: React.FC = () => {
  const { user } = useAuth();
  const {
    gameStatus,
    activeGame,
    myProgress,
    opponentProgress,
    lastFeedback,
    submitAnswer,
    leaveGame,
  } = useGame();

  const [inputVal, setInputVal] = useState("");
  const [countdownNum, setCountdownNum] = useState(3);
  const [timeLeft, setTimeLeft] = useState(90);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically
  useEffect(() => {
    if (gameStatus === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameStatus, myProgress.currentQuestionIndex]);

  // Countdown timer before match starts
  useEffect(() => {
    let countTimer: any;
    if (gameStatus === "countdown") {
      setCountdownNum(3);
      countTimer = setInterval(() => {
        setCountdownNum((prev) => (prev > 1 ? prev - 1 : 1));
      }, 800);
    }
    return () => clearInterval(countTimer);
  }, [gameStatus]);

  // Match round timer
  useEffect(() => {
    let matchTimer: any;
    if (gameStatus === "playing") {
      setTimeLeft(activeGame?.timeLimitSeconds || 90);
      matchTimer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(matchTimer);
  }, [gameStatus, activeGame]);

  if (!activeGame || gameStatus === "idle") return null;

  const currentQuestion =
    activeGame.questions[myProgress.currentQuestionIndex];
  const totalQues = activeGame.totalQuestions || 10;

  const handleKeypadPress = (val: string) => {
    sounds.playClick();
    if (val === "BACKSPACE") {
      setInputVal((prev) => prev.slice(0, -1));
    } else if (val === "ENTER") {
      handleSubmit();
    } else {
      if (inputVal.length < 8) {
        setInputVal((prev) => prev + val);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || !currentQuestion) return;

    const numericAnswer = Number(inputVal.trim());
    if (isNaN(numericAnswer)) return;

    submitAnswer(myProgress.currentQuestionIndex, numericAnswer);
    setInputVal("");
  };

  const isPlayer1 = activeGame.player1.userId === user?.id;
  const myInfo = isPlayer1 ? activeGame.player1 : activeGame.player2;
  const opponentInfo = isPlayer1 ? activeGame.player2 : activeGame.player1;

  const myPercent = Math.min(100, Math.round((myProgress.currentQuestionIndex / totalQues) * 100));
  const oppPercent = Math.min(100, Math.round((opponentProgress.currentQuestionIndex / totalQues) * 100));

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 py-6">
      {/* 3... 2... 1... Countdown Overlay */}
      {gameStatus === "countdown" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="text-center">
            <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 animate-bounce">
              {countdownNum}
            </div>
            <p className="text-xl font-bold tracking-widest uppercase font-mono text-cyan-400 mt-4">
              Get Ready to Solve!
            </p>
          </div>
        </div>
      )}

      {/* 1v1 Battle Top Bar */}
      <div className="glass-panel-glow rounded-3xl p-5 mb-6 border border-slate-700/80 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          {/* You (Player 1) */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-cyan-500/20">
                {myInfo.username.substring(0, 2).toUpperCase()}
              </div>
              {(myProgress.streak || 0) >= 2 && (
                <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[10px] font-black font-mono text-white flex items-center gap-0.5 shadow-md animate-bounce">
                  <Flame className="w-3 h-3 fill-white" />
                  {myProgress.streak}x
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold">
                  YOU
                </span>
                <span className="font-extrabold text-white text-sm">
                  {myInfo.username}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-cyan-300">
                {myProgress.score} <span className="text-xs font-normal text-slate-400">pts</span>
              </div>
            </div>
          </div>

          {/* Versus Center Timer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400 shadow-inner">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mt-1">
              Duel Match
            </div>
          </div>

          {/* Opponent (Player 2) */}
          <div className="flex items-center gap-3 flex-row-reverse text-right">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tl from-rose-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-rose-500/20">
              {opponentInfo.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="font-extrabold text-white text-sm">
                  {opponentInfo.username}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-bold">
                  RIVAL
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-rose-300">
                {opponentProgress.score} <span className="text-xs font-normal text-slate-400">pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Race Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono font-bold text-slate-400">
            <span className="text-cyan-400">
              Q{Math.min(totalQues, myProgress.currentQuestionIndex + 1)} / {totalQues}
            </span>
            <span className="text-rose-400">
              Q{Math.min(totalQues, opponentProgress.currentQuestionIndex + 1)} / {totalQues}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* My Progress */}
            <div className="w-full bg-slate-900/80 rounded-full h-3 p-0.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-sm shadow-cyan-500/50"
                style={{ width: `${myPercent}%` }}
              />
            </div>
            {/* Opponent Progress */}
            <div className="w-full bg-slate-900/80 rounded-full h-3 p-0.5 border border-slate-800 flex justify-end">
              <div
                className="bg-gradient-to-l from-rose-500 to-purple-500 h-full rounded-full transition-all duration-300 shadow-sm shadow-rose-500/50"
                style={{ width: `${oppPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Equation Combat Area */}
      {myProgress.finished ? (
        <div className="glass-card rounded-3xl p-10 text-center border border-slate-700/80">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-white">All Questions Completed!</h3>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Waiting for opponent to finish calculating final scores...
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
          {/* Question Banner */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800">
              Question #{myProgress.currentQuestionIndex + 1} of {totalQues}
            </span>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to forfeit this match?")) {
                  sounds.playClick();
                  leaveGame();
                }
              }}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 font-mono"
            >
              <LogOut className="w-3.5 h-3.5" />
              Forfeit
            </button>
          </div>

          {/* Huge Math Equation Display */}
          <div className="my-6 text-center">
            <div className="inline-block py-6 px-10 rounded-3xl bg-slate-950/60 border border-slate-800 shadow-inner">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-wider text-white">
                {currentQuestion ? currentQuestion.que : "Loading..."}
              </div>
            </div>
          </div>

          {/* Feedback Indicator */}
          {lastFeedback && (
            <div className="text-center mb-4 min-h-[24px]">
              {lastFeedback.isCorrect ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-emerald-400 animate-pop bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  Correct! +Points
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-rose-400 animate-pop bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  <XCircle className="w-4 h-4" />
                  Incorrect (Ans: {lastFeedback.correctAnswer})
                </span>
              )}
            </div>
          )}

          {/* Input & Form */}
          <form onSubmit={handleSubmit} className="max-w-xs mx-auto mb-6">
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type answer..."
                className="w-full text-center text-3xl font-black font-mono py-3.5 px-4 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 shadow-lg shadow-cyan-500/10 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 transition-colors shadow-md"
              >
                <CornerDownLeft className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </form>

          {/* On-Screen Tactile Keypad */}
          <div className="max-w-xs mx-auto grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num.toString())}
                className={`py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-mono font-bold text-lg border border-slate-800 hover:border-slate-700 active:scale-95 transition-all shadow-sm ${
                  num === 0 ? "col-span-1" : ""
                }`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleKeypadPress("BACKSPACE")}
              className="py-3.5 rounded-2xl bg-slate-900/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-800 flex items-center justify-center active:scale-95 transition-all"
            >
              <Delete className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleKeypadPress("ENTER")}
              className="py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold flex items-center justify-center active:scale-95 transition-all shadow-md shadow-cyan-500/20"
            >
              <CornerDownLeft className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
