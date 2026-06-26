import { NextResponse } from 'next/server';
import { generateAIResponse, OrchestratorPayload } from '@/services/ai/orchestrator';

/**
 * API Route: /api/chat
 *
 * Streams Server-Sent Events (SSE) back to the client.
 * MOD-3: Extracts sessionId from x-session-id header for audit trail.
 * MOD-3: Returns auditId in metadata chunk for client-side correlation.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, customerProfile, chatHistory } = body;

    if (!message || !customerProfile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // MOD-3: Extract or generate sessionId for audit trail correlation
    const sessionId =
      req.headers.get('x-session-id') ??
      `session-${Date.now()}-${crypto.randomUUID()}`;

    const result = await generateAIResponse(
      message,
      customerProfile,
      chatHistory ?? [],
      sessionId
    ) as OrchestratorPayload;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const keepalive = setInterval(() => {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        }, 8000);

        // Send metadata as the first chunk — includes auditId for L7 correlation
        const metadata = {
          type: 'metadata',
          intent: result.intent,
          wasComplianceBlocked: result.wasComplianceBlocked,
          requiresConsentWidget: (result as { requiresConsentWidget?: boolean }).requiresConsentWidget || false,
          auditId: (result as { auditId?: string }).auditId,
          error: result.success ? undefined : result.error
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));

        // If it was intercepted by a fast-path string return (Governance/Cache/Error)
        if (!result.success || typeof result.data === 'string' || !result.data) {
          const text = result.success ? result.data : (result.error || "Error");
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`));
          }
          clearInterval(keepalive);
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
          clearInterval(keepalive);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Content-Type-Options': 'nosniff',
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
