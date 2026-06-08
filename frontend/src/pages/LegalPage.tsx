import React from 'react';
import { Link } from 'react-router-dom';

type LegalPageProps = {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
};

export function LegalPageShell({ title, eyebrow, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] text-[#e8e8f0]">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="mb-10 inline-flex text-sm font-semibold text-[#d4af37] hover:text-[#f0cf63]">
          Back to Spiral Ascension
        </Link>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af37]">{eyebrow}</p>
        <h1 className="mb-8 text-4xl font-bold text-white">{title}</h1>

        <div className="space-y-8 rounded-2xl border border-purple-500/25 bg-[#1a0b2e]/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="space-y-3 leading-relaxed text-[#e8e8f0]/80">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <LegalPageShell eyebrow="Privacy" title="Privacy Policy">
      <Section title="What Spiral Ascension Collects">
        <p>
          Spiral Ascension may collect the email address you use for account access, subscription status,
          saved app progress, Vault entries, and basic technical information needed to keep the app working.
        </p>
      </Section>

      <Section title="Private Reflections">
        <p>
          The Vault is designed as a private reflection space. Treat anything you write there as personal data
          and use the export or delete tools available in the app when you need to manage your records.
        </p>
      </Section>

      <Section title="Payments">
        <p>
          Payments and trial billing are handled through Stripe. Spiral Ascension does not store your full card
          number on its own servers.
        </p>
      </Section>

      <Section title="Affiliate Links">
        <p>
          Some links inside Spiral Ascension may be affiliate links. If you choose to buy through those links,
          Spiral Ascension may earn a commission at no additional cost to you.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy questions, email{' '}
          <a className="text-[#d4af37] hover:text-[#f0cf63]" href="mailto:support@thespiralascension.com">
            support@thespiralascension.com
          </a>
          .
        </p>
      </Section>
    </LegalPageShell>
  );
}

export function TermsPage() {
  return (
    <LegalPageShell eyebrow="Terms" title="Terms of Use">
      <Section title="Use of the App">
        <p>
          Spiral Ascension is a spiritual wellness, reflection, and inner-work app. It provides teachings,
          practices, journaling tools, lunar tracking, and frequency-based experiences for personal use.
        </p>
      </Section>

      <Section title="Not Professional Care">
        <p>
          Spiral Ascension is not medical care, mental health treatment, crisis care, legal advice, or a
          substitute for qualified professional support. If you are in danger or experiencing a crisis, contact
          local emergency services or a qualified crisis resource.
        </p>
      </Section>

      <Section title="Subscription">
        <p>
          Membership begins with a 7-day free trial, then renews at $3.33 per month unless canceled before the
          trial ends. Subscription management and payment processing are handled through Stripe.
        </p>
      </Section>

      <Section title="Affiliate Disclosure">
        <p>
          Spiral Ascension may include affiliate links to books, tools, creators, services, or other resources.
          If you purchase through an affiliate link, Spiral Ascension may receive a commission at no additional
          cost to you. Affiliate relationships do not change the price you pay.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For account, billing, or terms questions, email{' '}
          <a className="text-[#d4af37] hover:text-[#f0cf63]" href="mailto:support@thespiralascension.com">
            support@thespiralascension.com
          </a>
          .
        </p>
      </Section>
    </LegalPageShell>
  );
}

export function SupportPage() {
  return (
    <LegalPageShell eyebrow="Support" title="Support">
      <Section title="Account and Billing">
        <p>
          For login, access, billing, cancellation, or subscription questions, email{' '}
          <a className="text-[#d4af37] hover:text-[#f0cf63]" href="mailto:support@thespiralascension.com">
            support@thespiralascension.com
          </a>
          .
        </p>
      </Section>

      <Section title="Before You Write">
        <p>
          Use the same email connected to your membership so support can identify the correct account quickly.
        </p>
      </Section>

      <Section title="Affiliate Links">
        <p>
          Some resource links may be affiliate links. If you have a question about a creator credit, resource,
          or affiliate disclosure, include the page or item name in your message.
        </p>
      </Section>

      <Section title="Crisis Notice">
        <p>
          Spiral Ascension is not crisis support. If you are in immediate danger, contact local emergency
          services or a qualified crisis resource in your area.
        </p>
      </Section>
    </LegalPageShell>
  );
}
