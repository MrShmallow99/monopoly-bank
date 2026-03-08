"use client";

import { Crown } from "lucide-react";
import type { Player } from "@/lib/database.types";

type Props = {
  players: Player[];
  onClose: () => void;
};

export function PlayersModal({ players, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-monopoly-light-card dark:bg-monopoly-dark-card rounded-t-2xl sm:rounded-2xl border-t sm:border border-monopoly-light-border dark:border-monopoly-green/30 shadow-xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-monopoly-light-border dark:border-monopoly-green/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">שחקנים בחדר</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>
        <ul className="overflow-y-auto flex-1 p-4 space-y-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 py-2 px-3 rounded-xl bg-monopoly-light-bg dark:bg-monopoly-dark border border-monopoly-light-border dark:border-monopoly-green/20"
            >
              <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
              {p.is_banker && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded" title="מנהל החדר">
                  <Crown className="w-3.5 h-3.5" aria-hidden />
                  מנהל
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
