import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import PracticeCard from '@/components/PracticeCard';
import { usePracticesData } from '@/hooks/usePracticesData';
import { homeSectionHref } from '@/lib/homeNavigation';

function getCollectionHeading(practiceId: string) {
  if (practiceId === 'breathwork-compendium') {
    return 'Choose your lane';
  }

  if (practiceId === 'resonance-gate') {
    return 'Choose your chamber';
  }

  return 'Choose your depth';
}

export default function PracticeDetail() {
  const { id } = useParams<{ id: string }>();
  const { practices, variants } = usePracticesData();
  const practice = practices.find((item) => item.id === id);

  if (!practice) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center space-y-6">
          <h1 className="text-3xl font-bold">Practice not found</h1>
          <p className="text-purple-200">This practice may have moved or is not yet available.</p>
          <Link
            to={homeSectionHref('practices')}
            className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Return to Practices
          </Link>
        </div>
      </div>
    );
  }

  const practiceVariants = variants.filter((variant) => variant.parentId === practice.id);

  const handleStart = (variantId: string) => {
    try {
      localStorage.setItem('lastPractice', variantId);
    } catch {
      // Ignore localStorage failures (private mode, disabled storage, etc.)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
      <header className="border-b border-purple-700/50 bg-purple-900/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <Link
            to={homeSectionHref('practices')}
            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Practices
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <span className="text-sm uppercase tracking-[0.3em] text-purple-200">Practice</span>
          </div>
          <div className="w-[180px]" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-6xl space-y-10">
        <section className="rounded-2xl bg-purple-900/60 border border-purple-700/50 shadow-xl p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300">{practice.category}</p>
              <h1 className="text-4xl font-bold text-white">{practice.title}</h1>
              {practice.subtitle && (
                <p className="text-purple-200 text-lg max-w-2xl">{practice.subtitle}</p>
              )}
            </div>
            <img
              src={practice.image}
              alt={practice.title}
              className="w-40 h-40 rounded-2xl object-cover border border-purple-600/50 shadow-lg"
            />
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-purple-800/60 text-purple-200">
              {practice.duration}
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-800/60 text-purple-200">
              {practice.level}
            </span>
          </div>
          <p className="text-purple-100/90 leading-relaxed max-w-3xl">{practice.description}</p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">{getCollectionHeading(practice.id)}</h2>
            <span className="text-sm text-purple-300">
              {practiceVariants.length > 0 ? `${practiceVariants.length} available` : 'Variants coming soon'}
            </span>
          </div>

          {practiceVariants.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {practiceVariants.map((variant) => {
                const hasNestedChildren = variants.some((item) => item.parentId === variant.id);
                const hasEntryBody = Boolean(variant.body?.trim());
                const useMinimalMeta = practice.id.startsWith('lunar-lore-gate-');

                return (
                <PracticeCard
                  key={variant.id}
                  practice={variant}
                  variant
                  startLabel={variant.startLabel}
                  to={hasNestedChildren || hasEntryBody ? `/practice-entry/${variant.id}` : undefined}
                  minimalMeta={useMinimalMeta}
                  onStart={() => handleStart(variant.id)}
                />
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-purple-700/60 bg-purple-900/40 p-10 text-center text-purple-200">
              Variants for this practice will appear here soon.
            </div>
          )}
        </section>

        <div className="flex justify-center pt-2">
          <Link
            to={homeSectionHref('practices')}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600/40 px-5 py-3 text-white transition hover:bg-purple-600/60"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Practices
          </Link>
        </div>
      </main>
    </div>
  );
}
