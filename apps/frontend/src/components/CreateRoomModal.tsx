import React, { useState } from "react";
import { useGame } from "../context/GameContext.js";
import { sounds } from "../utils/audio.js";
import { X, KeyRound, Copy, Check, ArrowRight, Sparkles } from "lucide-react";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createRoom, joinRoom, roomCreatedCode } = useGame();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    sounds.playClick();
    createRoom();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    sounds.playClick();
    joinRoom(inputCode.trim().toUpperCase());
    onClose();
  };

  const handleCopy = () => {
    if (roomCreatedCode) {
      sounds.playClick();
      navigator.clipboard.writeText(roomCreatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel-glow rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white">
            Private Duel Room
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Host a private room with a code or enter a friend's room code
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setTab("create");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "create"
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setTab("join");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "join"
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Join with Code
          </button>
        </div>

        {tab === "create" ? (
          <div>
            {!roomCreatedCode ? (
              <button
                onClick={handleCreate}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4" />
                Generate Room Code
              </button>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40">
                  <span className="text-[10px] uppercase font-mono text-slate-400">
                    Your Room Code
                  </span>
                  <div className="text-3xl font-black font-mono tracking-widest text-cyan-400 my-1">
                    {roomCreatedCode}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 mt-2 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-mono animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Waiting for opponent to join...
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enter 6-character Room Code
              </label>
              <input
                type="text"
                maxLength={8}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. BATTLE"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono text-lg tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!inputCode.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              <span>Join Match</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
