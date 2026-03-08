"use client";

import { useRouter } from "next/navigation";
import type { Player } from "@/lib/database.types";
import { formatAmountExact, formatAmount } from "@/lib/currency";
import { clearRoomSession } from "@/lib/roomSession";

type Props = { players: Player[]; roomCode: string };

export function GameOverModal({ players, roomCode }: Props) {
  const router = useRouter();

  function handleBackToHome() {
    clearRoomSession(roomCode);
    router.push("/");
  }
  const ranked = [...players]
    .filter((p) => !p.is_bankrupt)
    .sort((a, b) => b.balance - a.balance);
  const bankrupt = players.filter((p) => p.is_bankrupt === true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-amber-500/40 dark:border-amber-500/50 p-6 shadow-xl dark:shadow-xl max-h-[85vh] overflow-auto">
        <h2 className="text-2xl font-bold text-center text-amber-700 dark:text-amber-400 mb-2">
          המשחק נגמר
        </h2>
        <p className="text-center text-slate-600 dark:text-gray-400 text-sm mb-4">
          דירוג סופי לפי יתרה
        </p>
        <ol className="space-y-2 list-decimal list-inside">
          {ranked.map((p, i) => (
            <li
              key={p.id}
              className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/80 border border-amber-500/30"
            >
              <span className="font-medium text-slate-900 dark:text-white">
                {i + 1}. {p.name}
              </span>
              <span className="tabular-nums text-amber-600 dark:text-yellow-400 font-semibold">
                {formatAmountExact(p.balance)} ש&quot;ח ({formatAmount(p.balance)})
              </span>
            </li>
          ))}
        </ol>
        {bankrupt.length > 0 && (
          <p className="text-center text-slate-600 dark:text-gray-400 text-sm mt-3">
            פשטו רגל: {bankrupt.map((p) => p.name).join(", ")}
          </p>
        )}
        <button
          type="button"
          onClick={handleBackToHome}
          className="mt-6 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium"
        >
          חזור למסך הראשי
        </button>
      </div>
    </div>
  );
}
