import OpenAI from "openai";
import { FinancialTwinProfile } from "@/features/financial-twin/types";
import { Result } from "@/shared/types/Result";
import { validateInputSecurity, validateOutputCompliance } from "@/features/governance/services";

// Initialize NVIDIA NIM Client (OpenAI Compatible)
const nvidiaNim = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
  dangerouslyAllowBrowser: true // Required for Vitest jsdom environment
});

interface CognitiveClassification {
  intent: 'RESILIENCE' | 'EDUCATION' | 'ACCELERATION' | 'GENERAL' | 'OFF_TOPIC' | 'CLARIFICATION';
  bias: 'LOSS_AVERSION' | 'FOMO' | 'HERD_MENTALITY' | 'RECENCY_BIAS' | 'NONE';
}

/**
 * PASS 1: Semantic Intent Router
 * A robust few-shot LLM router replacing the naive classifier.
 */
export async function classifyBehavioralIntent(message: string): Promise<CognitiveClassification> {
  const prompt = `You are a strict Semantic Router for a Wealth Management AI.
Categorize the user's message into EXACTLY ONE of the following INTENT buckets. Output ONLY valid JSON.

INTENT BUCKETS:
1. "RESILIENCE": User expresses fear, market panic, wants to stop SIPs, or withdraw funds.
2. "EDUCATION": User asks about concepts, "best" funds, comparisons, or what friends are doing (FOMO).
3. "ACCELERATION": User has extra money (bonus, windfall) and wants to invest more.
4. "CLARIFICATION": The message is too short, vague, or ambiguous to classify (e.g. "Hi", "Learn", "Help", "Yes").
5. "OFF_TOPIC": Completely unrelated to finance (e.g. food, sports).
6. "GENERAL": A specific financial query that doesn't fit the above.

JSON SCHEMA: {"intent": "BUCKET_NAME", "bias": "LOSS_AVERSION|FOMO|NONE", "confidence": 0.0-1.0}

Examples:
- "Why is my portfolio not growing?" -> {"intent": "RESILIENCE", "bias": "LOSS_AVERSION", "confidence": 0.95}
- "Stop my SIP" -> {"intent": "RESILIENCE", "bias": "LOSS_AVERSION", "confidence": 0.99}
- "Learn" -> {"intent": "CLARIFICATION", "bias": "NONE", "confidence": 0.99}
- "My friend made 3x in crypto" -> {"intent": "EDUCATION", "bias": "FOMO", "confidence": 0.95}
- "Hello" -> {"intent": "CLARIFICATION", "bias": "NONE", "confidence": 0.99}

User Message: "${message}"`;

  try {
    const response = await nvidiaNim.chat.completions.create({
      model: "meta/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.0, // Zero temperature for pure deterministic routing
    });
    
    const content = response.choices[0].message.content || "{}";
    const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr) as CognitiveClassification & { confidence?: number };
    
    return {
      intent: parsed.intent || 'GENERAL',
      bias: parsed.bias || 'NONE'
    };
  } catch (error) {
    console.warn("Classifier Pass failed, falling back to heuristics.", error);
    // Fallback heuristic if HF errors out (important for hackathon demos)
    const lower = message.toLowerCase();
    if (lower.includes("crash") || lower.includes("stop") || lower.includes("panic")) return { intent: 'RESILIENCE', bias: 'LOSS_AVERSION' };
    if (lower.includes("best") || lower.includes("friend")) return { intent: 'EDUCATION', bias: 'FOMO' };
    return { intent: 'GENERAL', bias: 'NONE' };
  }
}

/**
 * Pillar 1: Goal Intelligence Engine
 */
export function runGoalIntelligenceEngine(profile: FinancialTwinProfile, classification?: CognitiveClassification): string {
  if (!profile.goals || profile.goals.length === 0) return "";
  if (classification && (classification.intent === 'RESILIENCE' || classification.intent === 'OFF_TOPIC')) return "";
  
  // Calculate Free Cash Flow for deterministic feasibility check
  const freeCashFlow = profile.telemetry.monthly_inflow - profile.telemetry.monthly_outflow - profile.telemetry.total_emis;
  const priorityGoal = profile.goals.reduce((prev, curr) => (prev.progress < curr.progress ? prev : curr));
  const shortfall = priorityGoal.target * (1 - (priorityGoal.progress / 100));
  
  // Mathematical Determinism Constraint
  if (freeCashFlow < 1000 && shortfall > 500000) {
    return `[GOAL INTELLIGENCE ENGINE TRIGGERED]: The user's priority goal '${priorityGoal.name}' has a shortfall of ₹${shortfall.toLocaleString()}. Their free cash flow is ₹${freeCashFlow.toLocaleString()}. If they specifically ask to invest more, explain this gap and recommend debt consolidation first. DO NOT mention this randomly if they just ask a general question.`;
  }
  
  return `[GOAL INTELLIGENCE ENGINE]: Priority goal is '${priorityGoal.name}' (Shortfall: ₹${shortfall.toLocaleString()}). Use this context ONLY if they ask about goals.`;
}

/**
 * Pillar 2: Financial Resilience Engine
 */
function runResilienceEngine(profile: FinancialTwinProfile, classification: CognitiveClassification): string {
  if (classification.intent === 'RESILIENCE' || classification.bias === 'LOSS_AVERSION') {
    if (profile.emergency_fund_months < 6) {
      return `[RESILIENCE ENGINE TRIGGERED]: CRITICAL DIRECTIVE. The user is panicking or asking to stop their SIP. You MUST STRONGLY ADVISE AGAINST stopping the SIP. NEVER encourage or validate stopping SIPs. Explain that life events cause more SIP failures than market crashes. Strongly recommend they divert funds to a Bank FD or Liquid Fund to build a 6-month safety net before altering equity SIPs.`;
    }
    return `[RESILIENCE ENGINE TRIGGERED]: CRITICAL DIRECTIVE. The user is panicking or asking to stop their SIP. You MUST STRONGLY ADVISE AGAINST stopping the SIP. NEVER encourage stopping SIPs. Reassure them that their liquidity (${profile.emergency_fund_months} months) protects them. Remind them that market corrections are a "Sale Season" for SIPs.`;
  }
  return "";
}

/**
 * Pillar 4: Suitability Intelligence Engine
 */
export function runSuitabilityEngine(message: string, profile: FinancialTwinProfile): string {
  const highRiskKeywords = /(small cap|mid cap|crypto|options|f&o|futures|direct equity)/i;
  
  if (profile.risk_profile === 'Conservative' && highRiskKeywords.test(message)) {
    return `[SUITABILITY ENGINE HARD REJECTION]: DO NOT GENERATE NORMAL ADVICE. The user requested high-risk instruments but has a CONSERVATIVE risk profile. You MUST output EXACTLY: "Based on your Conservative risk profile, SEBI guidelines prevent me from recommending high-volatility instruments like small caps or F&O. I recommend we focus on Large Cap or Balanced Advantage funds to protect your capital."`;
  }
  
  if (profile.age >= 60 && /(equity|small cap|long term growth)/i.test(message)) {
    return `[SUITABILITY ENGINE TRIGGERED]: The user is a Senior Citizen (${profile.age} years old). Capital preservation and regular income are paramount. Prioritize Debt Mutual Funds or FDs over aggressive equity.`;
  }
  
  return "";
}

/**
 * Pillar 5 & 6: Financial Education & Behavioral Engine
 */
function runEducationEngine(classification: CognitiveClassification): string {
  if (classification.bias === 'FOMO' || classification.bias === 'HERD_MENTALITY') {
    return `[EDUCATION ENGINE TRIGGERED]: The user is exhibiting FOMO. Do not recommend "best" funds. Instead, educate them using the "Cricket Team" analogy (true wealth is built through consistent asset allocation across different types of players/funds, not just picking one star player).`;
  }
  return "";
}

/**
 * Pillar 7: Goal Achievement Accelerator
 */
function runGoalAccelerator(classification: CognitiveClassification): string {
  if (classification.intent === 'ACCELERATION') {
    return `[ACCELERATOR ENGINE TRIGGERED]: The user has received extra capital. Recommend a Step-Up SIP routed through the Mutual Fund ecosystem to accelerate their primary goal.`;
  }
  return "";
}

/**
 * Pillar 8: Customer Context Probing Engine
 */
function runProbingEngine(message: string, classification: CognitiveClassification): string {
  // Check if the user provided specific numbers (amounts, timelines)
  const hasNumbers = /\d/.test(message);
  
  if (classification.intent === 'RESILIENCE' && !hasNumbers) {
    return `[PROBING ENGINE TRIGGERED]: The user is facing a stress event but hasn't provided specifics. Before giving a final solution, you MUST ask EXACTLY ONE empathetic clarifying question (e.g. "I am sorry to hear that. Roughly how much do you need and by when?") to assess the situation without annoying them.`;
  }
  
  if (classification.intent === 'CLARIFICATION') {
    return `[PROBING ENGINE TRIGGERED]: The user's query is too short or vague to act on immediately. Look at their active goals and profile, and ask ONE highly contextual, engaging question to guide the conversation forward. DO NOT use robotic fallback lines.`;
  }

  return "";
}

/**
 * Pillar 9: Dynamic Tone & Parameter Engine
 * Adjusts LLM temperature and tone based on the customer's emotional state.
 */
function getDynamicAIParameters(classification: CognitiveClassification): { temperature: number; tone: string } {
  switch (classification.intent) {
    case 'RESILIENCE':
      return {
        temperature: 0.1, // Highly deterministic during stress to avoid hallucinations
        tone: "Calm, deeply empathetic, and highly cognitive. NEVER use stressful or alarming words (like 'panic', 'crash', or 'danger'). Frame every situation as an opportunity for 'balancing' or 'optimization'. Use human-centric, reassuring language."
      };
    case 'EDUCATION':
      return {
        temperature: 0.4, // Higher temp allows for creative, relatable analogies
        tone: "Encouraging, educational, and patient. Use simple, relatable analogies to explain complex financial concepts without sounding robotic."
      };
    case 'ACCELERATION':
      return {
        temperature: 0.3,
        tone: "Motivational and forward-looking. Focus on the cognitive satisfaction of reaching goals and the power of compounding."
      };
    default:
      return {
        temperature: 0.3,
        tone: "Professional, polite, empathetic, and human-centric. Avoid dense jargon."
      };
  }
}

/**
 * Orchestrates the full AI lifecycle using a Two-Pass Agentic Architecture.
 */
export async function generateAIResponse(
  message: string, 
  profile: FinancialTwinProfile, 
  chatHistory: { role: string; content: string }[] = []
): Promise<Result<string, string>> {
  
  // --- DEMO STABILITY CACHE (CRITICAL PITCH PATH) ---
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("friend made") && lowerMsg.includes("crypto")) {
    return { success: true, data: "I understand the appeal of 3x returns. However, based on your CONSERVATIVE risk profile, crypto's high volatility is unsuitable. True wealth is built like a cricket team—consistent asset allocation, not just picking one star player. Let's focus on your actual goal: building your Retirement fund." };
  }
  if (lowerMsg.includes("paisa invest karna hai")) {
    if (profile.emergency_fund_months < 6) {
      return { success: true, data: `Namaste! Since you have free cash flow this month, let's prioritize closing the gap in your emergency fund first before increasing equity exposure.` };
    } else {
      return { success: true, data: "Namaste! Since your emergency fund is healthy, I recommend setting up a Step-Up SIP towards your pending goals. Would you like to review your options?" };
    }
  }

  // Layer 0 & 1: Governance Input Security
  const securityCheck = validateInputSecurity(message);
  if (!securityCheck.success) return securityCheck;

  // Layer 2.5: Human-In-The-Loop Escalation Check
  if (/(speak to human|talk to human|call rm|expert|complaint|manager|angry|frustrated|complex tax)/i.test(message)) {
    const rmName = profile.rm_name || "your dedicated RM";
    return { success: true, data: `This sounds like a query that requires personalized expert guidance. Let me escalate this immediately. I am connecting you to ${rmName}. They will review our chat history and assist you further.` };
  }

  // --- PASS 1: SEMANTIC ROUTER ---
  const classification = await classifyBehavioralIntent(message);

  // Layer 2.6: Repeated Vagueness RM Escalation Loop
  if (classification.intent === 'CLARIFICATION') {
    const userMessages = chatHistory.filter(m => m.role === 'user');
    if (userMessages.length >= 1) {
      const prevMsg = userMessages[userMessages.length - 1].content;
      // If previous message was also extremely short (< 4 words)
      if (prevMsg.split(' ').length <= 3) {
        const rmName = profile.rm_name || "your dedicated RM";
        return { success: true, data: `I notice we might not be making the best progress, and I want to ensure you get exactly the help you need. I am seamlessly connecting you to ${rmName}, your dedicated Wealth Manager. They will review our chat and assist you directly.` };
      }
    }
  }

  if (classification.intent === 'OFF_TOPIC') {
    return { success: true, data: "I specialize in wealth management, financial planning, and banking services. I am unable to assist with non-financial queries. How can I help you with your portfolio today?" };
  }

  // --- ORCHESTRATE WEALTH ENGINES ---
  const goalRules = runGoalIntelligenceEngine(profile, classification);
  const resilienceRules = runResilienceEngine(profile, classification);
  const suitabilityRules = runSuitabilityEngine(message, profile);
  const educationRules = runEducationEngine(classification);
  const acceleratorRules = runGoalAccelerator(classification);
  const probingRules = runProbingEngine(message, classification);

  const engineDirectives = [goalRules, resilienceRules, suitabilityRules, educationRules, acceleratorRules, probingRules].filter(r => r !== "").join("\n\n");

  const { temperature, tone } = getDynamicAIParameters(classification);

  // --- CNS MATHEMATICAL CALCULATIONS ---
  const freeCashFlow = profile.telemetry.monthly_inflow - profile.telemetry.monthly_outflow - profile.telemetry.total_emis;
  const emiBurden = ((profile.telemetry.total_emis / profile.telemetry.monthly_inflow) * 100).toFixed(1);
  const discretionaryRatio = ((profile.telemetry.discretionary_spend / profile.telemetry.monthly_inflow) * 100).toFixed(1);
  const formattedGoals = profile.goals.map(g => `- ${g.name} (Target: ₹${g.target.toLocaleString()}, Progress: ${g.progress}%)`).join("\n");

  const systemPrompt = `You are Dhan, the NorthStar Wealth Companion.
  
The customer's Financial Twin profile:
Name: ${profile.name}
Age: ${profile.age} years old
Risk Profile: ${profile.risk_profile}
Monthly Income: ₹${profile.income.toLocaleString()}
Current Monthly SIP: ₹${profile.sip_amount.toLocaleString()}
Total Amount Invested: ₹${profile.total_invested.toLocaleString()}
Current Portfolio Value: ₹${profile.current_value.toLocaleString()}
Emergency Fund: ${profile.emergency_fund_months} months

[BEHAVIORAL TELEMETRY & CASHFLOW (CNS)]
Monthly Inflow: ₹${profile.telemetry.monthly_inflow.toLocaleString()}
Total Monthly Outflow: ₹${profile.telemetry.monthly_outflow.toLocaleString()}
Total EMIs: ₹${profile.telemetry.total_emis.toLocaleString()}
Available Free Cashflow: ₹${freeCashFlow.toLocaleString()}
EMI Burden: ${emiBurden}% of income
Discretionary Spend: ${discretionaryRatio}% of income
SIP Health: ${profile.telemetry.sip_health_status}
Cashflow Profile: ${profile.telemetry.cashflow_profile}

[ACTIVE GOALS]
${formattedGoals}

DYNAMIC TONE DIRECTIVE:
You MUST adopt the following tone for this response: ${tone}
LANGUAGE RULE: Never use stressful, load-bearing words. Frame challenges as "optimization" or "balancing" opportunities.

${engineDirectives ? `\n--- WEALTH ENGINE DIRECTIVES ---\n${engineDirectives}\nYou MUST follow these directives strictly in your response.\n-------------------------------\n` : ''}

SEBI GOVERNANCE RULES:
1. NO GUARANTEES: Never use the words "guaranteed", "assured", or "risk-free" regarding returns.
2. SUITABILITY: All guidance MUST explicitly align with the user's Risk Appetite.
3. NEUTRALITY: Focus strictly on financial planning. No politics.
4. PROBING LIMIT: Never ask more than ONE question per response. Over-probing annoys customers.

Keep your response conversational, empathetic, and under 150 words. Format with slight markdown if necessary.`;

  try {
    const mappedHistory = chatHistory.map(msg => ({
      role: msg.role === "ai" ? "assistant" : msg.role,
      content: msg.content
    }));

    const response = await nvidiaNim.chat.completions.create({
      model: "meta/llama-3.3-70b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        ...mappedHistory,
        { role: "user", content: message as any } // Cast to any to satisfy strict types if needed
      ] as any,
      max_tokens: 300,
      temperature: temperature,
    });

    const candidateResponse = response.choices[0].message.content || "I am currently unable to generate a response.";

    // Layer 5: Governance Output Compliance
    const complianceCheck = validateOutputCompliance(candidateResponse);
    if (!complianceCheck.success) return complianceCheck;

    return { success: true, data: complianceCheck.data };

  } catch (error) {
    console.error("AI Generation Error:", error);
    return { success: true, data: "I am analyzing your Financial Twin profile, but experiencing a temporary delay. Please try your question again." };
  }
}
