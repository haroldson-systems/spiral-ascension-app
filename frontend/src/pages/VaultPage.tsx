import { Link, useSearchParams } from 'react-router-dom';
import { DoorOpen, ArrowLeft } from 'lucide-react';
import VaultSection from '@/components/VaultSection';
import { homeSectionHref } from '@/lib/homeNavigation';

export default function VaultPage() {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const initialMode = modeParam === 'spiral' || modeParam === 'personal' ? modeParam : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e]">
      <header className="border-b border-purple-400/15 bg-[#3a2563]/24">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Link
            to={homeSectionHref('vault')}
            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Vault
          </Link>
          <div className="flex items-center gap-2">
            <DoorOpen className="h-8 w-8 text-amber-400" />
            <h1 className="text-xl font-bold text-white">The Vault</h1>
          </div>
          <div className="w-[180px]" />
        </div>
      </header>

      <main>
        <VaultSection initialMode={initialMode} />
        <div className="container mx-auto flex justify-center px-4 pb-12">
          <Link
            to={homeSectionHref('vault')}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600/40 px-5 py-3 text-white transition hover:bg-purple-600/60"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Vault
          </Link>
        </div>
      </main>
    </div>
  );
}
