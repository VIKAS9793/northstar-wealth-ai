import { NextResponse } from 'next/server';
import { generateAIResponse, OrchestratorPayload } from '@/services/ai/orchestrator';

export const maxDuration = 60; // Prevent 10s serverless timeouts on Netlify/Vercel
export const runtime = 'edge'; // Deploy to Edge Runtime to completely bypass wall-clock timeouts

/**
 * API Route: /api/chat
 *
 * Streams Server-Sent Events (SSE) back to the client.
 * MOD-3: Extracts sessionId from x-session-id header for audit trail.
 * MOD-3: Returns auditId in metadata chunk for client-side correlation.
 */
const rateLimit = new Map<string, { count: number, resetAt: number }>();

export async function POST(req: Request) {
  try {
    // SECURITY: Extract Device & Network Identity for Audit Trail
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // SECURITY: In-Memory Rate Limiting (20 req / minute per IP)
    const now = Date.now();
    const ipData = rateLimit.get(clientIp);
    if (ipData && ipData.resetAt > now) {
      if (ipData.count >= 20) {
        return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
      }
      ipData.count++;
    } else {
      rateLimit.set(clientIp, { count: 1, resetAt: now + 60000 });
    }

    // SECURITY: Origin Validation
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const isAllowed = origin.includes('localhost') || origin.includes('netlify.app') || (process.env.ALLOWED_ORIGIN && origin.includes(process.env.ALLOWED_ORIGIN));
    if (process.env.NODE_ENV === 'production' && origin && !isAllowed) {
      return NextResponse.json({ error: 'Forbidden Origin' }, { status: 403 });
    }

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
      `session-${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Start keepalive instantly to bypass Netlify 10s Inactivity Timeout
        const keepalive = setInterval(() => {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        }, 8000);

        try {
          // Block inside the stream context so the HTTP response headers are already sent
          const result = await generateAIResponse(
            message,
            customerProfile,
            chatHistory ?? [],
            sessionId,
            clientIp,
            userAgent
          ) as OrchestratorPayload;

          // Send metadata as the first chunk — includes auditId for L7 correlation
          const metadata = {
            type: 'metadata',
            intent: result.intent,
            wasComplianceBlocked: result.wasComplianceBlocked,
            auditId: (result as { auditId?: string }).auditId,
            requiresExplicitConsent: result.requiresExplicitConsent,
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
