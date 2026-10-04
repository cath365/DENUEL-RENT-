'use client';

import Link from 'next/link';
import { useSettings } from '@/lib/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();
  const groups = [
    { title: 'Property', links: [['Rent','/rent'],['Buy','/buy'],['Land','/land'],['Commercial','/commercial'],['List property','/dashboard/properties/new']] },
    { title: 'People & services', links: [['Agents','/agents'],['Home services','/services'],['Renter Hub','/renter-hub'],['Landlord tools','/landlord'],['Transport','/transport']] },
    { title: 'Research & safety', links: [['Market insights','/market'],['Smart search','/ask-denuel'],['Budget calculator','/business-tools/budget-calculator'],['Renter guide','/renters-guide'],['Safety centre','/safety-tips']] },
    { title: 'Account', links: [['Saved properties','/favorites'],['Saved searches','/saved-search'],['Notifications','/notifications'],['Pay rent','/rent-payment'],['Support','/contact-support']] },
  ];

  const socials = [
    ['Facebook', settings.facebookUrl], ['X', settings.twitterUrl], ['Instagram', settings.instagramUrl], ['LinkedIn', settings.linkedinUrl], ['YouTube', settings.youtubeUrl]
  ].filter(([,url]) => Boolean(url));

  return (
    <footer className="bg-[#0F2B46] text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center">
              <img
                src={settings.logoUrl || '/brand/nganda-logo-horizontal-dark.svg'}
                alt={settings.siteName || "Ng'anda"}
                className="h-16 w-auto max-w-[260px] object-contain"
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">{settings.siteDescription || 'Find a place. Make it home.'}</p>
            {(settings.contactEmail || settings.supportEmail || settings.contactPhone) && <div className="mt-6 space-y-1 text-sm text-slate-400">{(settings.supportEmail || settings.contactEmail) && <div>{settings.supportEmail || settings.contactEmail}</div>}{settings.contactPhone && <div>{settings.contactPhone}</div>}</div>}
            {socials.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{socials.map(([name,url]) => <a key={name} href={String(url)} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold hover:border-white/30 hover:text-white">{name}</a>)}</div>}
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {groups.map(group => <div key={group.title}><h3 className="font-bold text-white">{group.title}</h3><ul className="mt-4 space-y-3 text-sm text-slate-400">{group.links.map(([label,href]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}</ul></div>)}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>© {year} {settings.siteName || "Ng'anda"}. All rights reserved.</div>
          <div className="flex flex-wrap gap-4"><Link href="/terms" className="hover:text-white">Terms</Link><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/cookies" className="hover:text-white">Cookies</Link><Link href="/accessibility" className="hover:text-white">Accessibility</Link></div>
        </div>
      </div>
    </footer>
  );
}
