"use client";
import { useState, useRef, useEffect } from "react";
import { Bot, Mic } from "lucide-react";

export default function ChatbotButton({ context = "general" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [showPopup, setShowPopup] = useState(true);

  // Hide popup after 4 seconds or when chat opens
  useEffect(() => {
    if (open) setShowPopup(false);
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [open, showPopup]);

  // Handle sending a message
  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setLoading(true);
    setInput("");
    // Call backend API
    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, context }),
    });
    const data = await res.json();
    setMessages((msgs) => [...msgs, { role: "assistant", content: data.answer }]);
    setLoading(false);
    inputRef.current?.focus();
  }

  // Voice input logic
  function startListening() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      inputRef.current?.focus();
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  // Animated dots for 'thinking' effect
  function ThinkingDots() {
    return (
      <span className="inline-block w-6 text-blue-500">
        <span className="inline-block animate-bounce [animation-delay:0s]">.</span>
        <span className="inline-block animate-bounce [animation-delay:0.15s]">.</span>
        <span className="inline-block animate-bounce [animation-delay:0.3s]">.</span>
      </span>
    );
  }

  // Unique animation: floating, pulsing, and bouncing
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed z-50 bottom-8 right-8 bg-blue-600 rounded-full shadow-lg p-4 flex items-center justify-center animate-bounce hover:scale-110 transition-transform border-4 border-white"
        style={{ boxShadow: "0 8px 32px rgba(59,130,246,0.3)" }}
        aria-label="Open Chatbot"
      >
        <Bot className="h-8 w-8 text-white animate-pulse" />
      </button>
      {/* Creative Popup Tooltip */}
      {showPopup && !open && (
        <div
          className="fixed z-50 bottom-28 right-8 bg-gradient-to-br from-blue-50 to-white text-blue-800 px-6 py-4 rounded-2xl shadow-2xl border border-blue-200 font-semibold text-base flex items-center gap-3 animate-fade-in-up"
          style={{ minWidth: 250, maxWidth: 360, pointerEvents: "none", boxShadow: "0 8px 32px 0 rgba(59,130,246,0.18)" }}
        >
          <span className="relative flex items-center justify-center">
            <span className="absolute animate-ping inline-flex h-8 w-8 rounded-full bg-blue-200 opacity-60"></span>
            <Bot className="h-7 w-7 z-10 text-blue-500 animate-pulse" />
          </span>
          <span>
            <span className="block">
              {context === "transaction"
                ? "Ask about your latest or biggest transactions!"
                : context === "forecast"
                ? "Curious about next month's spending? Just ask!"
                : "Ask me anything about your finances!"}
            </span>
            <span className="block mt-1 text-blue-400 text-sm font-normal">
              <ThinkingDots />
            </span>
          </span>
        </div>
      )}
      {/* Chat Window */}
      {open && (
        <div className="fixed z-50 bottom-24 right-8 w-96 md:w-[420px] bg-white rounded-xl shadow-2xl border border-blue-200 flex flex-col overflow-hidden animate-fade-in">
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2">
            <Bot className="h-5 w-5 animate-pulse" />
            <span className="font-semibold">FinEdge Assistant</span>
            <button
              className="ml-auto text-white/70 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[420px] bg-blue-50/30">
            {messages.length === 0 && (
              <div className="text-gray-400 text-sm text-center mt-8">
                Ask me anything about your finances!
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-sm max-w-[90%] ${
                  msg.role === "user"
                    ? "bg-blue-100 ml-auto text-right"
                    : "bg-white text-left border border-blue-100"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="text-blue-400 text-xs">Thinking...</div>
            )}
          </div>
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-1 p-2 border-t bg-white"
          >
            <input
              ref={inputRef}
              type="text"
              className="flex-1 px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm min-w-0"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              className={`rounded-full p-2 border-2 ${listening ? "border-blue-600 bg-blue-100 animate-pulse" : "border-blue-200 bg-white"} text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0`}
              onClick={listening ? stopListening : startListening}
              aria-label={listening ? "Stop listening" : "Start voice input"}
              disabled={loading}
              style={{ outline: listening ? "2px solid #2563eb" : undefined }}
            >
              <Mic className={`h-5 w-5 ${listening ? "animate-pulse" : ""}`} />
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 flex-shrink-0"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
} 