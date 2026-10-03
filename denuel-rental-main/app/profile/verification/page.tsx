"use client";

import React, { useState, useEffect } from "react";
import { csrfFetch } from "@/lib/csrf";
import { VerificationBadge, TrustScoreBar } from "@/components/VerificationBadge";
import Link from "next/link";

interface VerificationData {
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdVerified: boolean;
  isBusinessVerified: boolean;
  trustScore: number;
  verifiedAt?: string;
  nrcNumber?: string;
  businessLicense?: string;
  companyName?: string;
  verificationDocs: any[];
  reviewsReceived: any[];
}

export default function VerificationPage() {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("NATIONAL_ID");
  const [nrcNumber, setNrcNumber] = useState("");
  const [businessLicense, setBusinessLicense] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await csrfFetch("/api/verification");
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setNrcNumber(result.nrcNumber || "");
        setBusinessLicense(result.businessLicense || "");
        setCompanyName(result.companyName || "");
      }
    } catch (err) {
      console.error("Failed to fetch verification data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // In a real app, upload to S3 first
      // For now, we'll use a placeholder URL
      const documentUrl = `https://example.com/docs/${selectedFile.name}`;

      const response = await csrfFetch("/api/verification", {
        method: "POST",
        body: JSON.stringify({
          documentType,
          documentUrl,
          metadata: {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
          },
        }),
      });

      if (response.ok) {
        alert("Document submitted for review!");
        setSelectedFile(null);
        fetchData();
      } else {
        alert("Failed to submit document");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      const response = await csrfFetch("/api/verification", {
        method: "PATCH",
        body: JSON.stringify({
          nrcNumber,
          businessLicense,
          companyName,
        }),
      });

      if (response.ok) {
        alert("Information updated!");
        fetchData();
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load verification data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get Verified & Build Trust
          </h1>
          <p className="text-lg text-gray-600">
            Increase your visibility and credibility by completing verification
          </p>
        </div>

        {/* Trust Score Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Trust Profile</h2>
              <VerificationBadge user={data} size="lg" showDetails={true} />
            </div>
            <div className="w-full md:w-64">
              <TrustScoreBar score={data.trustScore} />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Complete verifications to increase your score
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <h3 className="font-bold text-gray-900 mb-3">🌟 Benefits of Verification</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ <strong>Higher ranking</strong> in search results</li>
              <li>✓ <strong>Trust badge</strong> displayed on your listings</li>
              <li>✓ <strong>More inquiries</strong> from potential renters/buyers</li>
              <li>✓ <strong>Reduced scam reports</strong> on your properties</li>
              <li>✓ <strong>Access to premium features</strong></li>
            </ul>
          </div>
        </div>

        {/* Verification Status */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className={`rounded-xl p-6 border-2 ${data.isIdVerified ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">🆔</div>
              <div>
                <h3 className="font-bold text-gray-900">ID Verification</h3>
                <p className="text-sm text-gray-600">NRC or Passport</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Verify your identity with a National Registration Card or Passport
            </p>
            {data.isIdVerified ? (
              <div className="flex items-center gap-2 text-green-700 font-medium">
                <span>✓</span> Verified
              </div>
            ) : (
              <div className="text-orange-700 font-medium">⏳ Pending verification</div>
            )}
          </div>

          <div className={`rounded-xl p-6 border-2 ${data.isBusinessVerified ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">🏢</div>
              <div>
                <h3 className="font-bold text-gray-900">Business Verification</h3>
                <p className="text-sm text-gray-600">License & Registration</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Verify your business with a trading license or PACRA certificate
            </p>
            {data.isBusinessVerified ? (
              <div className="flex items-center gap-2 text-green-700 font-medium">
                <span>✓</span> Verified
              </div>
            ) : (
              <div className="text-orange-700 font-medium">⏳ Pending verification</div>
            )}
          </div>

          <div className={`rounded-xl p-6 border-2 ${data.isPhoneVerified ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="font-bold text-gray-900">Phone Verification</h3>
                <p className="text-sm text-gray-600">SMS Verification</p>
              </div>
            </div>
            {data.isPhoneVerified ? (
              <div className="flex items-center gap-2 text-green-700 font-medium">
                <span>✓</span> Verified
              </div>
            ) : (
              <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Verify Now
              </button>
            )}
          </div>

          <div className={`rounded-xl p-6 border-2 ${data.isEmailVerified ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📧</div>
              <div>
                <h3 className="font-bold text-gray-900">Email Verification</h3>
                <p className="text-sm text-gray-600">Confirm your email</p>
              </div>
            </div>
            {data.isEmailVerified ? (
              <div className="flex items-center gap-2 text-green-700 font-medium">
                <span>✓</span> Verified
              </div>
            ) : (
              <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Verify Now
              </button>
            )}
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NRC Number
              </label>
              <input
                type="text"
                value={nrcNumber}
                onChange={(e) => setNrcNumber(e.target.value)}
                placeholder="123456/78/9"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name (Optional)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business License Number (Optional)
              </label>
              <input
                type="text"
                value={businessLicense}
                onChange={(e) => setBusinessLicense(e.target.value)}
                placeholder="BL123456"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleUpdateInfo}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Update Information
            </button>
          </div>
        </div>

        {/* Upload Documents */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Verification Documents</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="NATIONAL_ID">National ID / NRC</option>
                <option value="PASSPORT">Passport</option>
                <option value="BUSINESS_LICENSE">Business License</option>
                <option value="PROOF_OF_ADDRESS">Proof of Address</option>
                <option value="PROPERTY_TITLE">Property Title Deed</option>
                <option value="TAX_CLEARANCE">Tax Clearance Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="w-full px-4 py-3 rounded-lg border border-gray-300"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Submit for Review"}
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Documents are reviewed within 24-48 hours. Ensure images are clear and readable.
            </p>
          </div>
        </div>

        {/* Submitted Documents */}
        {data.verificationDocs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submitted Documents</h2>
            
            <div className="space-y-4">
              {data.verificationDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {doc.documentType.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted {new Date(doc.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      doc.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : doc.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learn More */}
        <div className="mt-8 text-center">
          <Link
            href="/safety-tips"
            className="text-blue-600 hover:underline font-medium"
          >
            Learn about our safety & anti-scam measures →
          </Link>
        </div>
      </div>
    </div>
  );
}
