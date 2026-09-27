import React, { useEffect, useState } from "react";
import { useGame } from "../context/GameContext.js";
import { sounds } from "../utils/audio.js";
import { Swords, X, Loader2 } from "lucide-react";

export const MatchmakingModal: React.FC = () => {
  const { matchmakingStatus, cancelMatch } = useGame();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (matchmakingStatus === "queued") {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [matchmakingStatus]);

  if (matchmakingStatus !== "queued") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm glass-panel-glow rounded-3xl p-8 border border-cyan-500/40 text-center shadow-2xl">
        {/* Radar Animation */}
        <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
          <div className="absolute inset-2 rounded-full border border-cyan-500/30" />
          <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-25" />
          <div className="absolute w-full h-full rounded-full border-t-2 border-cyan-400 animate-spin" />
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
            <Swords className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight">
          Searching for Opponent...
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Scanning live players for an equal math duel match
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Searching: {seconds}s</span>
        </div>

        <div className="mt-6">
          <button
            onClick={() => {
              sounds.playClick();
              cancelMatch();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel Matchmaking
          </button>
        </div>
      </div>
    </div>
  );
};
