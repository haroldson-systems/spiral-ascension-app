import React from 'react';
import { Link } from 'react-router-dom';
import { homeSectionHref } from '@/lib/homeNavigation';

export default function Footer() {
  const linkClass = 'text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors';

  return (
    <footer className="border-t border-purple-500/20 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-8 mb-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-[#d4af37] font-bold text-lg mb-4">The Spiral</h3>
            <ul className="space-y-2">
              <li><Link to={homeSectionHref('spiral')} className={linkClass}>Teachings</Link></li>
              <li><Link to={homeSectionHref('practices')} className={linkClass}>Practices</Link></li>
              <li><Link to={homeSectionHref('moonsync')} className={linkClass}>MoonSync</Link></li>
              <li><Link to={homeSectionHref('vault')} className={linkClass}>The Vault</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#d4af37] font-bold text-lg mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link to="/subscribe" className={linkClass}>Start Free Trial</Link></li>
              <li><Link to="/auth" className={linkClass}>Sign In</Link></li>
              <li><Link to="/account/password" className={linkClass}>Account</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#d4af37] font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/support" className={linkClass}>Support</Link></li>
              <li><Link to="/privacy" className={linkClass}>Privacy</Link></li>
              <li><Link to="/terms" className={linkClass}>Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-purple-500/20 pt-8 text-center">
          <p className="text-[#e8e8f0]/60 mb-2">
            Couldn't find it, so I built it.
          </p>
          <p className="text-[#e8e8f0]/40 text-sm">
            © 2026 The Spiral Ascension. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
