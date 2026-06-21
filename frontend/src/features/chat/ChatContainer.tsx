"use client";

import React, { useState, useRef, useEffect } from "react";
import { DhanAvatar } from "@/components/avatar/DhanAvatar";
import { AvatarState, ConversationEvent } from "@/components/avatar/avatarStates";
import { getNextState } from "@/components/avatar/AvatarStateManager";
import { ChatBubble } from "./ChatBubbles";
import { sendChatMessage } from "@/services/repositories/chatRepository";
import { useAudio } from "@/shared/hooks/useAudio";
import { Send } from "lucide-react";
import { FinancialTwinProfile } from "@/features/financial-twin/types";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface ChatContainerProps {
  customer: FinancialTwinProfile;
  proactiveMessage?: string | null;
}

const QUICK_ACTIONS = [
  "Should I stop my SIP?",
  "Can I afford my home goal?",
  "What should I do with bonus money?",
  "My friend made high returns",
  "Why is my SIP not growing?",
  "Is my emergency fund enough?"
] as const;

const MAX_PERSISTED_MESSAGES = 12;

function createInitialMessages(customer: FinancialTwinProfile, proactiveMessage?: string | null): Message[] {
  return [
    {
      role: "ai",
      content: proactiveMessage || `Namaste ${customer.name.split(' ')[0]}. I'm Dhan, your Wealth Companion. I have reviewed your goals, SIP discipline, safety net, and spending pressure. Pick a concern below or ask me directly.`
    }
  ];
}

function readStoredMessages(storageKey: string): Message[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const messages = parsed.filter((item): item is Message => (
      item !== null &&
      typeof item === "object" &&
      ((item as Message).role === "ai" || (item as Message).role === "user") &&
      typeof (item as Message).content === "string"
    ));

    return messages.length > 0 ? messages.slice(-MAX_PERSISTED_MESSAGES) : null;
  } catch {
    return null;
  }
}

export function ChatContainer({ customer, proactiveMessage }: ChatContainerProps): React.ReactElement {
  const storageKey = `northstar-chat:${customer.id}:${proactiveMessage ? "proactive" : "default"}`;
  const [messages, setMessages] = useState<Message[]>(
    () => readStoredMessages(storageKey) ?? createInitialMessages(customer, proactiveMessage)
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTextRef = useRef<string>("");
  const isSendingRef = useRef<boolean>(false);
  const streamRafRef = useRef<number | null>(null);
  const { playSound, prewarm } = useAudio();

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify(messages.slice(-MAX_PERSISTED_MESSAGES))
    );
  }, [messages, storageKey]);

  // Synchronize state when switching profiles
  useEffect(() => {
    setMessages(readStoredMessages(storageKey) ?? createInitialMessages(customer, proactiveMessage));
    // Reset UI state on switch
    setInput("");
    setIsLoading(false);
    setAvatarState('IDLE');
  }, [storageKey, customer, proactiveMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (streamRafRef.current !== null) {
        cancelAnimationFrame(streamRafRef.current);
      }
    };
  }, []);

  const dispatchAvatarEvent = (event: ConversationEvent) => {
    setAvatarState(prev => getNextState(prev, event));
  };

  const handleTyping = (val: string) => {
    setInput(val);
    if (val.length > 0 && avatarState === 'IDLE') {
      dispatchAvatarEvent('USER_TYPING');
    } else if (val.length === 0 && avatarState === 'LISTENING') {
      // Revert to IDLE if input is cleared manually before sending
      setAvatarState('IDLE');
    }
  };

  const handleQuickAction = (text: string) => {
    handleTyping(text);
  };

  const handleSend = async (overrideText?: string) => {
    prewarm(); // iOS/Safari: unlock AudioContext synchronously on user gesture
               // Must be before any await — browser gesture scope ends at first suspend point
    const textToSend = overrideText || input.trim();
    if (!textToSend || isLoading || isSendingRef.current) return;

    isSendingRef.current = true;
    streamTextRef.current = ""; // Reset stream buffer
    if (streamRafRef.current !== null) {
      cancelAnimationFrame(streamRafRef.current);
      streamRafRef.current = null;
    }
    
    setMessages(prev => [...prev, { role: "user", content: textToSend }]);
    setInput("");
    setIsLoading(true);
    playSound('send');

    dispatchAvatarEvent('MESSAGE_SENT'); // Moves to THINKING

    try {
      // Map current messages as history (excluding the new message being sent)
      const fullHistory = messages.map(m => ({ role: m.role, content: m.content }));
      
      // Implement sliding context window of last 6 exchanges (12 messages)
      const chatHistory = fullHistory.length > 12 ? fullHistory.slice(-12) : fullHistory;

      // Add placeholder for the AI response
      setMessages(prev => [...prev, { role: "ai", content: "" }]);

      const result = await sendChatMessage({
        message: textToSend,
        customerProfile: customer,
        chatHistory,
        sessionId: customer.id,
        onMetadata: (intent, wasComplianceBlocked) => {
          setIsLoading(false); // Stop typing indicator as soon as stream starts
          
          if (wasComplianceBlocked) {
            playSound('alert');
            dispatchAvatarEvent('COMPLIANCE_TRIGGER');
          } else if (intent === 'RESILIENCE') {
            playSound('stress'); // Calm, grounding sound
            dispatchAvatarEvent('RESILIENCE_FLAG');
          } else if (intent === 'ACCELERATION') {
            playSound('happy');
            dispatchAvatarEvent('RESPONSE_READY');
          } else if (intent === 'EDUCATION') {
            playSound('confirmation');
            dispatchAvatarEvent('RESPONSE_READY');
          } else {
            playSound('receive');
            dispatchAvatarEvent('RESPONSE_READY');
          }
        },
        onChunk: (text) => {
          streamTextRef.current += text;
          
          if (streamRafRef.current) cancelAnimationFrame(streamRafRef.current);
          
          streamRafRef.current = requestAnimationFrame(() => {
            const currentFullText = streamTextRef.current;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastIndex = newMessages.length - 1;
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: currentFullText
              };
              return newMessages;
            });
          });
        }
      });

      if (!result.success) {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = "I am experiencing a temporary connection issue. Please try again.";
          return newMessages;
        });
        dispatchAvatarEvent('RESPONSE_READY');
        setIsLoading(false);
      }

      // Revert to IDLE after simulating reading time
      setTimeout(() => {
        dispatchAvatarEvent('RESPONSE_COMPLETE');
      }, 2000);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "ai", content: "Service unavailable." }]);
      dispatchAvatarEvent('RESPONSE_COMPLETE');
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full relative bg-slate-50">
      
      {/* FIXED 180px AVATAR ZONE */}
      <DhanAvatar state={avatarState} customerName={customer.name} />



      {/* SCROLLABLE MESSAGE ZONE */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto w-full pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <div className="p-6 flex flex-col space-y-6">
          {messages.map((msg, idx) => (
            <ChatBubble key={idx} role={msg.role} content={msg.content} />
          ))}
          {isLoading && (
            <div className="self-start max-w-[85%] bg-white border-l-4 border-brand-gold p-4 rounded-xl rounded-tl-none shadow-sm flex items-center gap-2 h-[52px]">
              <span className="w-2 h-2 bg-brand-navy/50 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-brand-navy/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-2 h-2 bg-brand-navy/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          )}
        </div>
      </div>

      {/* FIXED INPUT BAR WITH SUGGESTIONS */}
      <div className="bg-white border-t border-slate-200 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-10 w-full">
        
        {/* Horizontal Scrollable Chips */}
        {messages.length === 1 && !isLoading && (
          <div className="flex overflow-x-auto gap-2 px-4 py-3 no-scrollbar border-b border-slate-100">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action}
                type="button"
                onClick={() => handleQuickAction(action)}
                className="shrink-0 px-4 py-2 bg-brand-light border border-slate-200 rounded-full text-xs font-semibold text-brand-navy hover:bg-slate-200 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        <div className="h-16 px-4 flex items-center relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your SIPs, life goals, or market concerns..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-full py-2.5 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
            disabled={isLoading}
            aria-label="Ask Dhan about your SIPs, goals, or money concerns"
          />
          <button 
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="absolute right-5 top-4 w-8 h-8 flex items-center justify-center bg-brand-navy text-brand-gold rounded-full hover:bg-brand-navy/90 transition-colors disabled:opacity-50 disabled:bg-slate-300 disabled:text-white"
          >
            <Send className="w-4 h-4 translate-x-[1px]" aria-hidden="true" />
          </button>
        </div>
        
        {/* SEBI Automated Tool Disclosure */}
        <div className="w-full text-center py-2 px-4 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium leading-tight">
            Disclosure: This prototype provides educational, goal-oriented guidance based on the declared risk profile. Mutual fund investments are subject to market risks; read all scheme related documents carefully.
          </p>
        </div>
      </div>
    </div>
  );
}
