import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import PracticeCard from '@/components/PracticeCard';
import { usePracticesData } from '@/hooks/usePracticesData';
import { homeSectionHref } from '@/lib/homeNavigation';
import { normalizeVideoEmbedUrl } from '@/lib/videoEmbeds';

marked.setOptions({ breaks: true });

function getChildCollectionHeading(variantId: string) {
  if (variantId.startsWith('breath-')) {
    return 'Practices in this lane';
  }

  if (variantId === 'resonance-gate') {
    return 'Explore the chamber';
  }

  return 'Explore entries';
}

function renderEntryBody(body: string) {
  const trimmedBody = body.trim();
  const looksLikeHtml = /<\s*[a-z][^>]*>/i.test(trimmedBody);
  const html = looksLikeHtml ? trimmedBody : ((marked.parse(trimmedBody) as string) ?? '');

  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: [
      'allow',
      'allowfullscreen',
      'frameborder',
      'scrolling',
      'target',
      'rel',
      'class',
    ],
  });
}

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
      : homeSectionHref('practices');
  const childVariants = useMemo(
    () => variants.filter((item) => item.parentId === variant?.id),
    [variant?.id, variants]
  );

  const bodyHtml = useMemo(() => {
    const content = variant?.body?.trim() || variant?.description?.trim() || '';
    if (!content) return '';
    return renderEntryBody(content);
  }, [variant?.body, variant?.description]);

  const embeddedMediaUrl = useMemo(() => {
    if (!variant?.mediaUrl?.trim()) return null;
    return normalizeVideoEmbedUrl(variant.mediaUrl);
  }, [variant?.mediaUrl]);

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
            {variant.frequency && (
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/20">
                {variant.frequency}
              </span>
            )}
          </div>
          {variant.supportState && (
            <p className="text-purple-200/85 max-w-3xl">
              <span className="font-semibold text-white">Best for:</span> {variant.supportState}
            </p>
          )}
          {(variant.creator || variant.credit || variant.sourceUrl) && (
            <div className="text-sm text-purple-200/80 space-y-1">
              {variant.creator && <p><span className="font-semibold text-white">Creator:</span> {variant.creator}</p>}
              {variant.credit && <p><span className="font-semibold text-white">Credit:</span> {variant.credit}</p>}
              {variant.sourceUrl && (
                <p>
                  <span className="font-semibold text-white">Source:</span>{' '}
                  <a
                    href={variant.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-300 hover:text-amber-200"
                  >
                    Open source link
                  </a>
                </p>
              )}
            </div>
          )}
        </section>

        {(embeddedMediaUrl || variant.mediaUrl || variant.audioUrl) && (
          <section className="rounded-2xl border border-purple-700/50 bg-[#1f1038]/70 p-6 lg:p-10 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-white">Assigned Media</h2>
              {variant.mediaType && (
                <span className="text-xs uppercase tracking-[0.3em] text-purple-300">
                  {variant.mediaType}
                </span>
              )}
            </div>
            {embeddedMediaUrl ? (
              <div className="overflow-hidden rounded-2xl border border-purple-700/50 aspect-video bg-black/30">
                <iframe
                  src={embeddedMediaUrl}
                  title={variant.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : variant.mediaUrl ? (
              <div className="rounded-2xl border border-purple-700/50 bg-purple-950/50 p-5 space-y-3">
                <p className="text-purple-100">Assigned media is linked for this entry.</p>
                <a
                  href={variant.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500"
                >
                  Open Media
                </a>
              </div>
            ) : null}

            {variant.audioUrl && (
              <audio controls className="w-full">
                <source src={variant.audioUrl} />
              </audio>
            )}
          </section>
        )}

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
              <h2 className="text-2xl font-semibold text-white">{getChildCollectionHeading(variant.id)}</h2>
              <span className="text-sm text-purple-300">{childVariants.length} available</span>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {childVariants.map((childVariant) => {
                const useMinimalMeta = variant.id.startsWith('lunar-lore-gate-');

                return (
                  <PracticeCard
                    key={childVariant.id}
                    practice={childVariant}
                    variant
                    startLabel={childVariant.startLabel}
                    to={`/practice-entry/${childVariant.id}`}
                    minimalMeta={useMinimalMeta}
                    onStart={() => handleStart(childVariant.id)}
                  />
                );
              })}
            </div>
          </section>
        )}

        <div className="flex justify-center pt-2">
          <Link
            to={backHref}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600/40 px-5 py-3 text-white transition hover:bg-purple-600/60"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to {parentEntry.title}
          </Link>
        </div>
      </main>
    </div>
  );
}
