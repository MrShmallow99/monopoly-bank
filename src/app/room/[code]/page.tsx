"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Player, Room, Transaction } from "@/lib/database.types";
import { formatAmount, formatAmountExact } from "@/lib/currency";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardActions } from "./DashboardActions";
import { Ledger } from "./Ledger";

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
      setRoom(roomData);

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
      setPlayer(playerData);

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
            setTransactions((prev) => [payload.new as Transaction, ...prev].slice(0, 50));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as Player;
            setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            if (updated.id === playerId) setPlayer(updated);
          }
          if (payload.eventType === "INSERT" && payload.new) {
            setPlayers((prev) => [...prev, payload.new as Player]);
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

  return (
    <main className="min-h-screen flex flex-col bg-monopoly-light-bg dark:bg-monopoly-dark pb-safe">
      <header className="bg-monopoly-light-card dark:bg-monopoly-dark-card border-b border-monopoly-light-border dark:border-monopoly-green/30 px-4 py-4 safe-top">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">חדר #{room.code}</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-monopoly-green dark:text-monopoly-gold font-medium">{player.name}</span>
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
          roomId={room.id}
          currentPlayer={player}
          otherPlayers={otherPlayers}
          onError={setError}
        />
      </section>

      <Ledger
        transactions={transactions}
        players={players}
        currentPlayerId={player.id}
      />
    </main>
  );
}
