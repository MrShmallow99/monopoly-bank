"use client";

import { useState } from "react";
import { Crown, UserMinus } from "lucide-react";
import type { Player } from "@/lib/database.types";
import { sanitizeDisplayText } from "@/lib/sanitize";

type Props = {
  players: Player[];
  currentPlayerId: string;
  isBanker: boolean;
  onClose: () => void;
  onKickPlayer: (playerId: string) => void | Promise<void>;
};

export function PlayersModal({ players, currentPlayerId, isBanker, onClose, onKickPlayer }: Props) {
  const [playerToKick, setPlayerToKick] = useState<Player | null>(null);
  const [kicking, setKicking] = useState(false);

  async function handleConfirmKick() {
    if (!playerToKick) return;
    setKicking(true);
    try {
      await onKickPlayer(playerToKick.id);
      setPlayerToKick(null);
      onClose();
    } finally {
      setKicking(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
        <div
          className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl border-t sm:border border-amber-500/40 dark:border-amber-500/50 shadow-xl max-h-[70vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-amber-500/30">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">שחקנים בחדר</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-gray-300"
              aria-label="סגור"
            >
              ✕
            </button>
          </div>
          <ul className="overflow-y-auto flex-1 p-4 space-y-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/80 border border-amber-500/30"
              >
                <span className="font-medium text-slate-900 dark:text-white flex-1 min-w-0">{sanitizeDisplayText(p.name)}</span>
                {p.is_banker && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded shrink-0 border border-amber-500/40" title="מנהל החדר">
                    <Crown className="w-3.5 h-3.5" aria-hidden />
                    מנהל
                  </span>
                )}
                {isBanker && p.id !== currentPlayerId && (
                  <button
                    type="button"
                    onClick={() => setPlayerToKick(p)}
                    className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors shrink-0"
                    aria-label={`הסר את ${p.name} מהחדר`}
                    title="הסר מהחדר"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {playerToKick && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" onClick={() => setPlayerToKick(null)}>
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-amber-500/40 dark:border-amber-500/50 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">הסרת שחקן</h3>
            <p className="text-slate-600 dark:text-gray-300 text-sm mb-6">
              האם אתה בטוח שברצונך להסיר את {sanitizeDisplayText(playerToKick.name)} מהחדר?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlayerToKick(null)}
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleConfirmKick}
                disabled={kicking}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
              >
                {kicking ? "..." : "הסר"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
