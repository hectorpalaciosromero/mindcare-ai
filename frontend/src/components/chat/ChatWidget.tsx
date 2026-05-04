"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
}

interface ChatWidgetProps {
  endpoint?: string;
  placeholder?: string;
}

export default function ChatWidget({ endpoint = "/api/chat", placeholder = "Escribe tu mensaje..." }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // SpeechRecognition is only available in certain browsers — we gracefully degrade if missing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "es-ES";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
      setInput(transcript);
      if (event.results[0].isFinal) {
        setIsListening(false);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: "user", text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages.slice(-8).map(m => ({ sender: m.sender, text: m.text })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: "bot", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: "bot", text: "Lo siento, hubo un error. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
              msg.sender === "user"
                ? "bg-[var(--primary-purple)] text-white rounded-br-md"
                : "bg-gray-100 text-gray-800 rounded-bl-md"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-100 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={isListening ? "Escuchando..." : placeholder}
          className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]/30 ${
            isListening ? "border-red-300 bg-red-50" : "border-gray-200"
          }`}
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl bg-[var(--primary-purple)] flex items-center justify-center text-white disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
        <button onClick={toggleVoice}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
            isListening ? "bg-red-500 animate-pulse" : "bg-[var(--primary-purple)]"
          }`}>
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
