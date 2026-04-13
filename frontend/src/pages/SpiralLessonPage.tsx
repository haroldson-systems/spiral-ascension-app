import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { marked } from 'marked';
import { useSpiralData } from '@/hooks/useSpiralData';
import { fetchLessonContent } from '@/lib/spiralApi';
import { homeSectionHref } from '@/lib/homeNavigation';
import LessonNoteBox from '@/components/LessonNoteBox';

marked.setOptions({
  breaks: true,
});

export default function SpiralLessonPage() {
  const { id, tier } = useParams<{ id: string; tier: string }>();
  const navigate = useNavigate();
  const parsedTier = Number(tier);
  const { modules } = useSpiralData();
  const module = modules.find((item) => item.id === id);
  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ['lesson', id, parsedTier],
    queryFn: () => fetchLessonContent(id!, parsedTier),
    enabled: !!id && Number.isFinite(parsedTier),
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
  });

  const lessonHtml = useMemo(() => {
    if (!lesson?.markdown) return '';
    return marked.parse(lesson.markdown) as string;
  }, [lesson]);
  const moduleHref = id ? `/module/${id}` : homeSectionHref('spiral');

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#0c0716] text-white">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-6">
          <h1 className="text-4xl font-bold">Module not found</h1>
          <p className="text-purple-200">
            This Spiral lesson is not available yet or has not been connected to a formatted file.
          </p>
          <button
            onClick={() => navigate(moduleHref)}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600/40 px-5 py-3 text-white transition hover:bg-purple-600/60"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#0c0716] text-white flex items-center justify-center">
        <p className="text-purple-200">Loading lesson...</p>
      </div>
    );
  }

  if (!lesson || isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#0c0716] text-white">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-6">
          <h1 className="text-4xl font-bold">Lesson not found</h1>
          <p className="text-purple-200">
            This Spiral lesson is not available yet or has not been connected to a formatted file.
          </p>
          <button
            onClick={() => navigate(moduleHref)}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600/40 px-5 py-3 text-white transition hover:bg-purple-600/60"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#0c0716] text-white">
      <header className="border-b border-purple-700/40 bg-purple-950/35 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate(moduleHref)}
            className="inline-flex items-center gap-2 text-purple-200 transition hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-purple-200">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Spiral Lesson
          </div>
          <Link to={homeSectionHref('spiral')} className="text-sm text-purple-200 transition hover:text-white">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="mb-8 rounded-3xl border border-purple-500/20 bg-[#2d1b4e]/55 p-6 shadow-2xl lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-purple-300">
                Tier {parsedTier}
              </p>
              <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
                {module.title}
              </h1>
              <p className="max-w-3xl text-lg text-purple-200">{module.subtitle}</p>
              <p className="max-w-3xl text-purple-100/85">{module.description}</p>
            </div>

            {module.image ? (
              <div className="overflow-hidden rounded-2xl border border-purple-500/20 shadow-lg">
                <img src={module.image} alt={module.title} className="h-full w-full object-cover" />
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-purple-500/20 bg-[#1f1038]/70 p-6 shadow-2xl lg:p-10">
          <div
            className="markdown-preview prose-headings:text-white prose-p:text-purple-100 prose-strong:text-white prose-li:text-purple-100 prose-ul:text-purple-100 prose-ol:text-purple-100 prose-blockquote:text-purple-200 prose-code:text-amber-300 prose-pre:bg-[#140a28] prose-a:text-amber-300 prose-a:no-underline hover:prose-a:text-amber-200 max-w-none prose prose-invert prose-lg"
            dangerouslySetInnerHTML={{ __html: lessonHtml }}
          />
          {id && <LessonNoteBox moduleId={id} />}
        </section>

        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate(moduleHref)}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600/40 px-5 py-3 text-white transition hover:bg-purple-600/60"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to {module.title}
          </button>
        </div>
      </main>
    </div>
  );
}
