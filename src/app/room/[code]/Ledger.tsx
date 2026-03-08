"use client";

import type { Player, Transaction } from "@/lib/database.types";
import { formatAmount, getBankId } from "@/lib/currency";

type Props = {
  transactions: Transaction[];
  players: Player[];
  currentPlayerId: string;
};

const BANK_LABEL = "הבנק";

export function Ledger({ transactions, players, currentPlayerId }: Props) {
  const getPlayerName = (id: string) => {
    if (id === getBankId()) return BANK_LABEL;
    return players.find((p) => p.id === id)?.name ?? "שחקן";
  };

  return (
    <section className="bg-monopoly-dark-card border-t border-monopoly-green/30 flex flex-col max-h-[40vh] safe-bottom">
      <h2 className="px-4 py-3 text-sm font-semibold text-gray-400 sticky top-0 bg-monopoly-dark-card border-b border-monopoly-green/20">
        היסטוריית פעולות
      </h2>
      <div className="overflow-y-auto ledger-scroll flex-1 min-h-0">
        {transactions.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm text-center">אין פעולות עדיין</p>
        ) : (
          <ul className="divide-y divide-monopoly-green/10">
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
  if (desc === "דרך צלחה") {
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
      className={`px-4 py-3 text-sm ${
        isIncoming ? "text-monopoly-green-light" : isOutgoing ? "text-red-300/90" : "text-gray-300"
      }`}
    >
      {text}
    </li>
  );
}
