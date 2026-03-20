import { Link, useSearchParams } from 'react-router-dom';
import { DoorOpen, ArrowLeft } from 'lucide-react';
import VaultSection from '@/components/VaultSection';

export default function VaultPage() {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const initialMode = modeParam === 'spiral' || modeParam === 'personal' ? modeParam : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e]">
      <header className="border-b border-purple-400/15 bg-[#3a2563]/24">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Link
            to="/"
            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Spiral Ascension
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
      </main>
    </div>
  );
}
