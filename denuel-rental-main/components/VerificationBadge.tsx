import React from "react";

interface User {
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isIdVerified?: boolean;
  isBusinessVerified?: boolean;
  trustScore?: number;
  reviewsReceived?: any[];
}

interface VerificationBadgeProps {
  user: User;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function VerificationBadge({
  user,
  size = "md",
  showDetails = false,
}: VerificationBadgeProps) {
  const trustScore = user.trustScore || 0;
  const avgRating = user.reviewsReceived?.length
    ? user.reviewsReceived.reduce((sum: number, r: any) => sum + r.rating, 0) /
      user.reviewsReceived.length
    : 0;

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { label: "Highly Trusted", color: "text-green-600", bg: "bg-green-50", icon: "✓" };
    if (score >= 60) return { label: "Trusted", color: "text-blue-600", bg: "bg-blue-50", icon: "✓" };
    if (score >= 40) return { label: "Verified", color: "text-yellow-600", bg: "bg-yellow-50", icon: "~" };
    return { label: "New User", color: "text-gray-600", bg: "bg-gray-50", icon: "?" };
  };

  const trustLevel = getTrustLevel(trustScore);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Trust Score Badge */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${trustLevel.bg} ${trustLevel.color} ${sizeClasses[size]}`}
      >
        <span className={iconSizes[size]}>{trustLevel.icon}</span>
        <span>{trustLevel.label}</span>
        {size !== "sm" && (
          <span className="ml-1 opacity-75">({trustScore}/100)</span>
        )}
      </div>

      {/* Verification Icons */}
      {showDetails && (
        <div className="flex flex-wrap gap-1.5">
          {user.isIdVerified && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"
              title="ID Verified"
            >
              🆔 ID Verified
            </span>
          )}
          {user.isBusinessVerified && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700"
              title="Business Verified"
            >
              🏢 Business
            </span>
          )}
          {user.isPhoneVerified && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700"
              title="Phone Verified"
            >
              📱 Phone
            </span>
          )}
          {avgRating > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700"
              title={`Average Rating: ${avgRating.toFixed(1)}/5`}
            >
              ⭐ {avgRating.toFixed(1)} ({user.reviewsReceived?.length})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function TrustScoreBar({ score }: { score: number }) {
  const percentage = Math.min(Math.max(score, 0), 100);
  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-blue-500";
    if (s >= 40) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">Trust Score</span>
        <span className="text-xs font-bold text-gray-900">{score}/100</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
