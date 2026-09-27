import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useGame } from "../context/GameContext.js";
import { sounds } from "../utils/audio.js";
import {
  Zap,
  Volume2,
  VolumeX,
  Users,
  LogOut,
  Trophy,
  History,
  Target,
  Sparkles,
  UserCheck,
} from "lucide-react";

interface NavbarProps {
  onOpenAuth: (mode: "login" | "register") => void;
  activeTab: "arena" | "leaderboard" | "history" | "practice";
  setActiveTab: (tab: "arena" | "leaderboard" | "history" | "practice") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  activeTab,
  setActiveTab,
}) => {
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers } = useGame();
  const [soundOn, setSoundOn] = useState(true);

  const handleToggleSound = () => {
    const isNowOn = sounds.toggleSound();
    setSoundOn(isNowOn);
    if (isNowOn) sounds.playClick();
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab("arena")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-black fill-black" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400/20 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-xl tracking-tight">
              <span className="text-white">MATH</span>
              <span className="neon-text-cyan">BLITZ</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                1v1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-mono">
              Multiplayer Speed Arena
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab("arena");
              sounds.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "arena"
                ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Arena
          </button>

          <button
            onClick={() => {
              setActiveTab("practice");
              sounds.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "practice"
                ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Target className="w-4 h-4" />
            Solo Training
          </button>

          <button
            onClick={() => {
              setActiveTab("leaderboard");
              sounds.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "leaderboard"
                ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>

          {user && (
            <button
              onClick={() => {
                setActiveTab("history");
                sounds.playClick();
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <History className="w-4 h-4" />
              My History
            </button>
          )}
        </div>

        {/* Right Tools & User Info */}
        <div className="flex items-center gap-3">
          {/* Live Online Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">
              {onlineUsers.length} Online
            </span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label="Toggle Sound"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-md shadow-indigo-500/20">
                  {user.username.substring(0, 2)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-white leading-tight">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <UserCheck className="w-2.5 h-2.5" />
                    Online
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  logout();
                }}
                title="Logout"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("login");
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("register");
                }}
                className="px-4 py-1.5 text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg shadow-md shadow-cyan-500/20 hover:scale-[1.02] transition-all"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
