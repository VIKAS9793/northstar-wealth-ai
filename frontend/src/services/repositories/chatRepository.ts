import { Result } from "@/shared/types/Result";
import { FinancialTwinProfile } from "@/features/financial-twin/types";

export interface ChatRequestPayload {
  message: string;
  customerProfile: FinancialTwinProfile;
  chatHistory?: { role: string; content: string }[];
  sessionId?: string;
  onMetadata?: (intent: string, wasComplianceBlocked: boolean, requiresExplicitConsent: boolean) => void;
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
  requiresExplicitConsent?: boolean;
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
  const timeout = setTimeout(() => controller.abort('Request timed out after 60 seconds'), 60_000); // 60s timeout for complex generations
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(payload.sessionId ? { "x-session-id": payload.sessionId } : {}),
      },
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
              if (payload.onMetadata) payload.onMetadata(data.intent ?? 'GENERAL', !!data.wasComplianceBlocked, !!data.requiresExplicitConsent);
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
    const wasAborted = error instanceof Error && error.name === 'AbortError' || (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError');
    
    if (isNetworkError && !wasAborted && retries > 0) {
      // Wait 1.5s then retry once — covers transient mobile handoff errors and Next.js dev server stalls
      await new Promise(r => setTimeout(r, 1500));
      return sendChatMessage(payload, retries - 1);
    }
    console.error("ChatRepository Error:", error);
    return { success: false, error: error instanceof Error ? error : new Error("Unknown network error") };
  }
}
