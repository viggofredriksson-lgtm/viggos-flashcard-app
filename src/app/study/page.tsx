"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Card {
  id: string;
  question: string;
  answer: string;
  leitnerBox: number;
  deck: { name: string };
}

interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
}

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-dark border-t-green" />
        </div>
      }
    >
      <StudyContent />
    </Suspense>
  );
}

function StudyContent() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deck") || undefined;

  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    correct: 0,
    incorrect: 0,
  });
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function init() {
      const deckParam = deckId ? `?deck=${deckId}` : "";
      const [cardsRes, sessionRes] = await Promise.all([
        fetch(`/api/study${deckParam}`),
        fetch("/api/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start-session" }),
        }),
      ]);

      const cardsData = await cardsRes.json();
      const sessionData = await sessionRes.json();

      setCards(cardsData.cards || []);
      setSessionId(sessionData.session?.id || null);
      setLoading(false);

      if (!cardsData.cards?.length) {
        setFinished(true);
      }
    }
    init();
  }, [deckId]);

  const currentCard = cards[currentIndex];

  const handleRating = useCallback(
    async (rating: number) => {
      if (!currentCard || !sessionId) return;

      await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          cardId: currentCard.id,
          rating,
          sessionId,
        }),
      });

      setStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (rating >= 3 ? 1 : 0),
        incorrect: prev.incorrect + (rating < 3 ? 1 : 0),
      }));

      setShowAnswer(false);

      if (currentIndex + 1 >= cards.length) {
        await fetch("/api/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end-session", sessionId }),
        });
        setFinished(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentCard, sessionId, currentIndex, cards.length]
  );

  // Tangentbordsgenvägar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!showAnswer && e.key === " ") {
        e.preventDefault();
        setShowAnswer(true);
      }
      if (showAnswer && e.key >= "1" && e.key <= "5") {
        handleRating(parseInt(e.key));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnswer, handleRating]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-dark border-t-green" />
      </div>
    );
  }

  // Session klar
  if (finished) {
    const accuracy =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        {stats.total === 0 ? (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-light to-cream-dark">
              <svg className="h-10 w-10 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-black">
              Inga kort att plugga
            </h1>
            <p className="mb-8 text-gray">
              Du är ikapp! Kom tillbaka lite senare.
            </p>
          </>
        ) : (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-light to-cream-dark shadow-lg shadow-green/10">
              <span className="text-3xl font-bold text-green">{accuracy}%</span>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-black">
              Session klar
            </h1>
            <p className="mb-8 text-gray">Snyggt jobbat! Så här gick det:</p>
            <div className="mb-8 flex gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-black">{stats.total}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-gray">Kort</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green">{stats.correct}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-gray">Rätt</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red">{stats.incorrect}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-gray">Fel</p>
              </div>
            </div>
          </>
        )}
        <Link
          href="/"
          className="rounded-xl bg-gradient-to-r from-green to-green-dark px-6 py-3 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
          Tillbaka till översikten
        </Link>
      </div>
    );
  }

  // Plugga-vy
  return (
    <div className="mx-auto max-w-2xl">
      {/* Progressbar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-gray">
          Kort {currentIndex + 1} av {cards.length}
        </p>
        <p className="text-sm font-medium text-gray">{currentCard?.deck.name}</p>
      </div>
      <div className="mb-8 h-2 overflow-hidden rounded-full bg-cream-dark">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green to-green-dark transition-all duration-500 ease-out"
          style={{
            width: `${((currentIndex + 1) / cards.length) * 100}%`,
          }}
        />
      </div>

      {/* Kort */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-cream-dark/60 bg-white/90 backdrop-blur-sm shadow-lg shadow-black/5">
        <div className="p-10 text-center">
          {/* Leitner-box-indikator */}
          <div className="mb-6 flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((box) => (
              <div
                key={box}
                className={`h-2 w-8 rounded-full transition-all ${
                  box <= currentCard.leitnerBox
                    ? "bg-gradient-to-r from-green to-green-dark"
                    : "bg-cream-dark"
                }`}
              />
            ))}
          </div>

          <h2 className="mb-8 text-xl font-bold leading-relaxed text-black">
            {currentCard.question}
          </h2>

          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="rounded-xl border border-cream-dark bg-gradient-to-b from-white to-cream/50 px-8 py-3 text-sm font-semibold text-black shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              Visa svar (Mellanslag)
            </button>
          ) : (
            <div>
              <div className="mb-8 border-t border-cream-dark pt-8">
                <p className="text-lg leading-relaxed text-black">
                  {currentCard.answer}
                </p>
              </div>

              {/* Bedömningsknappar */}
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray">
                Hur bra kunde du det?
              </p>
              <div className="flex justify-center gap-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleRating(r.value)}
                    className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${r.style}`}
                  >
                    <span className="block">{r.label}</span>
                    <span className="block text-xs opacity-60">({r.value})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-light">
        Tangentbord: Mellanslag = visa svar, 1-5 = bedöm
      </p>
    </div>
  );
}

const RATINGS = [
  {
    value: 1,
    label: "Blankt",
    style:
      "bg-gradient-to-b from-red-light to-white border border-red/20 text-red shadow-sm hover:shadow-md",
  },
  {
    value: 2,
    label: "Fel",
    style:
      "bg-gradient-to-b from-red-light to-white border border-red/20 text-red shadow-sm hover:shadow-md",
  },
  {
    value: 3,
    label: "Svårt",
    style:
      "bg-gradient-to-b from-white to-cream border border-cream-dark text-black shadow-sm hover:shadow-md",
  },
  {
    value: 4,
    label: "Bra",
    style:
      "bg-gradient-to-b from-green-light to-white border border-green/20 text-green shadow-sm hover:shadow-md",
  },
  {
    value: 5,
    label: "Lätt",
    style:
      "bg-gradient-to-r from-green to-green-dark text-white shadow-md shadow-green/20 hover:shadow-lg",
  },
];
