import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { marked } from 'marked';
import PracticeCard from '@/components/PracticeCard';
import { usePracticesData } from '@/hooks/usePracticesData';

marked.setOptions({ breaks: true });

export default function PracticeEntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { practices, variants } = usePracticesData();
  const variant = variants.find((v) => v.id === id);
  const parentPractice = variant ? practices.find((p) => p.id === variant.parentId) : null;
  const parentVariant = variant ? variants.find((v) => v.id === variant.parentId) : null;
  const parentEntry = parentPractice ?? parentVariant;
  const backHref = parentPractice
    ? `/practice/${parentPractice.id}`
    : parentVariant
      ? `/practice-entry/${parentVariant.id}`
      : '/';
  const childVariants = useMemo(
    () => variants.filter((item) => item.parentId === variant?.id),
    [variant?.id, variants]
  );

  const bodyHtml = useMemo(() => {
    if (!variant?.body?.trim()) return '';
    return marked.parse(variant.body) as string;
  }, [variant?.body]);

  const handleStart = (variantId: string) => {
    try {
      localStorage.setItem('lastPractice', variantId);
    } catch {
      // Ignore localStorage failures (private mode, disabled storage, etc.)
    }
  };

  if (!variant || !parentEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center space-y-6">
          <h1 className="text-3xl font-bold">Practice entry not found</h1>
          <p className="text-purple-200">This practice may have moved or is not yet available.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Return to Spiral Ascension
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e] text-white">
      <header className="border-b border-purple-700/50 bg-purple-900/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <Link
            to={backHref}
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to {parentEntry.title}
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
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300">{variant.category}</p>
              <h1 className="text-4xl font-bold text-white">{variant.title}</h1>
              {variant.subtitle && (
                <p className="text-purple-200 text-lg max-w-2xl">{variant.subtitle}</p>
              )}
            </div>
            <img
              src={variant.image}
              alt={variant.title}
              className="w-40 h-40 rounded-2xl object-cover border border-purple-600/50 shadow-lg"
            />
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-purple-800/60 text-purple-200">
              {variant.duration}
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-800/60 text-purple-200">
              {variant.level}
            </span>
          </div>
        </section>

        {bodyHtml && (
          <section className="rounded-2xl border border-purple-700/50 bg-[#1f1038]/70 p-6 lg:p-10 shadow-xl">
            <div
              className="markdown-preview prose-headings:text-white prose-p:text-purple-100 prose-strong:text-white prose-li:text-purple-100 prose-ul:text-purple-100 prose-ol:text-purple-100 prose-blockquote:text-purple-200 prose-code:text-amber-300 prose-pre:bg-[#140a28] prose-a:text-amber-300 prose-a:no-underline hover:prose-a:text-amber-200 max-w-none prose prose-invert prose-lg"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </section>
        )}

        {childVariants.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Explore entries</h2>
              <span className="text-sm text-purple-300">{childVariants.length} available</span>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {childVariants.map((childVariant) => {
                const hasNestedChildren = variants.some((item) => item.parentId === childVariant.id);
                const hasEntryBody = Boolean(childVariant.body?.trim());
                const useMinimalMeta = variant.id.startsWith('lunar-lore-gate-');

                return (
                  <PracticeCard
                    key={childVariant.id}
                    practice={childVariant}
                    variant
                    startLabel={childVariant.startLabel}
                    to={hasNestedChildren || hasEntryBody ? `/practice-entry/${childVariant.id}` : undefined}
                    minimalMeta={useMinimalMeta}
                    onStart={() => handleStart(childVariant.id)}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
