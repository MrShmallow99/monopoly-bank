"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Player, Room, Transaction } from "@/lib/database.types";
import { formatAmount, formatAmountExact } from "@/lib/currency";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlayerJoinedToast } from "@/components/PlayerJoinedToast";
import { DashboardActions } from "./DashboardActions";
import { Ledger } from "./Ledger";
import { GameOverModal } from "./GameOverModal";
import { PlayersModal, UsersIcon } from "./PlayersModal";
import { playTransferPlus } from "@/lib/sounds";
import { useSoundPreference } from "@/hooks/useSoundPreference";
import { Volume2, VolumeX } from "lucide-react";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = typeof params.code === "string" ? params.code : "";
  const playerId = searchParams.get("player");

  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  const [endGameLoading, setEndGameLoading] = useState(false);
  const [playerJoinedToast, setPlayerJoinedToast] = useState<string | null>(null);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [soundEnabled, setSoundEnabled, soundMounted] = useSoundPreference();

  useEffect(() => {
    if (!code || !playerId) {
      setError("חסר קוד חדר או שחקן. חזור לדף הבית.");
      setLoading(false);
      return;
    }

    async function load() {
      if (!supabase) {
        setError("יש להגדיר Supabase ב-.env.local");
        setLoading(false);
        return;
      }
      const { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code)
        .single();
      if (roomErr || !roomData) {
        setError("חדר לא נמצא.");
        setLoading(false);
        return;
      }
      setRoom({
        ...roomData,
        allow_debt: roomData.allow_debt ?? false,
        is_active: roomData.is_active ?? true,
      } as Room);

      const { data: playerData, error: playerErr } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .eq("room_id", roomData.id)
        .single();
      if (playerErr || !playerData) {
        setError("שחקן לא נמצא בחדר זה.");
        setLoading(false);
        return;
      }
      setPlayer({ ...playerData, is_bankrupt: playerData.is_bankrupt ?? false } as Player);

      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomData.id)
        .order("created_at", { ascending: true });
      setPlayers(playersData ?? []);

      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("room_id", roomData.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setTransactions(txData ?? []);
      setLoading(false);
    }

    load();
  }, [code, playerId]);

  useEffect(() => {
    if (!room?.id) return;

    if (!supabase) return;
    const sub = supabase
      .channel("transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const tx = payload.new as Transaction;
            setTransactions((prev) => [tx, ...prev].slice(0, 50));
            if (tx.to_player === playerId) {
              playTransferPlus();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const updated = { ...payload.new, is_bankrupt: (payload.new as Player).is_bankrupt ?? false } as Player;
            setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            if (updated.id === playerId) setPlayer(updated);
          }
          if (payload.eventType === "INSERT" && payload.new) {
            const newPlayer = payload.new as Player;
            setPlayers((prev) => [...prev, newPlayer]);
            if (newPlayer.id !== playerId) {
              setPlayerJoinedToast(`${newPlayer.name} הצטרף/ה למשחק! 🎉`);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const r = payload.new as Room;
            setRoom({ ...r, allow_debt: r.allow_debt ?? false, is_active: r.is_active ?? true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(sub);
    };
  }, [room?.id, playerId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-monopoly-light-bg dark:bg-monopoly-dark">
        <p className="text-monopoly-green dark:text-monopoly-green-light">טוען...</p>
      </main>
    );
  }

  if (error || !room || !player) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-monopoly-light-bg dark:bg-monopoly-dark">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || "שגיאה"}</p>
        <a
          href="/"
          className="px-4 py-2 rounded-xl bg-monopoly-green text-white hover:bg-monopoly-green-light"
        >
          חזרה לדף הבית
        </a>
      </main>
    );
  }

  const otherPlayers = players.filter((p) => p.id !== player.id);
  const isGameActive = room.is_active !== false;
  const isBanker = player.is_banker === true;

  async function confirmEndGame() {
    if (!supabase || !room?.id) return;
    setEndGameLoading(true);
    try {
      const { error: upErr } = await supabase.from("rooms").update({ is_active: false }).eq("id", room.id);
      if (!upErr) setShowEndGameConfirm(false);
    } finally {
      setEndGameLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-monopoly-light-bg dark:bg-monopoly-dark pb-safe">
      <header className="bg-monopoly-light-card dark:bg-monopoly-dark-card border-b border-monopoly-light-border dark:border-monopoly-green/30 px-4 py-4 safe-top">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">חדר #{room.code}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg border border-monopoly-light-border dark:border-monopoly-green/40 text-gray-600 dark:text-gray-400 hover:bg-monopoly-light-bg dark:hover:bg-monopoly-green/10 transition-colors"
              aria-label={soundMounted ? (soundEnabled ? "כבה צלילים" : "הפעל צלילים") : "צלילים"}
            >
              {soundMounted ? (soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />) : <Volume2 className="w-5 h-5" />}
            </button>
            <ThemeToggle />
            <span className="text-monopoly-green dark:text-monopoly-gold font-medium">{player.name}</span>
            {isBanker && isGameActive && (
              <button
                type="button"
                onClick={() => setShowEndGameConfirm(true)}
                className="text-sm px-3 py-1 rounded-lg border border-amber-500/60 dark:border-amber-400/60 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors"
              >
                סיום משחק
              </button>
            )}
          </div>
        </div>
        <div className="text-center py-2">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">יתרה נוכחית</p>
          <p className="text-2xl sm:text-3xl font-bold text-monopoly-green dark:text-monopoly-green-light tabular-nums">
            {formatAmountExact(player.balance)} <span className="text-lg text-gray-600 dark:text-gray-500 font-normal">ש&quot;ח</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            ({formatAmount(player.balance)})
          </p>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-4 py-2 text-sm">
          {error}
        </div>
      )}
      <section className="flex-1 p-4 overflow-auto">
        <DashboardActions
          room={room}
          currentPlayer={player}
          players={players}
          onError={setError}
        />
      </section>

      {!isGameActive && (
        <GameOverModal players={players} />
      )}

      {showPlayersModal && (
        <PlayersModal players={players} onClose={() => setShowPlayersModal(false)} />
      )}

      {showEndGameConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowEndGameConfirm(false)}>
          <div className="w-full max-w-sm bg-monopoly-light-card dark:bg-monopoly-dark-card rounded-2xl border border-monopoly-light-border dark:border-monopoly-green/30 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">סיום משחק</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              האם אתה בטוח שברצונך לסיים את המשחק? פעולה זו תנעל את החדר לכל השחקנים.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEndGameConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={confirmEndGame}
                disabled={endGameLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
              >
                {endGameLoading ? "..." : "כן, סיים משחק"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Ledger
        transactions={transactions}
        players={players}
        currentPlayerId={player.id}
      />
    </main>
  );
}
