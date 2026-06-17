"use client";

import React, { useState, useRef, useEffect } from "react";
import { DhanAvatar } from "@/components/avatar/DhanAvatar";
import { AvatarState, ConversationEvent } from "@/components/avatar/avatarStates";
import { getNextState } from "@/components/avatar/AvatarStateManager";
import { ChatBubble } from "./ChatBubbles";
import { sendChatMessage } from "@/services/repositories/chatRepository";
import { useAudio } from "@/shared/hooks/useAudio";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface ChatContainerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customer: any;
  proactiveMessage?: string | null;
}

export function ChatContainer({ customer, proactiveMessage }: ChatContainerProps): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: proactiveMessage || `Namaste ${customer.name.split(' ')[0]} 🙏 I'm Dhan, your Wealth Companion. I've analyzed your Financial Twin profile. You can select a quick topic below or ask me anything directly!` }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTextRef = useRef<string>("");
  const isSendingRef = useRef<boolean>(false);
  const { playSound } = useAudio();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
    setInput(text);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input.trim();
    if (!textToSend || isLoading || isSendingRef.current) return;

    isSendingRef.current = true;
    streamTextRef.current = ""; // Reset stream buffer
    
    setMessages(prev => [...prev, { role: "user", content: textToSend }]);
    setInput("");
    setIsLoading(true);
    playSound('send');

    dispatchAvatarEvent('MESSAGE_SENT'); // Moves to THINKING

    try {
      // Map current messages as history (excluding the new message being sent)
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));

      // Add placeholder for the AI response
      setMessages(prev => [...prev, { role: "ai", content: "" }]);

      const result = await sendChatMessage({
        message: textToSend,
        customerProfile: customer,
        chatHistory,
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

  const isHomeView = messages.length === 0;

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
            <button onClick={() => handleQuickAction("Goals")} className="shrink-0 px-4 py-2 bg-brand-light border border-slate-200 rounded-full text-xs font-semibold text-brand-navy hover:bg-slate-200 transition-colors">
              🎯 Goals
            </button>
            <button onClick={() => handleQuickAction("Emergency Plan")} className="shrink-0 px-4 py-2 bg-brand-light border border-slate-200 rounded-full text-xs font-semibold text-brand-navy hover:bg-slate-200 transition-colors">
              📉 Emergency Plan
            </button>
            <button onClick={() => handleQuickAction("Explain SIP to me")} className="shrink-0 px-4 py-2 bg-brand-light border border-slate-200 rounded-full text-xs font-semibold text-brand-navy hover:bg-slate-200 transition-colors">
              📚 Explain SIP to me
            </button>
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
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-5 top-4 w-8 h-8 flex items-center justify-center bg-brand-navy text-brand-gold rounded-full hover:bg-brand-navy/90 transition-colors disabled:opacity-50 disabled:bg-slate-300 disabled:text-white"
          >
            <svg className="w-4 h-4 translate-x-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        {/* SEBI Automated Tool Disclosure */}
        <div className="w-full text-center py-2 px-4 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium leading-tight">
            SEBI Mandated Disclosure: This is an automated algorithmic Investment Advisory tool. Recommendations are based on your declared risk profile. Mutual Fund investments are subject to market risks, read all scheme related documents carefully.
          </p>
        </div>
      </div>
    </div>
  );
}
