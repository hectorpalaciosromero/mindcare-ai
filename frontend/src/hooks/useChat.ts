// Chat state hook with API integration.

import { useState, useCallback } from "react";


interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  sendMessage: () => Promise<void>;
  clearHistory: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, history }),
      });
      if (!response.ok) throw new Error("Chat error");
      const { reply } = await response.json();
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "bot", text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Estoy aquí para ayudarte. ¿Podrías reformular tu pregunta?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, input, setInput, isLoading, sendMessage, clearHistory };
}
