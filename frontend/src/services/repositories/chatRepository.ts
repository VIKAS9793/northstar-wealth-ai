import { Result } from "@/shared/types/Result";
import { FinancialTwinProfile } from "@/features/financial-twin/types";

export interface ChatRequestPayload {
  message: string;
  customerProfile: FinancialTwinProfile;
  chatHistory?: { role: string; content: string }[];
  onMetadata?: (intent: string, wasComplianceBlocked: boolean) => void;
  onChunk?: (text: string) => void;
}

export interface ChatResponsePayload {
  reply: string;
  intent: string;
  wasComplianceBlocked: boolean;
}

interface ChatSseEvent {
  type?: 'metadata' | 'text';
  intent?: string;
  wasComplianceBlocked?: boolean;
  error?: string;
  text?: string;
}

/**
 * Repository handling all communication with the Chat AI API boundary.
 * Handles Server-Sent Events (SSE) streaming dynamically via callbacks.
 * 
 * @param payload - The chat request payload including the message, twin, and callbacks.
 * @returns A strictly typed Result.
 */
export async function sendChatMessage(payload: ChatRequestPayload, retries = 1): Promise<Result<void>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30s mobile-safe timeout
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: payload.message,
        customerProfile: payload.customerProfile,
        chatHistory: payload.chatHistory || []
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok || !response.body) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          try {
            const data = JSON.parse(dataStr) as ChatSseEvent;
            if (data.type === 'metadata') {
              if (payload.onMetadata) payload.onMetadata(data.intent ?? 'GENERAL', !!data.wasComplianceBlocked);
              if (data.error) throw new Error(data.error);
            } else if (data.type === 'text') {
              if (payload.onChunk && data.text) payload.onChunk(data.text);
            }
          } catch {
            console.error("Failed to parse SSE data:", dataStr);
          }
        }
      }
    }
    
    return { success: true, data: undefined };
  } catch (error) {
    clearTimeout(timeout);
    const isNetworkError = error instanceof TypeError; // fetch network failure
    const wasAborted = error instanceof Error && error.name === 'AbortError';
    
    if (isNetworkError && retries > 0 && !wasAborted) {
      // Wait 1.5s then retry once — covers transient mobile handoff errors
      await new Promise(r => setTimeout(r, 1500));
      return sendChatMessage(payload, retries - 1);
    }
    console.error("ChatRepository Error:", error);
    return { success: false, error: error instanceof Error ? error : new Error("Unknown network error") };
  }
}
