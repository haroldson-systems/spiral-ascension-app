import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { marked } from "marked";
import { spiralChapters } from "../data/spiralChapters";
import { spiralIntroContent } from "../data/spiralIntroContent";
import TierGrid from "../components/TierGrid";

function formatChapterParagraphs(description: string) {
  return description
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export default function ModulePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ⬇️ scroll to top whenever this page mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Find the matching chapter (string compare, correct for your string IDs)
  const chapter = spiralChapters.find((chap) => chap.id === id);

  if (!chapter) {
    return (
      <div className="text-center text-white p-10">
        <h2 className="text-3xl font-bold mb-4">Module Not Found</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-purple-600 rounded-lg text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  const introMarkdown = id ? spiralIntroContent[id] : undefined;
  const paragraphs = chapter.description ? formatChapterParagraphs(chapter.description) : [];
  const introHtml = useMemo(() => {
    if (!introMarkdown) return "";
    return marked.parse(introMarkdown) as string;
  }, [introMarkdown]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] to-[#0c0716] text-white p-8 pt-16">
      <div className="mx-auto max-w-5xl">
        {/* BACK BUTTON */}
        <button
          onClick={() =>
            // if a history entry exists, go back; otherwise jump to the home grid
            window.history.length > 1 ? navigate(-1) : navigate("/")
          }
          className="mb-6 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg"
        >
          ← Back
        </button>

        <div className="mx-auto max-w-3xl">
          {/* TITLE */}
          <h1 className="text-4xl font-bold mb-2 text-center">{chapter.title}</h1>
          <h2 className="text-xl text-purple-300 mb-6 text-center">{chapter.subtitle}</h2>

          {/* IMAGE */}
          {chapter.image && (
            <figure className="mx-auto mb-8 max-w-xl">
              <img
                src={chapter.image}
                alt={chapter.title}
                className="w-full rounded-xl shadow-lg object-cover"
              />
            </figure>
          )}

          {introHtml ? (
            <section className="rounded-3xl border border-purple-500/20 bg-[#1f1038]/70 p-6 shadow-2xl lg:p-10">
              <div
                className="markdown-preview prose-headings:text-white prose-p:text-purple-100 prose-strong:text-white prose-li:text-purple-100 prose-ul:text-purple-100 prose-ol:text-purple-100 prose-blockquote:text-purple-200 prose-code:text-amber-300 prose-pre:bg-[#140a28] prose-a:text-amber-300 prose-a:no-underline hover:prose-a:text-amber-200 max-w-none prose prose-invert prose-lg"
                dangerouslySetInnerHTML={{ __html: introHtml }}
              />
            </section>
          ) : paragraphs.length > 0 ? (
            <div className="mx-auto max-w-3xl leading-relaxed text-lg text-purple-100">
              {paragraphs.map((para, i) => (
                <p key={i} className="mb-4">
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-purple-300 text-lg text-center">
              No description added yet. (We’ll add this next.)
            </p>
          )}
        </div>

        {chapter.id === "1" && <TierGrid tier={1} />}
        {chapter.id === "2" && <TierGrid tier={2} />}
        {chapter.id === "3" && <TierGrid tier={3} />}
      </div>
    </div>
  );
}
