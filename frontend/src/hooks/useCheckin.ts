// Check-in flow state: emotion, intensity, note, submission.

import { useState, useCallback } from "react";
import type { Emotion, Checkin } from "@/types";

interface CheckinState {
  emotion: Emotion | null;
  intensity: number;
  note: string;
  isSubmitting: boolean;
  result: Checkin | null;
  error: string | null;

  setEmotion: (e: Emotion) => void;
  setIntensity: (i: number) => void;
  setNote: (n: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
  canSubmit: boolean;
}

export function useCheckin(): CheckinState {
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Checkin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = emotion !== null && note.length > 0 && !isSubmitting;

  const submit = useCallback(async () => {
    if (!emotion) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/proxy/patients/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion, intensity, note }),
      });
      if (!response.ok) throw new Error("Error al enviar check-in");
      const checkin = await response.json();
      setResult(checkin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar check-in");
    } finally {
      setIsSubmitting(false);
    }
  }, [emotion, intensity, note]);

  const reset = useCallback(() => {
    setEmotion(null);
    setIntensity(5);
    setNote("");
    setResult(null);
    setError(null);
  }, []);

  return {
    emotion, intensity, note, isSubmitting, result, error,
    setEmotion, setIntensity, setNote, submit, reset, canSubmit,
  };
}
