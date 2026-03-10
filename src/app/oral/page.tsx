"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  scoreAnswerCombined,
  scoreAnswerKeywords,
  MatchResult,
} from "@/lib/keyword-matcher";
import { loadEmbeddingModel, isModelReady } from "@/lib/embeddings";

interface Card {
  id: string;
  question: string;
  answer: string;
  keywords: string;
  leitnerBox: number;
  deck: { name: string };
}

interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
}

export default function OralPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-dark border-t-green" />
        </div>
      }
    >
      <OralContent />
    </Suspense>
  );
}

function OralContent() {
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
  const [oralResult, setOralResult] = useState<MatchResult | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [scoring, setScoring] = useState(false);

  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Load embedding model + cards in parallel
  useEffect(() => {
    async function init() {
      const deckParam = deckId ? `?deck=${deckId}` : "";

      // Start model loading and card fetching in parallel
      const modelPromise = loadEmbeddingModel()
        .then(() => setModelLoading(false))
        .catch((err) => {
          console.error("Failed to load embedding model:", err);
          setModelLoading(false);
        });

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

      // Wait for model too (but don't block cards from showing)
      await modelPromise;
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
      setOralResult(null);
      resetTranscript();

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
    [currentCard, sessionId, currentIndex, cards.length, resetTranscript]
  );

  const handleSubmit = useCallback(async () => {
    if (!currentCard || !transcript) return;
    stopListening();
    setScoring(true);

    let result: MatchResult;

    if (isModelReady()) {
      result = await scoreAnswerCombined(
        transcript,
        currentCard.answer,
        currentCard.keywords
      );
    } else {
      // Fallback to keywords only if model didn't load
      result = scoreAnswerKeywords(transcript, currentCard.keywords);
    }

    setOralResult(result);
    setScoring(false);
    setShowAnswer(true);
  }, [currentCard, transcript, stopListening]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-dark border-t-green" />
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-light to-cream-dark">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
            <line x1="4" x2="20" y1="4" y2="20" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-black">Taligenkänning stöds inte</h1>
        <p className="mb-8 text-gray">Din webbläsare har inte stöd för taligenkänning. Testa Chrome eller Edge.</p>
        <Link href="/study" className="rounded-xl bg-gradient-to-r from-green to-green-dark px-6 py-3 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:-translate-y-0.5">
          Plugga klassiskt istället
        </Link>
      </div>
    );
  }

  if (finished) {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        {stats.total === 0 ? (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-light to-cream-dark">
              <svg className="h-10 w-10 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-black">Inga kort att förhöra</h1>
            <p className="mb-8 text-gray">Du är ikapp! Kom tillbaka lite senare.</p>
          </>
        ) : (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-light to-cream-dark shadow-lg shadow-green/10">
              <span className="text-3xl font-bold text-green">{accuracy}%</span>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-black">Förhör klart!</h1>
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
        <Link href="/" className="rounded-xl bg-gradient-to-r from-green to-green-dark px-6 py-3 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:-translate-y-0.5">
          Tillbaka till översikten
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-green-light via-white to-cream-dark border border-cream-dark/40 p-6 shadow-sm text-center">
        <h1 className="mb-1 text-2xl font-bold text-black">Muntligt förhör</h1>
        <p className="text-sm text-gray">Svara med din röst — appen bedömer dig automatiskt</p>
        {modelLoading && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-3 w-3 animate-spin rounded-full border border-green border-t-transparent" />
            <p className="text-xs text-gray">Laddar AI-bedömning...</p>
          </div>
        )}
      </div>

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
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
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
            <div className="space-y-6">
              {/* Mikrofon-knapp */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={scoring}
                className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full transition-all ${
                  scoring
                    ? "bg-cream-dark text-gray animate-pulse"
                    : isListening
                      ? "bg-red/10 text-red shadow-lg shadow-red/20 animate-pulse"
                      : "bg-gradient-to-br from-green-light to-cream-dark text-green shadow-md hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {scoring ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray border-t-green" />
                ) : isListening ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </button>

              <p className="text-sm text-gray">
                {scoring
                  ? "Bedömer ditt svar..."
                  : isListening
                    ? "Lyssnar... Prata nu!"
                    : "Tryck på mikrofonen och svara muntligt"}
              </p>

              {/* Transkription */}
              {transcript && (
                <div className="rounded-xl border border-cream-dark bg-cream/30 p-4 text-left">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray">Ditt svar:</p>
                  <p className="text-black">{transcript}</p>
                </div>
              )}

              {/* Skicka-knapp */}
              {transcript && !scoring && (
                <button
                  onClick={handleSubmit}
                  className="rounded-xl bg-gradient-to-r from-green to-green-dark px-8 py-3 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Bedöm mitt svar
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Resultat */}
              {oralResult && oralResult.percentage >= 0 && (
                <div className="mb-6">
                  {/* Poäng-cirkel */}
                  <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                    oralResult.score >= 4
                      ? "bg-gradient-to-br from-green-light to-green/20"
                      : oralResult.score >= 3
                        ? "bg-gradient-to-br from-cream to-cream-dark"
                        : "bg-gradient-to-br from-red-light to-red/10"
                  }`}>
                    <span className={`text-2xl font-bold ${
                      oralResult.score >= 4 ? "text-green" : oralResult.score >= 3 ? "text-black" : "text-red"
                    }`}>
                      {oralResult.percentage}%
                    </span>
                  </div>

                  {/* Detaljerade poäng */}
                  {oralResult.semanticPercentage >= 0 && (
                    <div className="mb-4 flex justify-center gap-6 text-xs text-gray">
                      <span>Förståelse: {oralResult.semanticPercentage}%</span>
                      {oralResult.keywordPercentage >= 0 && (
                        <span>Nyckelord: {oralResult.keywordPercentage}%</span>
                      )}
                    </div>
                  )}

                  {/* Matchade nyckelord */}
                  {oralResult.matchedKeywords.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-green">Nyckelord du nämnde</p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {oralResult.matchedKeywords.map((kw) => (
                          <span key={kw} className="rounded-lg bg-green/10 px-2.5 py-1 text-xs font-medium text-green">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missade nyckelord */}
                  {oralResult.missedKeywords.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-red">Nyckelord du missade</p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {oralResult.missedKeywords.map((kw) => (
                          <span key={kw} className="rounded-lg bg-red/10 px-2.5 py-1 text-xs font-medium text-red">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transkription */}
                  <div className="mt-4 rounded-xl border border-cream-dark bg-cream/30 p-3 text-left">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray">Du sa:</p>
                    <p className="text-sm text-black">{transcript}</p>
                  </div>
                </div>
              )}

              {/* Inga poäng alls */}
              {oralResult && oralResult.percentage < 0 && (
                <div className="mb-6 rounded-xl border border-cream-dark bg-cream/30 p-4">
                  <p className="text-sm text-gray">
                    Auto-bedömning kunde inte göras. Bedöm själv nedan.
                  </p>
                  <div className="mt-3 rounded-xl border border-cream-dark bg-cream/30 p-3 text-left">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray">Du sa:</p>
                    <p className="text-sm text-black">{transcript}</p>
                  </div>
                </div>
              )}

              {/* Rätt svar */}
              <div className="mb-8 border-t border-cream-dark pt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray">Rätt svar</p>
                <p className="text-lg leading-relaxed text-black">{currentCard.answer}</p>
              </div>

              {/* Bedömning */}
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray">
                {oralResult && oralResult.percentage >= 0
                  ? `Auto-bedömning: ${RATING_LABELS[oralResult.score]} — Stämmer det?`
                  : "Hur bra kunde du det?"}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {oralResult && oralResult.percentage >= 0 ? (
                  <>
                    <button
                      onClick={() => handleRating(oralResult.score)}
                      className="rounded-xl bg-gradient-to-r from-green to-green-dark px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      Ja, stämmer
                    </button>
                    <button
                      onClick={() => setOralResult(null)}
                      className="rounded-xl border border-cream-dark bg-white px-6 py-2.5 text-sm font-semibold text-gray transition-all hover:border-green/30 hover:-translate-y-0.5"
                    >
                      Nej, bedöm själv
                    </button>
                  </>
                ) : (
                  RATINGS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleRating(r.value)}
                      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${r.style}`}
                    >
                      <span className="block">{r.label}</span>
                      <span className="block text-xs opacity-60">({r.value})</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-light">
        Tryck på mikrofonen, svara med din röst, och klicka bedöm
      </p>
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Blankt",
  2: "Fel",
  3: "Svårt",
  4: "Bra",
  5: "Lätt",
};

const RATINGS = [
  { value: 1, label: "Blankt", style: "bg-gradient-to-b from-red-light to-white border border-red/20 text-red shadow-sm hover:shadow-md" },
  { value: 2, label: "Fel", style: "bg-gradient-to-b from-red-light to-white border border-red/20 text-red shadow-sm hover:shadow-md" },
  { value: 3, label: "Svårt", style: "bg-gradient-to-b from-white to-cream border border-cream-dark text-black shadow-sm hover:shadow-md" },
  { value: 4, label: "Bra", style: "bg-gradient-to-b from-green-light to-white border border-green/20 text-green shadow-sm hover:shadow-md" },
  { value: 5, label: "Lätt", style: "bg-gradient-to-r from-green to-green-dark text-white shadow-md shadow-green/20 hover:shadow-lg" },
];
