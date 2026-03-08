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
      <div className="w-full max-w-md bg-monopoly-light-card dark:bg-monopoly-dark-card rounded-2xl border border-monopoly-light-border dark:border-monopoly-green/30 p-6 shadow-xl max-h-[85vh] overflow-auto">
        <h2 className="text-2xl font-bold text-center text-monopoly-green dark:text-monopoly-gold mb-2">
          המשחק נגמר
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-4">
          דירוג סופי לפי יתרה
        </p>
        <ol className="space-y-2 list-decimal list-inside">
          {ranked.map((p, i) => (
            <li
              key={p.id}
              className="flex justify-between items-center py-2 px-3 rounded-xl bg-monopoly-light-bg dark:bg-monopoly-dark border border-monopoly-light-border dark:border-monopoly-green/20"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {i + 1}. {p.name}
              </span>
              <span className="tabular-nums text-monopoly-green dark:text-monopoly-green-light font-semibold">
                {formatAmountExact(p.balance)} ש&quot;ח ({formatAmount(p.balance)})
              </span>
            </li>
          ))}
        </ol>
        {bankrupt.length > 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-3">
            פשטו רגל: {bankrupt.map((p) => p.name).join(", ")}
          </p>
        )}
        <button
          type="button"
          onClick={handleBackToHome}
          className="mt-6 w-full py-3 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-medium"
        >
          חזור למסך הראשי
        </button>
      </div>
    </div>
  );
}
