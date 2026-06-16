import { NextResponse } from 'next/server';
import { generateAIResponse } from '@/services/ai/orchestrator';

/**
 * API Route: /api/chat
 * 
 * Pure API boundary. All business logic, governance, and AI execution
 * has been strictly extracted to the Orchestrator layer to comply with
 * the Enterprise Engineering Standards.
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

    // Pass the message, profile, and history down to the Orchestrator
    const result = await generateAIResponse(message, customerProfile, chatHistory || []);

    if (!result.success) {
      // Governance or Security failure caught gracefully
      return NextResponse.json({ reply: result.error });
    }

    return NextResponse.json({ reply: result.data });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
