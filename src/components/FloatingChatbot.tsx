import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const STORAGE_KEY = "secureauth-chat-history";

const QUICK_REPLIES = [
  "How do I upload a document?",
  "What's the difference between Free and Pro plans?",
  "How do I analyze a document?",
  "What user roles are available?",
];

const DEFAULT_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! 👋 I'm your SecureAuth assistant. How can I help you today?",
};

const loadChatHistory = (): Message[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load chat history:", e);
  }
  return [DEFAULT_MESSAGE];
};

const saveChatHistory = (messages: Message[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
};

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadChatHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!resp.ok) throw new Error("Request failed");
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      
      // Update state once streaming starts
      setIsLoading(false); 

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return [...prev.slice(0, -1), { ...last, content: assistantContent }];
                  }
                  return [...prev, { role: "assistant", content: assistantContent }];
                });
              }
            } catch (e) { /* ignore parse errors */ }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl shadow-2xl transition-all duration-500",
          "bg-blue-600 hover:bg-blue-700 text-white active:scale-95",
          isOpen ? "rotate-90" : "hover:scale-110"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] rounded-[2.5rem] border-none bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-500 ease-out",
          isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold tracking-tight">AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Online</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMessages([DEFAULT_MESSAGE])}
              className="h-8 w-8 rounded-lg hover:bg-white/10 text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-[400px] bg-[#fafafa] dark:bg-slate-950" ref={scrollRef}>
          <div className="p-6 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-start gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                    m.role === "user" ? "bg-white dark:bg-slate-800" : "bg-blue-600 text-white"
                )}>
                  {m.role === "user" ? <User className="h-4 w-4 text-slate-500" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[85%]",
                  m.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700"
                )}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* TYPING INDICATOR */}
            {isLoading && (
              <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 px-4 py-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-blue-400 animate-[bounce_1s_infinite_0ms]" />
                    <div className="h-2 w-2 rounded-full bg-blue-400 animate-[bounce_1s_infinite_200ms]" />
                    <div className="h-2 w-2 rounded-full bg-blue-400 animate-[bounce_1s_infinite_400ms]" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Replies */}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-col gap-2 pt-2 ml-11">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Common Questions</p>
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="text-xs text-left px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              className="pr-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none ring-1 ring-slate-200 dark:ring-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="absolute right-1.5 h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-90"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}