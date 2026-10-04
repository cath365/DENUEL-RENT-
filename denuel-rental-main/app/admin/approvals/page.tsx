import Link from 'next/link';
import Header from '../../../components/Header';

export default function AdminApprovalsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold text-blue-700">Admin · Trust & safety</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Approvals</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Use the dedicated verification workspaces below. DENUEL does not show demo applications or placeholder applicants when an API fails.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <Link
            href="/admin/drivers"
            className="border border-slate-200 bg-white p-6 transition hover:border-slate-950"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transport</div>
            <h2 className="mt-2 text-xl font-bold">Driver verification</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review driver identity, vehicle information, private verification documents, approval, suspension and reactivation.
            </p>
            <div className="mt-5 text-sm font-semibold text-blue-700">Open driver management →</div>
          </Link>

          <Link
            href="/admin/service-providers"
            className="border border-slate-200 bg-white p-6 transition hover:border-slate-950"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Property services</div>
            <h2 className="mt-2 text-xl font-bold">Service provider verification</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review companies and individual professionals, inspect private documents and control verified marketplace access.
            </p>
            <div className="mt-5 text-sm font-semibold text-blue-700">Open provider verification →</div>
          </Link>

          <Link
            href="/admin/properties/pending"
            className="border border-slate-200 bg-white p-6 transition hover:border-slate-950"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Listings</div>
            <h2 className="mt-2 text-xl font-bold">Property review</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review property listings submitted by landlords and agents before they are made public.
            </p>
            <div className="mt-5 text-sm font-semibold text-blue-700">Open pending properties →</div>
          </Link>

          <Link
            href="/admin/verifications"
            className="border border-slate-200 bg-white p-6 transition hover:border-slate-950"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Identity</div>
            <h2 className="mt-2 text-xl font-bold">User verification</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review identity and business-verification records used by the broader DENUEL trust system.
            </p>
            <div className="mt-5 text-sm font-semibold text-blue-700">Open user verification →</div>
          </Link>
        </section>

        <section className="mt-8 border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold">One source of truth per approval type</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keeping driver, service-provider, property and identity reviews separate prevents conflicting approval states and makes it clear which real records an administrator is reviewing.
          </p>
        </section>
      </main>
    </div>
  );
}
