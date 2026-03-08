"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSoundPreference } from "@/hooks/useSoundPreference";

function generateRoomCode(): string {
  const len = 4 + Math.floor(Math.random() * 3);
  let code = "";
  for (let i = 0; i < len; i++) code += Math.floor(Math.random() * 10);
  return code;
}

export default function HomePage() {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useSoundPreference();
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [createName, setCreateName] = useState("");
  const [allowDebt, setAllowDebt] = useState(false);
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState("");

  async function handleCreateRoom() {
    if (!createName.trim()) {
      setError("נא להזין את שמך");
      return;
    }
    setError("");
    setLoading("create");
    try {
      let code = generateRoomCode();
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabase!
          .from("rooms")
          .select("id")
          .eq("code", code)
          .single();
        if (!existing) break;
        code = generateRoomCode();
        attempts++;
      }
      const { data: room, error: roomErr } = await supabase!
        .from("rooms")
        .insert({ code, allow_debt: allowDebt, is_active: true })
        .select("id")
        .single();
      if (roomErr || !room) {
        setError("יצירת החדר נכשלה. נסה שוב.");
        setLoading(null);
        return;
      }
      const { data: player, error: playerErr } = await supabase!
        .from("players")
        .insert({
          room_id: room.id,
          name: createName.trim(),
          balance: 15_000_000,
          is_banker: true,
          is_bankrupt: false,
        })
        .select("id")
        .single();
      if (playerErr || !player) {
        await supabase!.from("rooms").delete().eq("id", room.id);
        setError("יצירת החדר נכשלה. נסה שוב.");
        setLoading(null);
        return;
      }
      router.push(`/room/${code}?player=${player.id}`);
    } catch {
      setError("משהו השתבש. נסה שוב.");
      setLoading(null);
    }
  }

  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim() || !joinName.trim()) {
      setError("נא להזין קוד חדר ושם");
      return;
    }
    setError("");
    setLoading("join");
    try {
      const code = joinCode.trim().replace(/\D/g, "").slice(0, 6);
      const { data: room, error: roomErr } = await supabase!
        .from("rooms")
        .select("id")
        .eq("code", code)
        .single();
      if (roomErr || !room) {
        setError("חדר לא נמצא. בדוק את הקוד.");
        setLoading(null);
        return;
      }
      const { data: player, error: playerErr } = await supabase!
        .from("players")
        .insert({
          room_id: room.id,
          name: joinName.trim(),
          balance: 15_000_000,
          is_banker: false,
          is_bankrupt: false,
        })
        .select("id")
        .single();
      if (playerErr) {
        if (playerErr.code === "23505") setError("שם זה כבר תפוס בחדר זה.");
        else setError("הצטרפות נכשלה. נסה שוב.");
        setLoading(null);
        return;
      }
      router.push(`/room/${code}?player=${player!.id}`);
    } catch {
      setError("משהו השתבש. נסה שוב.");
      setLoading(null);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-monopoly-light-bg dark:bg-monopoly-dark">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-monopoly-green dark:text-monopoly-gold">מונופול כרטיס אשראי</h1>
          <p className="text-gray-600 dark:text-gray-400">
            יש להגדיר Supabase: צור קובץ <code className="bg-monopoly-light-card dark:bg-monopoly-dark-card px-2 py-1 rounded border border-monopoly-light-border dark:border-monopoly-green/30">.env.local</code> עם
            <code className="block mt-2 bg-monopoly-light-card dark:bg-monopoly-dark-card px-2 py-1 rounded text-right border border-monopoly-light-border dark:border-monopoly-green/30">NEXT_PUBLIC_SUPABASE_URL</code> ו־
            <code className="block mt-1 bg-monopoly-light-card dark:bg-monopoly-dark-card px-2 py-1 rounded text-right border border-monopoly-light-border dark:border-monopoly-green/30">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-monopoly-light-bg to-monopoly-light-border dark:from-monopoly-dark dark:to-monopoly-green-dark">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-monopoly-green dark:text-monopoly-gold mb-2">
            מונופול כרטיס אשראי
          </h1>
          <p className="text-monopoly-green-dark dark:text-monopoly-green-light/90 text-lg">
            בנק אלקטרוני
          </p>
        </header>

        <div className="bg-monopoly-light-card dark:bg-monopoly-dark-card rounded-2xl p-6 shadow-xl border border-monopoly-light-border dark:border-monopoly-green/30 space-y-6">
          <label className="flex items-center justify-center gap-2 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="rounded border-monopoly-green text-monopoly-green focus:ring-monopoly-green w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">הפעל צלילים</span>
          </label>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">צור חדר חדש</h2>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowDebt}
                onChange={(e) => setAllowDebt(e.target.checked)}
                className="rounded border-monopoly-green text-monopoly-green focus:ring-monopoly-green w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">אפשר כניסה למינוס (משחק עם חובות)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="השם שלך"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="flex-1 rounded-xl bg-white dark:bg-monopoly-dark border border-monopoly-light-border dark:border-monopoly-green/50 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-monopoly-green"
                disabled={!!loading}
              />
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={!!loading}
                className="px-5 py-3 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === "create" ? "..." : "צור חדר"}
              </button>
            </div>
          </section>

          <div className="border-t border-monopoly-light-border dark:border-monopoly-green/30 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">הצטרף לחדר</h2>
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder="קוד חדר (4–6 ספרות)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl bg-white dark:bg-monopoly-dark border border-monopoly-light-border dark:border-monopoly-green/50 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-monopoly-green"
                maxLength={6}
                disabled={!!loading}
              />
              <input
                type="text"
                placeholder="השם שלך"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-monopoly-dark border border-monopoly-light-border dark:border-monopoly-green/50 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-monopoly-green"
                disabled={!!loading}
              />
              <button
                type="submit"
                disabled={!!loading}
                className="w-full py-3 rounded-xl bg-monopoly-green hover:bg-monopoly-green-light text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === "join" ? "..." : "הצטרף"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-600 dark:text-gray-500 text-sm">
          המטבע: ש&quot;ח • יתרה התחלתית 15M • מינימום העברה 10K • מקסימום 20M
        </p>
      </div>
    </main>
  );
}
