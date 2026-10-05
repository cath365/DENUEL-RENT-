'use client';

import Header from '@/components/Header';
import Link from 'next/link';

export default function DriverApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="border border-slate-200 bg-white p-7 sm:p-10">
          <div className="inline-flex border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
            Application received
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            Your driver application is waiting for verification
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            DENUEL has received the driver profile and verification documents you submitted. Your account will remain offline until the required documents are reviewed and the driver application is approved.
          </p>

          <div className="mt-8 divide-y divide-slate-100 border border-slate-200">
            {[
              ['1', 'Document review', 'An administrator checks the NRC, driver’s licence, vehicle registration, insurance and police-clearance documents you submitted.'],
              ['2', 'Vehicle and profile check', 'The vehicle details in your application are compared with the submitted registration and insurance information.'],
              ['3', 'Application decision', 'Your dashboard will show whether the application is pending, approved or needs corrections.'],
              ['4', 'Transport access', 'Only an approved driver can switch online and receive matching transport requests.'],
            ].map(([number, title, description]) => (
              <div key={number} className="flex gap-4 p-4 sm:p-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                  {number}
                </div>
                <div>
                  <div className="font-semibold">{title}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 border border-blue-200 bg-blue-50 p-4">
            <div className="font-semibold">No estimated earnings are shown before real trips exist</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Your driver dashboard will calculate earnings from completed transport requests recorded in DENUEL.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/driver" className="inline-flex justify-center bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Open driver dashboard
            </Link>
            <Link href="/transport" className="inline-flex justify-center border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              View transport page
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
