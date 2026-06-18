/**
 * Strict Domain Types for the Financial Twin
 */

export type InvestorAge = number;

export interface SIPAmount {
  amount: number;
  currency: "INR";
}

export type RiskProfile = "Conservative" | "Moderate" | "Aggressive";

export type PersonaType = "Young Professional" | "Family Planner" | "Pre-Retirement";

export interface Goal {
  name: string;
  target: number;
  /**
   * Completion percentage from 0 to 100.
   * This avoids mixing percent progress with rupee-denominated target amounts.
   */
  progressPercent: number;
}

export interface BehavioralTelemetry {
  monthly_inflow: number;
  monthly_outflow: number;
  total_emis: number;
  discretionary_spend: number;
  sip_health_status: "Consistent" | "Optimization Possible" | "Paused";
  cashflow_profile: "Comfortable" | "Balancing Required";
}

export interface FinancialTwinProfile {
  id: string;
  name: string;
  age: InvestorAge;
  income: number;
  persona_type: PersonaType;
  risk_profile: RiskProfile;
  sip_amount: number;
  total_invested: number;
  current_value: number;
  emergency_fund_months: number;
  goals: Goal[];
  telemetry: BehavioralTelemetry;
  avatar_url?: string;
  rm_name?: string;
  rm_contact?: string;
}
