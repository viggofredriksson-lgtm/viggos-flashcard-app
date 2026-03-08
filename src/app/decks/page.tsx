import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DecksPage() {
  const decks = await prisma.deck.findMany({
    include: {
      _count: { select: { cards: true } },
      cards: {
        select: { leitnerBox: true, nextReviewAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date();

  return (
    <div>
      <div className="mb-10 rounded-2xl bg-gradient-to-br from-green-light via-white to-cream-dark border border-cream-dark/40 p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-black">Decks</h1>
        <p className="text-gray">Dina flashcard-samlingar.</p>
      </div>

      {decks.length === 0 ? (
        <div className="rounded-2xl border border-cream-dark/60 bg-white/80 backdrop-blur-sm p-10 text-center shadow-sm">
          <p className="mb-3 text-lg text-black">Inga decks ännu.</p>
          <Link
            href="/import"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-green to-green-dark px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Importera dina första kort
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks.map((deck) => {
            const dueCount = deck.cards.filter(
              (c) => new Date(c.nextReviewAt) <= now
            ).length;

            const avgMastery =
              deck.cards.length > 0
                ? Math.round(
                    (deck.cards.reduce((sum, c) => sum + c.leitnerBox, 0) /
                      deck.cards.length /
                      5) *
                      100
                  )
                : 0;

            return (
              <Link
                key={deck.id}
                href={`/study?deck=${deck.id}`}
                className="group rounded-2xl border border-cream-dark/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-green/30"
              >
                <h2 className="mb-1 text-lg font-bold text-black group-hover:text-green transition-colors">
                  {deck.name}
                </h2>
                {deck.description && (
                  <p className="mb-3 text-sm text-gray">{deck.description}</p>
                )}
                <div className="flex gap-4 text-xs font-medium text-gray">
                  <span>{deck._count.cards} kort</span>
                  <span className={dueCount > 0 ? "text-green" : ""}>
                    {dueCount} att plugga
                  </span>
                  <span>{avgMastery}% bemästrat</span>
                </div>
                {/* Mastery-bar */}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream-dark">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green to-green-dark transition-all"
                    style={{ width: `${avgMastery}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
