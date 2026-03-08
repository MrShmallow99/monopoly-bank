"use client";

import type { Player, Transaction } from "@/lib/database.types";
import { formatAmount, getBankId } from "@/lib/currency";
import { sanitizeDisplayText } from "@/lib/sanitize";

type Props = {
  transactions: Transaction[];
  players: Player[];
  currentPlayerId: string;
  className?: string;
};

const BANK_LABEL = "הבנק";

export function Ledger({ transactions, players, currentPlayerId, className }: Props) {
  const getPlayerName = (id: string) => {
    if (id === getBankId()) return BANK_LABEL;
    const name = players.find((p) => p.id === id)?.name ?? "שחקן";
    return sanitizeDisplayText(name);
  };

  return (
    <section className={`bg-white dark:bg-slate-800 border-t border-amber-500/40 dark:border-amber-500/50 flex flex-col min-h-0 safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none ${className ?? ""}`}>
      <h2 className="shrink-0 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-slate-600 dark:text-gray-400 bg-white dark:bg-slate-800 border-b border-amber-500/30">
        היסטוריית פעולות
      </h2>
      <div className="overflow-y-auto ledger-scroll flex-1 min-h-0">
        {transactions.length === 0 ? (
          <p className="p-3 sm:p-4 text-slate-500 dark:text-gray-400 text-xs sm:text-sm text-center">אין פעולות עדיין</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-amber-500/20">
            {transactions.map((tx) => (
              <LedgerItem
                key={tx.id}
                tx={tx}
                getPlayerName={getPlayerName}
                currentPlayerId={currentPlayerId}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function LedgerItem({
  tx,
  getPlayerName,
  currentPlayerId,
}: {
  tx: Transaction;
  getPlayerName: (id: string) => string;
  currentPlayerId: string;
}) {
  const fromName = getPlayerName(tx.from_player);
  const toName = getPlayerName(tx.to_player);
  const isIncoming = tx.to_player === currentPlayerId;
  const isOutgoing = tx.from_player === currentPlayerId;
  const desc = tx.description || (fromName === BANK_LABEL ? `קבלה מ${BANK_LABEL}` : toName === BANK_LABEL ? `תשלום ל${BANK_LABEL}` : null);

  let text: string;
  let styleClass = isIncoming ? "text-green-600 dark:text-green-400" : isOutgoing ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-gray-300";
  if (desc === "פשיטת רגל") {
    text = `🚨 ${toName} פשט/ה רגל`;
    styleClass = "text-amber-600 dark:text-amber-400 font-medium";
  } else if (desc === "הוחזר לחיים") {
    text = `✨ ${toName} הוחזר/ה לחיים (${formatAmount(tx.amount)})`;
    styleClass = "text-green-600 dark:text-green-400 font-medium";
  } else if (desc === "דרך צלחה") {
    text = `${toName} קיבל/ה ${formatAmount(tx.amount)} (דרך צלחה)`;
  } else if (tx.from_player === getBankId() && tx.to_player !== getBankId()) {
    text = `${toName} קיבל/ה ${formatAmount(tx.amount)} מהבנק`;
  } else if (tx.to_player === getBankId()) {
    text = `${fromName} שילם/ה ${formatAmount(tx.amount)} לבנק`;
  } else {
    text = `${fromName} העביר/ה ${formatAmount(tx.amount)} ל${toName}`;
  }

  return (
    <li
      className={`px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm ${styleClass}`}
    >
      {text}
    </li>
  );
}
