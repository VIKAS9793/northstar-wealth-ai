import { FinancialTwinProfile } from "./types";

/**
 * MOCK DATA CITATION: 
 * All SIP data, portfolio amounts, and customer profiles fetched or hardcoded here 
 * are synthetically generated for the Hackathon POC. They do not represent real 
 * Bank customer data. References to Bank products are structural citations only.
 */

export const mockPersonas: FinancialTwinProfile[] = [
  {
    id: "p1_young_pro",
    name: "Rohan Sharma",
    age: 28,
    income: 1200000,
    persona_type: "Young Professional",
    risk_profile: "Aggressive",
    sip_amount: 15000,
    total_invested: 350000,
    current_value: 410000,
    emergency_fund_months: 2, // Low resilience, good for demoing the Resilience Engine
    goals: [
      { name: "First Home Downpayment", target: 2000000, progress: 20 }
    ],
    telemetry: {
      monthly_inflow: 100000,
      monthly_outflow: 85000,
      total_emis: 15000,
      discretionary_spend: 40000, // High discretionary
      sip_health_status: "Consistent",
      cashflow_profile: "Comfortable"
    },
    rm_name: "Vikram Singh",
    rm_contact: "vikram.singh@demo.wealth.com",
    avatar_url: "/rohan.png"
  },
  {
    id: "p2_family_planner",
    name: "Priya Patel",
    age: 36,
    income: 2400000,
    persona_type: "Family Planner",
    risk_profile: "Moderate",
    sip_amount: 30000,
    total_invested: 1800000,
    current_value: 2200000,
    emergency_fund_months: 6,
    goals: [
      { name: "Child Education", target: 5000000, progress: 40 },
      { name: "Retirement", target: 30000000, progress: 5 }
    ],
    telemetry: {
      monthly_inflow: 200000,
      monthly_outflow: 185000,
      total_emis: 100000, // High EMIs causing stress
      discretionary_spend: 25000,
      sip_health_status: "Optimization Possible",
      cashflow_profile: "Balancing Required"
    },
    rm_name: "Neha Sharma",
    rm_contact: "neha.sharma@demo.wealth.com",
    avatar_url: "/priya.png"
  },
  {
    id: "p3_pre_retiree",
    name: "Anil Desai",
    age: 52,
    income: 3500000,
    persona_type: "Pre-Retirement",
    risk_profile: "Conservative",
    sip_amount: 50000,
    total_invested: 8500000,
    current_value: 12000000,
    emergency_fund_months: 12,
    goals: [
      { name: "Retirement Corpus", target: 20000000, progress: 60 }
    ],
    telemetry: {
      monthly_inflow: 290000,
      monthly_outflow: 150000,
      total_emis: 20000,
      discretionary_spend: 40000,
      sip_health_status: "Consistent",
      cashflow_profile: "Comfortable"
    },
    rm_name: "Amit Desai",
    rm_contact: "amit.desai@demo.wealth.com",
    avatar_url: "/anil.png"
  }
];

/**
 * Retrieves the full Financial Twin projection payload for a specific persona.
 * 
 * @param personaId - The unique ID of the persona to load.
 * @returns The synthetic financial twin payload.
 */
export async function getMockFinancialTwin(personaId: string = "p1_young_pro") {
  // Simulate network delay for realism (optional, kept small to not hurt demo)
  await new Promise(resolve => setTimeout(resolve, 300));

  const persona = mockPersonas.find(p => p.id === personaId) || mockPersonas[0];
  
  return {
    customer: {
      id: persona.id,
      name: persona.name,
      age: persona.age,
      income: persona.income,
      risk_profile: persona.risk_profile,
      persona_type: persona.persona_type,
      rm_name: persona.rm_name,
      rm_contact: persona.rm_contact
    },
    portfolios: [
      {
        id: `${persona.id}_port1`,
        customer_id: persona.id,
        total_invested: persona.total_invested,
        current_value: persona.current_value,
        sip_amount: persona.sip_amount,
        emergency_fund_months: persona.emergency_fund_months,
        goals: persona.goals
      }
    ]
  };
}

/**
 * Retrieves the base profiles for the Persona Selection screen.
 * 
 * @returns An array of all synthetic personas.
 */
export function getAllPersonas(): FinancialTwinProfile[] {
  return mockPersonas;
}
