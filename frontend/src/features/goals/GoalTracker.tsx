import React from "react";
import {
  Home, GraduationCap, Sunset, Shield,
  TrendingUp, Wallet, Target, CheckCircle2, AlertCircle
} from "lucide-react";
import { Goal } from "@/features/financial-twin/types";

const GOAL_ICONS: Record<string, React.ReactElement> = {
  "Home Purchase":          <Home          className="w-5 h-5 text-blue-600" />,
  "First Home Downpayment": <Home          className="w-5 h-5 text-blue-600" />,
  "Child Education":        <GraduationCap className="w-5 h-5 text-indigo-600" />,
  "Retirement":             <Sunset        className="w-5 h-5 text-orange-600" />,
  "Retirement Corpus":      <Sunset        className="w-5 h-5 text-orange-600" />,
  "Emergency Fund":         <Shield        className="w-5 h-5 text-red-600" />,
  "Wealth Creation":        <TrendingUp    className="w-5 h-5 text-emerald-600" />,
  "Passive Income":         <Wallet        className="w-5 h-5 text-purple-600" />,
};

// A goal is "On Track" if progress >= 60%. Simple heuristic — no timeline data available yet.
function getGoalStatus(progressPercent: number): {
  label: string;
  color: string;
  icon: React.ReactElement;
} {
  if (progressPercent >= 60) {
    return {
      label: "On Track",
      color: "bg-green-100/80 text-green-700 border-green-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    };
  }
  if (progressPercent >= 25) {
    return {
      label: "In Progress",
      color: "bg-amber-100/80 text-amber-700 border-amber-200",
      icon: <AlertCircle className="w-3 h-3" />,
    };
  }
  return {
    label: "Needs Attention",
    color: "bg-red-100/80 text-red-700 border-red-200",
    icon: <AlertCircle className="w-3 h-3" />,
  };
}

interface GoalTrackerProps {
  goals: Goal[];
}

/**
 * Goal Tracker Dashboard Component
 * Renders the customer's active financial goals from their FinancialTwinProfile.
 * Uses Goal type fields directly: name, target, progressPercent.
 */
export function GoalTracker({ goals }: GoalTrackerProps): React.ReactElement {
  if (!goals || goals.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm w-full">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-gray-900 font-semibold">No Goals Created</h3>
        <p className="text-sm text-gray-500">Plan your future with your Wealth Companion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg font-bold text-gray-900 px-1">Active Goals</h3>
      {goals.map((goal, idx) => {
        const progress = Math.min(goal.progressPercent, 100);
        const status = getGoalStatus(progress);
        const amountSaved = Math.round((goal.target * progress) / 100);

        return (
          <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg">
                  {GOAL_ICONS[goal.name] ?? <Target className="w-5 h-5 text-gray-600" />}
                </div>
                <h4 className="font-semibold text-gray-900">{goal.name}</h4>
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${status.color}`}>
                {status.icon}
                {status.label}
              </span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-500 font-medium">
                ₹{amountSaved.toLocaleString("en-IN")} saved
              </span>
              <span className="text-gray-900 font-bold">
                Target: ₹{goal.target.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
