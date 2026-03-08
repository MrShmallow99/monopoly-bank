"use client";

import type { Player } from "@/lib/database.types";

type Props = {
  players: Player[];
  onClose: () => void;
};

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

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
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded" title="מנהל החדר">
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

export { UsersIcon };
