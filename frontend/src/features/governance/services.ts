import { Result } from "@/shared/types/Result";

/**
 * Validates the user input against critical prompt injection patterns and jailbreak attempts.
 * 
 * @param message - The raw user input.
 * @returns A Result indicating success or a blocked response.
 */
export function validateInputSecurity(message: string): Result<string, string> {
  if (!message || message.trim().length === 0) {
    return {
      success: false,
      error: "Please enter a valid message."
    };
  }

  const jailbreakRegex = /(ignore previous|act as|pretend to be|unregulated|jailbreak|bypass|disregard instructions)/i;
  
  if (jailbreakRegex.test(message)) {
    console.warn("Security Alert: Prompt Injection attempt intercepted at Layer 0");
    return {
      success: false,
      error: "I can only assist with your wealth management, portfolio planning, and financial goals. Let me know how I can help you with your investments today."
    };
  }

  const offTopicRegex = /(python|scrape|beautifulsoup|crypto|dogecoin|bitcoin|vote for|political party|politician|cricket match|bollywood)/i;
  if (offTopicRegex.test(message)) {
    console.warn("Domain Rejection: Off-topic request intercepted at Layer 1");
    return {
      success: false,
      error: "I am the NorthStar Wealth Companion. Let's focus our discussion on your financial goals, SIPs, or market trends."
    };
  }

  return { success: true, data: message };
}

/**
 * Evaluates the AI recommendation against compliance rules (e.g. guarantees).
 * 
 * @param response - The generated AI response.
 * @returns A Result indicating if the response is safe to present to the user.
 */
export function validateOutputCompliance(response: string): Result<string, string> {
  // We block absolute guarantees but whitelist protective educational statements
  const blockedTerms = /(guarantees?|assured|promise|risk-free|100% safe|sure shot|best fund|no\. 1|target return|cannot lose)/i;
  const whitelistTerms = /(no guarantee|not guarantee|cannot guarantee|never guarantee|no assured|not assured|not risk-free|not 100% safe|no assurance)/i;
  
  const isGuaranteeBlocked = blockedTerms.test(response) && !whitelistTerms.test(response);
  
  if (response && isGuaranteeBlocked) {
    console.warn("Governance Violation Intercepted at Layer 5.");
    return {
      success: false,
      error: "I cannot provide guaranteed return forecasts on these instruments. We should always evaluate investments based on your risk profile and long-term asset allocation strategy."
    };
  }

  return { success: true, data: response };
}
