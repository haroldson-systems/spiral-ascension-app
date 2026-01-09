import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { spiralChapters } from "../data/spiralChapters";
import TierGrid from "../components/TierGrid";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] to-[#0c0716] text-white p-8 pt-16">
      
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

      {/* TITLE */}
      <h1 className="text-4xl font-bold mb-2">{chapter.title}</h1>
      <h2 className="text-xl text-purple-300 mb-6">{chapter.subtitle}</h2>

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

      {/* DESCRIPTION */}
      {chapter.description ? (
        <div className="max-w-3xl leading-relaxed text-lg text-purple-100">
          {chapter.description.split("\n").map((para, i) => (
            <p key={i} className="mb-4">
              {para}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-purple-300 text-lg">
          No description added yet. (We’ll add this next.)
        </p>
      )}

      {chapter.id === "1" && <TierGrid tier={1} />}
      {chapter.id === "2" && <TierGrid tier={2} />}
      {chapter.id === "3" && <TierGrid tier={3} />}
    </div>
  );
}
