"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/lib/database.types";
import {
  formatAmount,
  formatAmountExact,
  parseAmountInput,
  validateAmount,
  PASS_GO_AMOUNT,
  getBankId,
  MIN_TRANSACTION,
  MAX_TRANSACTION,
} from "@/lib/currency";

type Props = {
  roomId: string;
  currentPlayer: Player;
  otherPlayers: Player[];
  onError: (msg: string) => void;
};

export function DashboardActions({ roomId, currentPlayer, otherPlayers, onError }: Props) {
  const [modal, setModal] = useState<"transfer" | "payBank" | "receiveBank" | null>(null);
  const [transferToId, setTransferToId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [loading, setLoading] = useState(false);

  function clearModal() {
    setModal(null);
    setTransferToId("");
    setAmountStr("");
    onError("");
  }

  async function handlePassGo() {
    setLoading(true);
    onError("");
    try {
      if (!supabase) return;
      const { error: txErr } = await supabase.from("transactions").insert({
        room_id: roomId,
        from_player: getBankId(),
        to_player: currentPlayer.id,
        amount: PASS_GO_AMOUNT,
        description: "דרך צלחה",
      });
      if (txErr) throw txErr;
      const newBalance = currentPlayer.balance + PASS_GO_AMOUNT;
      const { error: upErr } = await supabase
        .from("players")
        .update({ balance: newBalance })
        .eq("id", currentPlayer.id);
      if (upErr) throw upErr;
    } catch (e) {
      onError("הפעולה נכשלה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer() {
    if (!transferToId) {
      onError("נא לבחור שחקן.");
      return;
    }
    const amount = parseAmountInput(amountStr);
    if (amount === null) {
      onError(`הזן סכום בין ${formatAmount(MIN_TRANSACTION)} ל־${formatAmount(MAX_TRANSACTION)} (למשל 1.5M או 500K)`);
      return;
    }
    const validation = validateAmount(amount);
    if (!validation.valid) {
      onError(validation.error);
      return;
    }
    if (currentPlayer.balance < amount) {
      onError("אין מספיק יתרה.");
      return;
    }
    const toPlayer = otherPlayers.find((p) => p.id === transferToId);
    if (!toPlayer) {
      onError("שחקן לא נמצא.");
      return;
    }
    setLoading(true);
    onError("");
    try {
      if (!supabase) return;
      const { error: txErr } = await supabase.from("transactions").insert({
        room_id: roomId,
        from_player: currentPlayer.id,
        to_player: transferToId,
        amount,
        description: null,
      });
      if (txErr) throw txErr;
      if (!supabase) return;
      await supabase
        .from("players")
        .update({ balance: currentPlayer.balance - amount })
        .eq("id", currentPlayer.id);
      await supabase
        .from("players")
        .update({ balance: toPlayer.balance + amount })
        .eq("id", transferToId);
      clearModal();
    } catch {
      onError("ההעברה נכשלה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayBank() {
    const amount = parseAmountInput(amountStr);
    if (amount === null) {
      onError(`הזן סכום בין ${formatAmount(MIN_TRANSACTION)} ל־${formatAmount(MAX_TRANSACTION)}`);
      return;
    }
    const validation = validateAmount(amount);
    if (!validation.valid) {
      onError(validation.error);
      return;
    }
    if (currentPlayer.balance < amount) {
      onError("אין מספיק יתרה.");
      return;
    }
    setLoading(true);
    onError("");
    try {
      if (!supabase) return;
      const { error: txErr } = await supabase.from("transactions").insert({
        room_id: roomId,
        from_player: currentPlayer.id,
        to_player: getBankId(),
        amount,
        description: "תשלום לבנק",
      });
      if (txErr) throw txErr;
      if (!supabase) return;
      await supabase
        .from("players")
        .update({ balance: currentPlayer.balance - amount })
        .eq("id", currentPlayer.id);
      clearModal();
    } catch {
      onError("התשלום נכשל. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReceiveFromBank() {
    const amount = parseAmountInput(amountStr);
    if (amount === null) {
      onError(`הזן סכום בין ${formatAmount(MIN_TRANSACTION)} ל־${formatAmount(MAX_TRANSACTION)}`);
      return;
    }
    const validation = validateAmount(amount);
    if (!validation.valid) {
      onError(validation.error);
      return;
    }
    setLoading(true);
    onError("");
    try {
      if (!supabase) return;
      const { error: txErr } = await supabase.from("transactions").insert({
        room_id: roomId,
        from_player: getBankId(),
        to_player: currentPlayer.id,
        amount,
        description: "קבלה מהבנק",
      });
      if (txErr) throw txErr;
      if (!supabase) return;
      await supabase
        .from("players")
        .update({ balance: currentPlayer.balance + amount })
        .eq("id", currentPlayer.id);
      clearModal();
    } catch {
      onError("הקבלה נכשלה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handlePassGo}
          disabled={loading}
          className="col-span-2 py-4 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-semibold text-lg disabled:opacity-50 transition-colors border border-monopoly-green-light/30"
        >
          עברתי בדרך צלחה <span className="text-monopoly-gold-light dark:text-monopoly-gold">+{formatAmount(PASS_GO_AMOUNT)}</span>
        </button>
        <button
          type="button"
          onClick={() => setModal("transfer")}
          disabled={loading}
          className="py-3 rounded-xl bg-monopoly-light-card dark:bg-monopoly-dark-card border border-monopoly-light-border dark:border-monopoly-green/50 hover:border-monopoly-green text-gray-900 dark:text-white font-medium disabled:opacity-50 transition-colors"
        >
          העבר לשחקן
        </button>
        <button
          type="button"
          onClick={() => setModal("payBank")}
          disabled={loading}
          className="py-3 rounded-xl bg-monopoly-light-card dark:bg-monopoly-dark-card border border-monopoly-light-border dark:border-monopoly-green/50 hover:border-monopoly-green text-gray-900 dark:text-white font-medium disabled:opacity-50 transition-colors"
        >
          שלם לבנק
        </button>
        <button
          type="button"
          onClick={() => setModal("receiveBank")}
          disabled={loading}
          className="py-3 rounded-xl bg-monopoly-light-card dark:bg-monopoly-dark-card border border-monopoly-light-border dark:border-monopoly-green/50 hover:border-monopoly-green text-gray-900 dark:text-white font-medium disabled:opacity-50 transition-colors"
        >
          קבל מהבנק
        </button>
      </div>

      {/* Modal: Transfer to player */}
      {modal === "transfer" && (
        <Modal title="העבר לשחקן" onClose={clearModal}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">לשחקן</label>
              <select
                value={transferToId}
                onChange={(e) => setTransferToId(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-monopoly-dark border border-monopoly-light-border dark:border-monopoly-green/50 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-monopoly-green"
              >
                <option value="">בחר שחקן</option>
                {otherPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <SmartAmountInput value={amountStr} onChange={setAmountStr} />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={clearModal}
                className="flex-1 py-3 rounded-xl border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-medium disabled:opacity-50"
              >
                {loading ? "..." : "העבר"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Pay Bank */}
      {modal === "payBank" && (
        <Modal title="שלם לבנק" onClose={clearModal}>
          <div className="space-y-4">
            <SmartAmountInput value={amountStr} onChange={setAmountStr} />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={clearModal}
                className="flex-1 py-3 rounded-xl border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handlePayBank}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-medium disabled:opacity-50"
              >
                {loading ? "..." : "שלם"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Receive from Bank */}
      {modal === "receiveBank" && (
        <Modal title="קבל מהבנק" onClose={clearModal}>
          <div className="space-y-4">
            <SmartAmountInput value={amountStr} onChange={setAmountStr} />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={clearModal}
                className="flex-1 py-3 rounded-xl border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleReceiveFromBank}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-medium disabled:opacity-50"
              >
                {loading ? "..." : "קבל"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-monopoly-light-card dark:bg-monopoly-dark-card rounded-t-2xl sm:rounded-2xl border-t sm:border border-monopoly-light-border dark:border-monopoly-green/30 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Strip existing M/K suffix from input for appending a new one */
function stripSuffix(s: string): string {
  return s.trim().replace(/\s*[MKmk]$/, "").trim();
}

function SmartAmountInput({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const applySuffix = (suffix: "M" | "K") => {
    const base = stripSuffix(value);
    if (!base) {
      onChange(suffix === "M" ? "1M" : "1K");
      return;
    }
    onChange(base + suffix);
  };

  const parsed = parseAmountInput(value);
  const previewText = parsed != null
    ? `סכום סופי: ${formatAmountExact(parsed)} ש"ח`
    : "הזן מספר ולחץ M או K";

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">סכום (ש&quot;ח)</label>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="decimal"
          placeholder="למשל 1.5 או 50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-xl bg-white dark:bg-monopoly-dark border border-monopoly-light-border dark:border-monopoly-green/50 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-monopoly-green"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => applySuffix("M")}
            className="px-3 py-3 rounded-xl bg-monopoly-green/20 dark:bg-monopoly-green/30 text-monopoly-green dark:text-monopoly-green-light font-bold hover:bg-monopoly-green/30 dark:hover:bg-monopoly-green/50 transition-colors border border-monopoly-green/40"
          >
            M
          </button>
          <button
            type="button"
            onClick={() => applySuffix("K")}
            className="px-3 py-3 rounded-xl bg-monopoly-green/20 dark:bg-monopoly-green/30 text-monopoly-green dark:text-monopoly-green-light font-bold hover:bg-monopoly-green/30 dark:hover:bg-monopoly-green/50 transition-colors border border-monopoly-green/40"
          >
            K
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">מינימום {formatAmount(MIN_TRANSACTION)}, מקסימום {formatAmount(MAX_TRANSACTION)}</p>
      <p className={`text-sm font-medium py-2 px-3 rounded-lg tabular-nums ${parsed != null ? "bg-monopoly-green/10 dark:bg-monopoly-green/20 text-monopoly-green-dark dark:text-monopoly-green-light" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
        {previewText}
      </p>
    </div>
  );
}
