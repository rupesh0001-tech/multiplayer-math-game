import React, { useEffect, useState } from "react";
import { useGame } from "../context/GameContext.js";
import { sounds } from "../utils/audio.js";
import { Swords, Check, X, Bell } from "lucide-react";

export const ChallengeNotification: React.FC = () => {
  const { incomingChallenge, respondChallenge } = useGame();
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    let timer: any;
    if (incomingChallenge) {
      setTimeLeft(15);
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            respondChallenge(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [incomingChallenge]);

  if (!incomingChallenge) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-bounce-short">
      <div className="glass-panel-glow rounded-2xl p-5 border border-cyan-400/50 shadow-2xl shadow-cyan-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-black shadow-lg shadow-cyan-500/20 shrink-0">
            <Swords className="w-5 h-5 fill-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold flex items-center gap-1">
                <Bell className="w-3 h-3 animate-pulse" />
                Duel Challenge
              </span>
              <span className="text-xs font-mono text-slate-400">
                {timeLeft}s
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white mt-0.5 truncate">
              {incomingChallenge.fromUsername}
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Challenged you to a 10-question rapid math duel!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => {
              sounds.playClick();
              respondChallenge(true);
            }}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Accept Duel
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              respondChallenge(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
