import React from "react";
import Link from "next/link";

interface SafetyWarningProps {
  type: "price" | "urgency" | "new_user" | "unverified" | "low_trust";
  trustScore?: number;
  price?: number;
  avgPrice?: number;
}

export function SafetyWarning({ type, trustScore, price, avgPrice }: SafetyWarningProps) {
  const warnings = {
    price: {
      icon: "💰",
      title: "Price Alert",
      message: `This property is priced ${avgPrice && price ? Math.round(((avgPrice - price) / avgPrice) * 100) : "significantly"}% below market average. Verify the listing is legitimate before proceeding.`,
      severity: "warning",
    },
    urgency: {
      icon: "⏰",
      title: "Urgency Tactic Detected",
      message: "Be cautious of claims like 'urgent', 'limited time', or 'many interested'. This is a common scam tactic to rush your decision.",
      severity: "warning",
    },
    new_user: {
      icon: "🆕",
      title: "New User",
      message: "This user is new to the platform. Exercise extra caution and verify all documents before making payments.",
      severity: "info",
    },
    unverified: {
      icon: "❗",
      title: "Unverified User",
      message: "This user has not completed ID or business verification. We recommend only dealing with verified users.",
      severity: "danger",
    },
    low_trust: {
      icon: "⚠️",
      title: `Low Trust Score (${trustScore || 0}/100)`,
      message: "This user has a low trust score. Read reviews carefully and verify their identity before proceeding.",
      severity: "danger",
    },
  };

  const warning = warnings[type];
  
  const severityStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
    danger: "bg-red-50 border-red-200 text-red-900",
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${severityStyles[warning.severity]}`}>
      <div className="flex gap-3">
        <div className="text-2xl flex-shrink-0">{warning.icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{warning.title}</h4>
          <p className="text-sm mb-2">{warning.message}</p>
          <Link
            href="/safety-tips"
            className="text-sm font-medium underline hover:no-underline"
          >
            Learn how to stay safe →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SafetyChecklist() {
  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
      <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
        <span>✅</span> Safety Checklist Before Proceeding
      </h3>
      
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            I have verified the user's <strong>Trust Score</strong> and <strong>verification badges</strong>
          </span>
        </label>
        
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            I have <strong>read reviews</strong> from other users
          </span>
        </label>
        
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            I will <strong>view the property in person</strong> before paying
          </span>
        </label>
        
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            I will verify <strong>ownership documents</strong> (Title deed, NRC, Business license)
          </span>
        </label>
        
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            I will <strong>NOT pay any money</strong> before viewing and verifying
          </span>
        </label>
      </div>
      
      <div className="mt-4 pt-4 border-t border-green-300">
        <Link
          href="/safety-tips"
          className="text-sm font-semibold text-green-700 hover:text-green-900 flex items-center gap-1"
        >
          Read full safety guide <span>→</span>
        </Link>
      </div>
    </div>
  );
}
