"use client";

import Link from "next/link";

export default function SafetyTipsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Stay Safe from Scams
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Zambia has many property scams. Learn how to protect yourself and identify fraudulent listings.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-100 border-l-4 border-red-500 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <h3 className="font-bold text-red-900 text-lg mb-2">
                NEVER pay money before viewing a property in person!
              </h3>
              <p className="text-red-800">
                Scammers often request deposits or "booking fees" for properties that don't exist or they don't own.
                Always insist on viewing the property and verifying ownership before making ANY payment.
              </p>
            </div>
          </div>
        </div>

        {/* Red Flags Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            🚨 Common Red Flags - Warning Signs
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-semibold text-red-900 mb-1">Price Too Good to Be True</h3>
              <p className="text-sm text-gray-700">
                If a 3-bedroom house in Kabulonga costs K2,000/month, it's likely a scam. Research average market prices.
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-semibold text-red-900 mb-1">Urgency Tactics</h3>
              <p className="text-sm text-gray-700">
                "Many people interested, pay now to secure!" - Scammers create false urgency to rush your decision.
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-semibold text-red-900 mb-1">Requests Payment Before Viewing</h3>
              <p className="text-sm text-gray-700">
                Any agent asking for money (deposit, viewing fee, processing fee) before showing the property is suspicious.
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-semibold text-red-900 mb-1">No Physical Address or Vague Location</h3>
              <p className="text-sm text-gray-700">
                Legitimate properties have clear addresses. "Near Arcades" or "Behind Manda Hill" are too vague.
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-semibold text-red-900 mb-1">Won't Meet in Person</h3>
              <p className="text-sm text-gray-700">
                Claims they're "out of town" or only communicates via WhatsApp/calls. Never do business remotely.
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-semibold text-red-900 mb-1">No Verifiable Credentials</h3>
              <p className="text-sm text-gray-700">
                Can't provide NRC, business license, or refuses to show proof of property ownership/authority.
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-semibold text-red-900 mb-1">Stock Photos or Limited Images</h3>
              <p className="text-sm text-gray-700">
                Professional photos from Google or very few images might indicate a fake listing.
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-semibold text-red-900 mb-1">Payment to Mobile Money Only</h3>
              <p className="text-sm text-gray-700">
                Insists on Airtel Money/MTN without meeting, providing receipts, or signing agreements.
              </p>
            </div>
          </div>
        </div>

        {/* Safety Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            ✅ Safety Steps - How to Protect Yourself
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Check Trust Score & Verifications</h3>
                <p className="text-gray-700">
                  Look for the <span className="font-semibold text-green-600">✓ Highly Trusted</span> badge and verified icons (🆔 ID, 🏢 Business, 📱 Phone).
                  Users with low trust scores or no verification should be approached with extra caution.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Read Reviews from Other Users</h3>
                <p className="text-gray-700">
                  Check the agent/landlord's review history. Multiple positive reviews from verified users is a good sign.
                  Be wary of users with no reviews or consistently negative feedback.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Always View Property in Person</h3>
                <p className="text-gray-700">
                  NEVER rent or buy without physically visiting. Check the property condition, neighborhood, and verify
                  it matches the listing photos. Bring a friend or family member.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Verify Ownership Documents</h3>
                <p className="text-gray-700">
                  Ask to see the title deed, landlord authorization letter, or business license. Verify the agent's NRC matches
                  their identity. For commercial properties, check PACRA registration.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                5
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Get Everything in Writing</h3>
                <p className="text-gray-700">
                  Insist on a proper lease agreement with landlord's full details, property address, payment terms, and signatures.
                  Keep all receipts for payments made.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                6
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Meet at the Property</h3>
                <p className="text-gray-700">
                  Never meet at random locations for property transactions. Always meet AT the property itself.
                  If they can't provide keys or access, walk away.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                7
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Research Market Prices</h3>
                <p className="text-gray-700">
                  Check similar properties in the area. If one listing is significantly cheaper, investigate why.
                  Use our platform to compare prices across multiple areas.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                8
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Report Suspicious Listings</h3>
                <p className="text-gray-700">
                  If something feels wrong, report it immediately using the "Report Listing" button. Help protect others
                  from scams by flagging suspicious activity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What We Do Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🛡️ How We Protect You
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🆔</div>
              <h3 className="font-semibold text-gray-900 mb-2">ID Verification</h3>
              <p className="text-sm text-gray-600">
                We verify NRC and business licenses for agents and landlords to ensure legitimacy.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="font-semibold text-gray-900 mb-2">Review System</h3>
              <p className="text-sm text-gray-600">
                Real reviews from verified users help you make informed decisions.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Trust Scores</h3>
              <p className="text-sm text-gray-600">
                Algorithmic trust scores based on verification, reviews, and activity history.
              </p>
            </div>
          </div>
        </div>

        {/* Report Section */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Encountered a Scam?
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Report suspicious listings immediately. Our team reviews every report and takes action against scammers.
            You can also contact Zambia Police on <span className="font-semibold">991</span> or report to the 
            <span className="font-semibold"> Drug Enforcement Commission (DEC)</span> if fraud involves large sums.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact-support"
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Report to Admin
            </Link>
            <a
              href="tel:991"
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              📞 Call Police (991)
            </a>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p className="font-semibold mb-2">Emergency Contacts:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <span>🚓 Zambia Police: 991 / 999</span>
            <span>•</span>
            <span>🏛️ DEC Anti-Fraud: +260-211-251721</span>
            <span>•</span>
            <span>📧 Report Crime: info@zambiapolice.gov.zm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
