"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Player, Room } from "@/lib/database.types";
import {
  formatAmount,
  formatAmountExact,
  parseAmountInput,
  validateAmount,
  validateTransactionAmount,
  validateReviveAmount,
  PASS_GO_AMOUNT,
  getBankId,
} from "@/lib/currency";
import { playButton, playTransferMinus } from "@/lib/sounds";
import { firePassGoConfetti } from "@/lib/confetti";

type Props = {
  room: Room;
  currentPlayer: Player;
  players: Player[];
  onError: (msg: string) => void;
};

export function DashboardActions({ room, currentPlayer, players, onError }: Props) {
  const roomId = room.id;
  const allowDebt = room.allow_debt === true;
  const isGameActive = room.is_active !== false;
  const otherPlayers = players.filter((p) => p.id !== currentPlayer.id);
  const bankruptPlayers = players.filter((p) => p.is_bankrupt === true);

  const [modal, setModal] = useState<"transfer" | "payBank" | "receiveBank" | "bankruptConfirm" | "revive" | null>(null);
  const [transferToId, setTransferToId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [reviveAmountStr, setReviveAmountStr] = useState("");
  const [revivePlayerId, setRevivePlayerId] = useState("");
  const [transferValidationError, setTransferValidationError] = useState("");
  const [amountValidationError, setAmountValidationError] = useState("");
  const [reviveValidationError, setReviveValidationError] = useState("");
  const [loading, setLoading] = useState(false);

  function clearModal() {
    setModal(null);
    setTransferToId("");
    setAmountStr("");
    setReviveAmountStr("");
    setRevivePlayerId("");
    setTransferValidationError("");
    setAmountValidationError("");
    setReviveValidationError("");
    onError("");
  }

  function showErrorOnly(msg: string) {
    onError(msg);
    setLoading(false);
  }

  async function handlePassGo() {
    if (!supabase) return;
    setLoading(true);
    onError("");
    try {
      const { error: txErr } = await supabase.from("transactions").insert({
        room_id: roomId,
        from_player: getBankId(),
        to_player: currentPlayer.id,
        amount: PASS_GO_AMOUNT,
        description: "דרך צלחה",
      });
      if (txErr) {
        showErrorOnly("הפעולה נכשלה. נסה שוב.");
        return;
      }
      const newBalance = currentPlayer.balance + PASS_GO_AMOUNT;
      const { error: upErr } = await supabase
        .from("players")
        .update({ balance: newBalance })
        .eq("id", currentPlayer.id);
      if (upErr) showErrorOnly("הפעולה נכשלה. נסה שוב.");
      else {
        firePassGoConfetti();
        clearModal();
      }
    } catch {
      showErrorOnly("הפעולה נכשלה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer() {
    if (!transferToId || !transferToId.trim()) {
      setTransferValidationError("אנא בחר שחקן");
      return;
    }
    setTransferValidationError("");
    const amount = parseAmountInput(amountStr);
    if (amount === null) {
      setAmountValidationError("הזן סכום (הסכום חייב להיות בין 0 ל-20M)");
      return;
    }
    const validation = validateAmount(amount);
    if (!validation.valid) {
      setAmountValidationError(validation.error);
      return;
    }
    const strict = validateTransactionAmount(amount);
    if (!strict.valid) {
      setAmountValidationError(strict.error);
      return;
    }
    if (!allowDebt && currentPlayer.balance < strict.amount) {
      setAmountValidationError("אין מספיק יתרה. במשחק זה לא ניתן להיכנס למינוס.");
      return;
    }
    const toPlayer = otherPlayers.find((p) => p.id === transferToId);
    if (!toPlayer) {
      setAmountValidationError("שחקן לא נמצא.");
      return;
    }
    const safeAmount = strict.amount;
    setAmountValidationError("");
    setLoading(true);
    onError("");
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { error: txErr } = await supabase.from("transactions").insert({
        room_id: roomId,
        from_player: currentPlayer.id,
        to_player: transferToId,
        amount: safeAmount,
        description: null,
      });
      if (txErr) {
        showErrorOnly("ההעברה נכשלה. נסה שוב.");
        return;
      }
      const newSenderBalance = currentPlayer.balance - safeAmount;
      await supabase
        .from("players")
        .update({ balance: newSenderBalance, ...(!allowDebt && newSenderBalance === 0 ? { is_bankrupt: true } : {}) })
        .eq("id", currentPlayer.id);
      await supabase
        .from("players")
        .update({ balance: toPlayer.balance + safeAmount })
        .eq("id", transferToId);
      playTransferMinus();
      clearModal();
    } catch {
      showErrorOnly("ההעברה נכשלה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayBank() {
    const amount = parseAmountInput(amountStr);
    if (amount === null) {
      setAmountValidationError("הזן סכום (הסכום חייב להיות בין 0 ל-20M)");
      return;
    }
    const validation = validateAmount(amount);
    if (!validation.valid) {
      setAmountValidationError(validation.error);
      return;
    }
    const strict = validateTransactionAmount(amount);
    if (!strict.valid) {
      setAmountValidationError(strict.error);
      return;
    }
    if (!allowDebt && currentPlayer.balance < strict.amount) {
      setAmountValidationError("אין מספיק יתרה. במשחק זה לא ניתן להיכנס למינוס.");
      return;
    }
    const safeAmount = strict.amount;
    setAmountValidationError("");
    setLoading(true);
    onError("");
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { error: txErr } = await supabase.from("transactions").insert({
        room_id: roomId,
        from_player: currentPlayer.id,
        to_player: getBankId(),
        amount: safeAmount,
        description: "תשלום לבנק",
      });
      if (txErr) {
        showErrorOnly("התשלום נכשל. נסה שוב.");
        return;
      }
      const newBalance = currentPlayer.balance - safeAmount;
      await supabase
        .from("players")
        .update({ balance: newBalance, ...(!allowDebt && newBalance === 0 ? { is_bankrupt: true } : {}) })
        .eq("id", currentPlayer.id);
      playTransferMinus();
      clearModal();
    } catch {
      showErrorOnly("התשלום נכשל. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReceiveFromBank() {
    const amount = parseAmountInput(amountStr);
    if (amount === null) {
      setAmountValidationError("הזן סכום (הסכום חייב להיות בין 0 ל-20M)");
      return;
    }
    const validation = validateAmount(amount);
    if (!validation.valid) {
      setAmountValidationError(validation.error);
      return;
    }
    const strict = validateTransactionAmount(amount);
    if (!strict.valid) {
      setAmountValidationError(strict.error);
      return;
    }
    const safeAmount = strict.amount;
    setAmountValidationError("");
    setLoading(true);
    onError("");
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { error: txErr } = await supabase.from("transactions").insert({
        room_id: roomId,
        from_player: getBankId(),
        to_player: currentPlayer.id,
        amount: safeAmount,
        description: "קבלה מהבנק",
      });
      if (txErr) {
        showErrorOnly("הקבלה נכשלה. נסה שוב.");
        return;
      }
      await supabase
        .from("players")
        .update({ balance: currentPlayer.balance + safeAmount })
        .eq("id", currentPlayer.id);
      clearModal();
    } catch {
      showErrorOnly("הקבלה נכשלה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeclareBankruptcy() {
    setLoading(true);
    onError("");
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { error: upErr } = await supabase
        .from("players")
        .update({ balance: 0, is_bankrupt: true })
        .eq("id", currentPlayer.id);
      if (upErr) showErrorOnly("פעולת פשיטת רגל נכשלה. נסה שוב.");
      else clearModal();
    } catch {
      showErrorOnly("פעולת פשיטת רגל נכשלה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevive(targetPlayerId: string, amount: number) {
    if (!currentPlayer.is_banker) return;
    const target = bankruptPlayers.find((p) => p.id === targetPlayerId);
    if (!target) {
      onError("שחקן לא נמצא או לא במצב פשיטת רגל.");
      return;
    }
    const strict = validateReviveAmount(amount);
    if (!strict.valid) {
      onError(strict.error);
      return;
    }
    setLoading(true);
    onError("");
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { error: upErr } = await supabase
        .from("players")
        .update({ balance: strict.amount, is_bankrupt: false })
        .eq("id", targetPlayerId)
        .eq("room_id", roomId);
      if (upErr) showErrorOnly("ההחזרה לחיים נכשלה. נסה שוב.");
      else {
        setRevivePlayerId("");
        setReviveAmountStr("");
        setReviveValidationError("");
        setModal(null);
      }
    } catch {
      showErrorOnly("ההחזרה לחיים נכשלה. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEndGame() {
    setLoading(true);
    onError("");
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { error: upErr } = await supabase
        .from("rooms")
        .update({ is_active: false })
        .eq("id", roomId);
      if (upErr) showErrorOnly("סיום המשחק נכשל. נסה שוב.");
      else clearModal();
    } catch {
      showErrorOnly("סיום המשחק נכשל. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  if (!isGameActive) {
    return null;
  }

  if (currentPlayer.is_bankrupt === true) {
    return (
      <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/20 p-6 text-center">
        <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">פשטת רגל – צופה במשחק</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">ניתן לצפות בהיסטוריית הפעולות למטה</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => { playButton(); handlePassGo(); }}
          disabled={loading}
          className="col-span-2 py-3 sm:py-4 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-semibold text-base sm:text-lg disabled:opacity-50 transition-colors border border-monopoly-green-light/30"
        >
          עברתי בדרך צלחה <span className="text-monopoly-gold-light dark:text-monopoly-gold">+{formatAmount(PASS_GO_AMOUNT)}</span>
        </button>
        <button
          type="button"
          onClick={() => { playButton(); setModal("transfer"); }}
          disabled={loading}
          className="py-2.5 sm:py-3 rounded-xl bg-monopoly-light-card dark:bg-monopoly-dark-card border border-monopoly-light-border dark:border-monopoly-green/50 hover:border-monopoly-green text-gray-900 dark:text-white font-medium text-sm sm:text-base disabled:opacity-50 transition-colors"
        >
          העבר לשחקן
        </button>
        <button
          type="button"
          onClick={() => { playButton(); setModal("payBank"); }}
          disabled={loading}
          className="py-2.5 sm:py-3 rounded-xl bg-monopoly-light-card dark:bg-monopoly-dark-card border border-monopoly-light-border dark:border-monopoly-green/50 hover:border-monopoly-green text-gray-900 dark:text-white font-medium text-sm sm:text-base disabled:opacity-50 transition-colors"
        >
          שלם לבנק
        </button>
        <button
          type="button"
          onClick={() => { playButton(); setModal("receiveBank"); }}
          disabled={loading}
          className="py-2.5 sm:py-3 rounded-xl bg-monopoly-light-card dark:bg-monopoly-dark-card border border-monopoly-light-border dark:border-monopoly-green/50 hover:border-monopoly-green text-gray-900 dark:text-white font-medium text-sm sm:text-base disabled:opacity-50 transition-colors"
        >
          קבל מהבנק
        </button>
        <button
          type="button"
          onClick={() => setModal("bankruptConfirm")}
          disabled={loading}
          className="col-span-2 py-2.5 sm:py-3 rounded-xl border-2 border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium text-sm sm:text-base hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
        >
          פשיטת רגל
        </button>
      </div>

      {/* Host: Manage players / Revive & End Game */}
      {currentPlayer.is_banker && (
        <div className="mt-3 sm:mt-6 rounded-2xl border border-monopoly-light-border dark:border-monopoly-green/30 bg-monopoly-light-card dark:bg-monopoly-dark-card p-3 sm:p-4 space-y-3 sm:space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">ניהול משחק (מארח)</h3>
          {bankruptPlayers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">החזר לחיים – שחקנים שפשטו רגל:</p>
              {bankruptPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    playButton();
                    setRevivePlayerId(p.id);
                    setReviveAmountStr("5M");
                    setReviveValidationError("");
                    setModal("revive");
                  }}
                  className="w-full text-right px-3 py-2 rounded-lg bg-monopoly-green/80 text-white text-sm font-medium hover:bg-monopoly-green transition-colors"
                >
                  החזר לחיים – {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Bankruptcy confirm */}
      {modal === "bankruptConfirm" && (
        <Modal title="פשיטת רגל" onClose={clearModal}>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">האם לפשוט רגל? היתרה תאופס ותצפה במשחק כצופה.</p>
            <div className="flex gap-2">
              <button type="button" onClick={clearModal} className="flex-1 py-3 rounded-xl border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">ביטול</button>
              <button type="button" onClick={handleDeclareBankruptcy} disabled={loading} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50">אישור</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Transfer to player */}
      {modal === "transfer" && (
        <Modal title="העבר לשחקן" onClose={clearModal}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">לשחקן</label>
              <select
                value={transferToId}
                onChange={(e) => { playButton(); setTransferToId(e.target.value); setTransferValidationError(""); }}
                className="w-full rounded-xl bg-white dark:bg-monopoly-dark border border-monopoly-light-border dark:border-monopoly-green/50 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-monopoly-green"
              >
                <option value="">בחר שחקן</option>
                {otherPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {transferValidationError && (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium" role="alert">
                  {transferValidationError}
                </p>
              )}
            </div>
            <SmartAmountInput value={amountStr} onChange={(v) => { setAmountStr(v); setAmountValidationError(""); }} onButtonClick={playButton} />
            {amountValidationError && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium" role="alert">
                {amountValidationError}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => { playButton(); clearModal(); }}
                className="flex-1 py-3 rounded-xl border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => { playButton(); handleTransfer(); }}
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
            <SmartAmountInput value={amountStr} onChange={(v) => { setAmountStr(v); setAmountValidationError(""); }} onButtonClick={playButton} />
            {amountValidationError && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium" role="alert">
                {amountValidationError}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => { playButton(); clearModal(); }}
                className="flex-1 py-3 rounded-xl border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => { playButton(); handlePayBank(); }}
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
            <SmartAmountInput value={amountStr} onChange={(v) => { setAmountStr(v); setAmountValidationError(""); }} onButtonClick={playButton} />
            {amountValidationError && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium" role="alert">
                {amountValidationError}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => { playButton(); clearModal(); }}
                className="flex-1 py-3 rounded-xl border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => { playButton(); handleReceiveFromBank(); }}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-medium disabled:opacity-50"
              >
                {loading ? "..." : "קבל"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Host Revive player */}
      {modal === "revive" && revivePlayerId && (
        <Modal title="החזר לחיים" onClose={clearModal}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              סכום התחלתי לשחקן {bankruptPlayers.find((p) => p.id === revivePlayerId)?.name ?? ""}:
            </p>
            <SmartAmountInput
              value={reviveAmountStr}
              onChange={(v) => { setReviveAmountStr(v); setReviveValidationError(""); }}
              onButtonClick={playButton}
            />
            {reviveValidationError && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium" role="alert">
                {reviveValidationError}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => { playButton(); clearModal(); }}
                className="flex-1 py-3 rounded-xl border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => {
                  playButton();
                  const amt = parseAmountInput(reviveAmountStr);
                  if (amt === null) {
                    setReviveValidationError("הזן סכום תקין (למשל 5M)");
                    return;
                  }
                  const strict = validateReviveAmount(amt);
                  if (!strict.valid) {
                    setReviveValidationError(strict.error);
                    return;
                  }
                  handleRevive(revivePlayerId, strict.amount);
                }}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-medium disabled:opacity-50"
              >
                {loading ? "..." : "החזר לחיים"}
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

function SmartAmountInput({ value, onChange, onButtonClick }: { value: string; onChange: (s: string) => void; onButtonClick?: () => void }) {
  const applySuffix = (suffix: "M" | "K") => {
    onButtonClick?.();
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
      <p className="text-xs text-gray-500 dark:text-gray-400">הסכום חייב להיות בין 0 ל-20M</p>
      <p className={`text-sm font-medium py-2 px-3 rounded-lg tabular-nums ${parsed != null ? "bg-monopoly-green/10 dark:bg-monopoly-green/20 text-monopoly-green-dark dark:text-monopoly-green-light" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
        {previewText}
      </p>
    </div>
  );
}
