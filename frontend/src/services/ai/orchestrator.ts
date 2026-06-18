import OpenAI from "openai";
import { FinancialTwinProfile, Goal } from "@/features/financial-twin/types";
import { validateInputSecurity, validateOutputCompliance } from "@/features/governance/services";

// Initialize NVIDIA NIM Client (OpenAI Compatible)
const nvidiaNim = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
});

interface CognitiveClassification {
  intent: 'RESILIENCE' | 'EDUCATION' | 'ACCELERATION' | 'GENERAL' | 'OFF_TOPIC' | 'CLARIFICATION' | 'GOAL_PLANNING';
  bias: 'LOSS_AVERSION' | 'FOMO' | 'HERD_MENTALITY' | 'RECENCY_BIAS' | 'NONE';
}

type GoalEngineProfile = Pick<FinancialTwinProfile, 'age' | 'sip_amount' | 'telemetry' | 'goals'>;
type SuitabilityProfile = Pick<FinancialTwinProfile, 'age' | 'risk_profile'>;
type ChatRole = 'user' | 'assistant' | 'system';
type StreamTextChunk = { choices: Array<{ delta?: { content?: string } }> };

/**
 * PASS 1: Semantic Intent Router (Fast Heuristic)
 */
export function classifyBehavioralIntentFast(message: string): CognitiveClassification {
  if (/crash|stop sip|panic|withdraw|redeem|scared|worried/i.test(message))
    return { intent: 'RESILIENCE', bias: 'LOSS_AVERSION' };
  if (/bonus|extra cash|windfall|paisa invest/i.test(message))
    return { intent: 'ACCELERATION', bias: 'NONE' };
  if (/best fund|friend made|crypto|my friend|everyone is/i.test(message))
    return { intent: 'EDUCATION', bias: 'FOMO' };
  if (/last year|past year|recent/i.test(message))
    return { intent: 'EDUCATION', bias: 'RECENCY_BIAS' };
  if (/sport|cricket|food|recipe|weather/i.test(message))
    return { intent: 'OFF_TOPIC', bias: 'NONE' };
  if (message.trim().split(' ').length <= 2)
    return { intent: 'CLARIFICATION', bias: 'NONE' };
  if (/home|house|retire|retirement|education|child|corpus|goal|invest|marriage|wealth|emergency fund/i.test(message))
    return { intent: 'GOAL_PLANNING', bias: 'NONE' };
  return { intent: 'GENERAL', bias: 'NONE' };
}

function calculateGoalMetrics(profile: GoalEngineProfile, goal: Goal) {
  const GOAL_HORIZONS: Record<string, number> = {
    'First Home Downpayment': 8,
    'Home Purchase': 8,
    'Child Education': 15,
    'Emergency Fund': 1,
    'Retirement': Math.max(60 - profile.age, 1),
    'Wealth Creation': 10,
    'Marriage Planning': 5,
    'Passive Income': 10
  };
  const remainingYears = GOAL_HORIZONS[goal.name] ?? Math.max(60 - profile.age, 1);
  const monthsRemaining = remainingYears * 12;
  const shortfall = goal.target * (1 - goal.progressPercent / 100);
  const requiredMonthlySIP = shortfall / monthsRemaining; // simplified, non-compounded baseline
  const currentSIPRatio = profile.sip_amount / requiredMonthlySIP;
  const goalProbability = Math.min(Math.round(currentSIPRatio * 100), 100);

  return {
    targetCorpus: goal.target,
    shortfall,
    requiredMonthlySIP: Math.round(requiredMonthlySIP),
    goalProbability,
    monthsRemaining
  };
}

/**
 * Pillar 1: Goal Intelligence Engine
 */
export function runGoalIntelligenceEngine(profile: GoalEngineProfile, classification?: CognitiveClassification): string {
  if (!profile.goals || profile.goals.length === 0) return "";
  if (classification && (classification.intent === 'RESILIENCE' || classification.intent === 'OFF_TOPIC')) return "";
  
  // Calculate Free Cash Flow for deterministic feasibility check
  const freeCashFlow = profile.telemetry.monthly_inflow - profile.telemetry.monthly_outflow - profile.telemetry.total_emis;
  const priorityGoal = profile.goals.reduce((prev, curr) => (prev.progressPercent < curr.progressPercent ? prev : curr));
  
  const metrics = calculateGoalMetrics(profile, priorityGoal);
  
  // Mathematical Determinism Constraint
  if (freeCashFlow < 1000 && metrics.shortfall > 500000) {
    return `[GOAL INTELLIGENCE ENGINE TRIGGERED]: The user's priority goal '${priorityGoal.name}' has a shortfall of ₹${metrics.shortfall.toLocaleString()}. Their free cash flow is ₹${freeCashFlow.toLocaleString()}. If they specifically ask to invest more, explain this gap and recommend debt consolidation first. DO NOT mention this randomly if they just ask a general question.`;
  }
  
  return `[GOAL INTELLIGENCE ENGINE]: Priority goal is '${priorityGoal.name}'. Target: ₹${metrics.targetCorpus.toLocaleString()}, Shortfall: ₹${metrics.shortfall.toLocaleString()}, Required SIP: ₹${metrics.requiredMonthlySIP.toLocaleString()}/month, Probability of Success: ${metrics.goalProbability}%. Use this context ONLY if they ask about goals.`;
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
export function runSuitabilityEngine(message: string, profile: SuitabilityProfile): string {
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
    return `[EDUCATION ENGINE TRIGGERED]: The user is exhibiting FOMO or Herd Mentality. Do not recommend "best" funds. Instead, educate them using the "Cricket Team" analogy (true wealth is built through consistent asset allocation across different types of players/funds, not just picking one star player).`;
  }
  if (classification.bias === 'RECENCY_BIAS') {
    return `[EDUCATION ENGINE TRIGGERED]: User is exhibiting Recency Bias — extrapolating recent performance into future. Educate using the 'Sale Season' analogy to explain that markets correct and SIPs benefit from it.`;
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

export interface OrchestratorPayload {
  success: boolean;
  data?: string | AsyncIterable<StreamTextChunk>;
  error?: string;
  intent: string;
  wasComplianceBlocked: boolean;
}

/**
 * Orchestrates the full AI lifecycle using a Two-Pass Agentic Architecture.
 */
export async function generateAIResponse(
  message: string, 
  profile: FinancialTwinProfile, 
  chatHistory: { role: string; content: string }[] = []
): Promise<OrchestratorPayload> {
  
  // --- DEMO STABILITY CACHE (CRITICAL PITCH PATH) ---
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("paisa invest karna hai")) {
    if (profile.emergency_fund_months < 6) {
      return { success: true, data: `Namaste! Since you have free cash flow this month, let's prioritize closing the gap in your emergency fund first before increasing equity exposure.`, intent: 'ACCELERATION', wasComplianceBlocked: false };
    } else {
      return { success: true, data: "Namaste! Since your emergency fund is healthy, I recommend setting up a Step-Up SIP towards your pending goals. Would you like to review your options?", intent: 'ACCELERATION', wasComplianceBlocked: false };
    }
  }

  // Layer 0 & 1: Governance Input Security
  const securityCheck = validateInputSecurity(message);
  if (!securityCheck.success) {
    return { success: true, data: securityCheck.error, intent: 'GENERAL', wasComplianceBlocked: true };
  }

  // Layer 2.5: Human-In-The-Loop Escalation Check
  if (/(speak to human|talk to human|call rm|expert|complaint|manager|angry|frustrated|complex tax)/i.test(message)) {
    const rmName = profile.rm_name || "your dedicated RM";
    return { success: true, data: `This sounds like a query that requires personalized expert guidance. Let me escalate this immediately. I am connecting you to ${rmName}. They will review our chat history and assist you further.`, intent: 'GENERAL', wasComplianceBlocked: false };
  }

  // --- PASS 1: SEMANTIC ROUTER ---
  const classification = classifyBehavioralIntentFast(message);

  // Layer 2.6: Repeated Vagueness RM Escalation Loop
  if (classification.intent === 'CLARIFICATION') {
    const userMessages = chatHistory.filter(m => m.role === 'user');
    if (userMessages.length >= 1) {
      const prevMsg = userMessages[userMessages.length - 1].content;
      // If previous message was also extremely short (< 4 words)
      if (prevMsg.split(' ').length <= 3) {
        const rmName = profile.rm_name || "your dedicated RM";
        return { success: true, data: `I notice we might not be making the best progress, and I want to ensure you get exactly the help you need. I am seamlessly connecting you to ${rmName}, your dedicated Wealth Manager. They will review our chat and assist you directly.`, intent: 'CLARIFICATION', wasComplianceBlocked: false };
      }
    }
  }

  if (classification.intent === 'OFF_TOPIC') {
    return { success: true, data: "I specialize in wealth management, financial planning, and banking services. I am unable to assist with non-financial queries. How can I help you with your portfolio today?", intent: 'OFF_TOPIC', wasComplianceBlocked: false };
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
  const formattedGoals = profile.goals.map(g => `- ${g.name} (Target: ₹${g.target.toLocaleString()}, Progress: ${g.progressPercent}%)`).join("\n");

  const systemPrompt = `You are Dhan, the NorthStar Wealth Companion.
  
The customer's money readiness profile:
Name: ${profile.name}
Age: ${profile.age} years old
Risk Profile: ${profile.risk_profile}
Monthly Income: ₹${profile.income.toLocaleString()}
Current Monthly SIP: ₹${profile.sip_amount.toLocaleString()}
Total Amount Invested: ₹${profile.total_invested.toLocaleString()}
Current Portfolio Value: ₹${profile.current_value.toLocaleString()}
Emergency Fund: ${profile.emergency_fund_months} months
Relationship Manager: ${profile.rm_name || "Unassigned"}
RM Contact: ${profile.rm_contact || "N/A"}

[BEHAVIORAL CASH-FLOW CONTEXT]
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

Keep your response conversational, empathetic, and under 150 words. DO NOT use italics or excessive markdown formatting. Output clean, professional plain text with basic paragraph breaks.`;

  try {
    const mappedHistory = chatHistory.map(msg => ({
      role: msg.role === "ai" ? "assistant" : msg.role,
      content: msg.content
    })).filter((msg): msg is { role: Exclude<ChatRole, 'system'>; content: string } =>
      msg.role === "assistant" || msg.role === "user"
    );

    const response = await nvidiaNim.chat.completions.create({
      model: "meta/llama-3.3-70b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        ...mappedHistory,
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: temperature,
      stream: false,
    });

    const fullText = response.choices[0]?.message?.content || "";
    
    // Layer 5: Output Compliance Validation
    const complianceCheck = validateOutputCompliance(fullText);
    const finalOutput = complianceCheck.success ? complianceCheck.data! : complianceCheck.error!;

    // Create an async generator to simulate streaming so the UI typing effect works
    async function* simulateStream(text: string) {
      const chunkSize = 4;
      for (let i = 0; i < text.length; i += chunkSize) {
        await new Promise(r => setTimeout(r, 20)); // Simulate token arrival latency
        yield { choices: [{ delta: { content: text.slice(i, i + chunkSize) } }] };
      }
    }

    return { 
      success: true, 
      data: simulateStream(finalOutput), 
      intent: classification.intent, 
      wasComplianceBlocked: !complianceCheck.success 
    };

  } catch (error) {
    console.error("AI Generation Error:", error);
    return { success: true, data: "I am analyzing your money readiness profile, but experiencing a temporary delay. Please try your question again.", intent: 'GENERAL', wasComplianceBlocked: false };
  }
}
