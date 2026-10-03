"use client";

import React from 'react';

export default function RentersGuide() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Renters Guide</h1>
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-2">How to Stand Out as an Applicant</h2>
          <p>Having a strong rental application can make the difference. Here are tips:</p>
          <ul className="list-disc ml-6">
            <li>Maintain good credit score</li>
            <li>Provide references from previous landlords</li>
            <li>Have proof of stable income</li>
            <li>Be prepared for background checks</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Finding a Place in a New City</h2>
          <p>Moving to a new city? Consider:</p>
          <ul className="list-disc ml-6">
            <li>Research neighborhoods for safety and amenities</li>
            <li>Visit during different times of day</li>
            <li>Check commute times</li>
            <li>Look for areas with good public transport</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Understanding Lease Terms</h2>
          <p>Key things to know:</p>
          <ul className="list-disc ml-6">
            <li>Rent amount and due dates</li>
            <li>Security deposit requirements</li>
            <li>Pet policies</li>
            <li>Termination clauses</li>
          </ul>
        </section>
      </div>
    </div>
  );
}