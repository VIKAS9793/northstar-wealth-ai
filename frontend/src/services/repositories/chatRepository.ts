import { Result } from "@/shared/types/Result";
import { FinancialTwinProfile } from "@/features/financial-twin/types";

export interface ChatRequestPayload {
  message: string;
  customerProfile: FinancialTwinProfile;
  chatHistory?: { role: string; content: string }[];
}

/**
 * Repository handling all communication with the Chat AI API boundary.
 * 
 * @param payload - The chat request payload including the message and financial twin.
 * @returns A strictly typed Result containing the AI response string or an Error.
 */
export async function sendChatMessage(payload: ChatRequestPayload): Promise<Result<string>> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: payload.message,
        customerProfile: payload.customerProfile,
        chatHistory: payload.chatHistory || []
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data: data.reply };
  } catch (error) {
    console.error("ChatRepository Error:", error);
    return { success: false, error: error instanceof Error ? error : new Error("Unknown network error") };
  }
}
