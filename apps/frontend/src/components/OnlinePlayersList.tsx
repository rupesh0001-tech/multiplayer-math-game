import React from "react";
import { useAuth } from "../context/AuthContext.js";
import { useGame } from "../context/GameContext.js";
import { sounds } from "../utils/audio.js";
import { Users, Swords, Clock, Gamepad2, Shield } from "lucide-react";

export const OnlinePlayersList: React.FC = () => {
  const { user } = useAuth();
  const { onlineUsers, sendChallenge, outgoingChallengeUser } = useGame();

  const otherUsers = onlineUsers.filter((u) => u.userId !== user?.id);

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-white">Online Rivals</h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {onlineUsers.length} active
        </span>
      </div>

      {otherUsers.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No other rivals online right now.</p>
          <p className="mt-1 text-[11px] text-slate-600">
            Open another browser tab to challenge yourself or invite a friend!
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {otherUsers.map((player) => {
            const isChallengingThis = outgoingChallengeUser === player.userId;

            return (
              <div
                key={player.userId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-850 border border-slate-800/60 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase">
                      {player.username.substring(0, 2)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                        player.inGame
                          ? "bg-amber-400"
                          : player.inQueue
                          ? "bg-purple-400 animate-pulse"
                          : "bg-emerald-400"
                      }`}
                    />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {player.username}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {player.inGame
                        ? "In Match ⚔️"
                        : player.inQueue
                        ? "Searching 🔍"
                        : "Ready to Duel"}
                    </div>
                  </div>
                </div>

                <div>
                  {player.inGame ? (
                    <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-800 text-slate-400 flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" />
                      Busy
                    </span>
                  ) : isChallengingThis ? (
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3" />
                      Waiting
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        sendChallenge(player.userId);
                      }}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/40 hover:to-indigo-500/40 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      Duel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
