import { NextResponse } from 'next/server';
import { generateAIResponse } from '@/services/ai/orchestrator';

/**
 * API Route: /api/chat
 * 
 * Streams Server-Sent Events (SSE) back to the client.
 * Metadata (intent, compliance block) is sent in the first chunk,
 * followed by the streamed text deltas.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, customerProfile, chatHistory } = body;

    if (!message || !customerProfile) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    const result = await generateAIResponse(message, customerProfile, chatHistory || []);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send metadata as the first chunk
        const metadata = {
          type: 'metadata',
          intent: result.intent,
          wasComplianceBlocked: result.wasComplianceBlocked,
          error: result.success ? undefined : result.error
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));

        // If it was intercepted by a fast-path string return (Governance/Cache/Error)
        if (!result.success || typeof result.data === 'string') {
          const text = result.success ? result.data : (result.error || "Error");
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`));
          }
          controller.close();
          return;
        }

        // Iterate over the OpenAI stream
        try {
          for await (const chunk of result.data) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: content })}\n\n`));
            }
          }
        } catch (streamError) {
          console.error("Stream reading error:", streamError);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: "\\n[Connection Interrupted]" })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
