import React from "react";
import { User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MessageProps {
  role: "user" | "ai";
  content: string;
}

/**
 * Chat Bubble Component
 * 
 * Renders the conversation history using standard 2D banking UI patterns.
 */
export function ChatBubble({ role, content }: MessageProps): React.ReactElement {
  if (role === "user") {
    return (
      <div className="self-end max-w-[85%] flex items-end gap-3 mb-4">
        <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm">
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mb-1">
          <User className="w-5 h-5 text-indigo-600" />
        </div>
      </div>
    );
  }

  // AI Message
  return (
    <div className="self-start max-w-[85%] flex items-end gap-3 mb-4">
      <div className="bg-white border-l-4 border-l-teal-500 border-t border-r border-b border-gray-200 p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-800 leading-relaxed prose prose-sm prose-indigo">
        <p className="font-bold text-xs text-teal-700 mb-1">Dhan:</p>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
