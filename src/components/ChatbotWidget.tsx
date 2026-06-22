import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Coord } from "../types";
import { MessageSquare, Send, Sparkles, AlertTriangle, ShieldCheck, User } from "lucide-react";

interface ChatbotWidgetProps {
  userPos: Coord | null;
  onSendMessage: (msg: string) => Promise<string>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function ChatbotWidget({
  userPos,
  onSendMessage,
  messages,
  setMessages
}: ChatbotWidgetProps) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest chats
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText("");

    // Add User Message to component state
    const userMsg: ChatMessage = {
      id: "usr-" + Date.now().toString(),
      role: "user",
      message: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const responseReply = await onSendMessage(userText);
      
      const assistantMsg: ChatMessage = {
        id: "ast-" + Date.now().toString(),
        role: "model",
        message: responseReply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: "ast-err-" + Date.now().toString(),
        role: "model",
        message: "I am having minor trouble connecting to the safety tracking server, but please remember: stick to main lit routes! If you feel compromised, tap the SOS button immediately.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestClick = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <div className="flex flex-col h-[480px] md:h-[550px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm selection:bg-violet-500/15">
      {/* Tab Header bar */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-605 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              A
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-50 animate-ping"></span>
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1 leading-none uppercase">
              Companion Aria
              <Sparkles className="w-2.5 h-2.5 text-fuchsia-600 animate-pulse" />
            </h3>
            <span className="text-[8.5px] font-mono text-emerald-600 font-bold">Tactical Safety Guard Live</span>
          </div>
        </div>

        {userPos && (
          <div className="text-[9px] font-mono bg-violet-50 text-violet-750 border border-violet-100 px-2 py-0.5 rounded-full">
            GPS: Active ({userPos.x.toFixed(4)}, {userPos.y.toFixed(4)})
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 border border-fuchsia-200 flex items-center justify-center text-fuchsia-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">TALK TO ARIA SAFETY ESCORT</h4>
              <p className="text-[10px] text-slate-500 max-w-[220px] mx-auto mt-1 leading-relaxed">
                She will talk to you throughout your walk. Ask for secure avenues, reports, or nearby clinics.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div 
                key={m.id} 
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-605 to-fuchsia-600 flex items-center justify-center text-white font-mono text-[10px] font-bold shrink-0 mt-0.5">
                    A
                  </div>
                )}
                
                <div className="flex flex-col max-w-[80%] text-left">
                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed transition-all ${
                    isUser 
                      ? "bg-slate-100 text-slate-800 rounded-tr-none border border-slate-200" 
                      : "bg-violet-50 border border-violet-100 text-violet-900 rounded-tl-none font-medium"
                  }`}>
                    {m.message}
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 mt-1 self-end px-1 font-semibold">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-mono text-[10px] font-bold shrink-0">
              A
            </div>
            <div className="p-3 rounded-2xl text-[11px] bg-slate-50 border border-slate-200 text-slate-500 rounded-tl-none">
              <span className="flex items-center gap-1 font-mono">
                Aria evaluating proximity coordinates 
                <span className="animate-ping rounded-full w-1 h-1 bg-fuchsia-600"></span>
                <span className="animate-ping rounded-full w-1 h-1 bg-fuchsia-600" style={{ animationDelay: "200ms" }}></span>
                <span className="animate-ping rounded-full w-1 h-1 bg-fuchsia-600" style={{ animationDelay: "400ms" }}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestion Prompts */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-thin select-none">
        <button
          onClick={() => handleSuggestClick("There are suspicious loiterers near me")}
          className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-[10px] text-rose-700 transition-all font-medium flex items-center gap-1 cursor-pointer"
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          Fearing Loiterers
        </button>

        <button
          onClick={() => handleSuggestClick("Where is the closest medical / police station?")}
          className="px-2.5 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-100 text-[10px] text-violet-750 transition-all font-medium flex items-center gap-1 cursor-pointer"
        >
          <ShieldCheck className="w-2.5 h-2.5" />
          Closest Rescue station?
        </button>

        <button
          onClick={() => handleSuggestClick("The streetlights are non-functional here")}
          className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 text-[10px] text-amber-700 transition-all font-medium cursor-pointer"
        >
          💡 Log Blackout stretch
        </button>
      </div>

      {/* Input container */}
      <form onSubmit={handleSend} className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
        <input
          id="chat-user-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Talk to Aria safety companion..."
          className="flex-1 bg-white border border-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-xs rounded-xl py-2 px-3 text-slate-800 placeholder:text-slate-400"
        />
        <button
          id="btn-chat-send"
          type="submit"
          disabled={!inputText.trim()}
          className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 disabled:opacity-40 hover:from-violet-500 hover:to-fuchsia-500 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
