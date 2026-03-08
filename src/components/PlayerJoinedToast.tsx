"use client";

import { useEffect } from "react";

type Props = {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
};

export function PlayerJoinedToast({ message, onDismiss, durationMs = 3500 }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs]);

  return (
    <div
      className="fixed top-4 right-4 left-4 z-[60] mx-auto max-w-md rounded-xl border border-monopoly-green/40 bg-monopoly-light-card dark:bg-monopoly-dark-card px-4 py-3 shadow-lg"
      role="status"
      aria-live="polite"
    >
      <p className="text-center text-sm font-medium text-gray-800 dark:text-gray-100">
        {message}
      </p>
    </div>
  );
}
