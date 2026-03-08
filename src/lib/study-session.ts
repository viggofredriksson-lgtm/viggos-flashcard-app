import { prisma } from "./db";
import { processReview } from "./spaced-repetition";

// ============================================
// STUDY SESSION LOGIC
// ============================================
// This file handles the "study flow":
// 1. Get cards that are due for review
// 2. Process a user's rating for a card
// 3. Track session statistics
//
// The key concept: "interleaving". Rather than studying all cards from
// one deck, we mix cards from different decks. Research shows this
// strengthens learning because your brain has to context-switch,
// which builds stronger, more flexible memories.

/**
 * Get cards that are due for review right now.
 *
 * A card is "due" when its nextReviewAt date is in the past (or now).
 * New cards (never reviewed) are also due since their nextReviewAt
 * defaults to their creation time.
 *
 * The ordering implements INTERLEAVING:
 * - We sort by nextReviewAt (most overdue first)
 * - Since cards come from different decks, they naturally interleave
 * - Cards you're struggling with (short intervals) show up more often
 *
 * @param limit - Max cards to return (default 20, a typical session size)
 * @param deckId - Optional: filter to a specific deck
 */
export async function getDueCards(limit: number = 20, deckId?: string) {
  const now = new Date();

  const cards = await prisma.card.findMany({
    where: {
      nextReviewAt: { lte: now },
      ...(deckId ? { deckId } : {}),
    },
    include: {
      deck: { select: { name: true } },
    },
    orderBy: { nextReviewAt: "asc" },
    take: limit,
  });

  return cards;
}

/**
 * Process a review: update the card's spaced repetition state
 * and log the review event.
 *
 * This is called when a user rates a card (0-5).
 * It:
 * 1. Runs the SM-2 + Leitner algorithms to get new values
 * 2. Updates the card in the database
 * 3. Creates a Review record (for statistics/history)
 */
export async function reviewCard(cardId: string, rating: number) {
  // Get current card state
  const card = await prisma.card.findUnique({
    where: { id: cardId },
  });

  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }

  // Run the algorithms
  const result = processReview(
    rating,
    card.easinessFactor,
    card.interval,
    card.repetitions,
    card.leitnerBox
  );

  // Update the card and create a review record in one transaction.
  // A transaction ensures both operations succeed or both fail —
  // we never want a card updated without its review logged, or vice versa.
  const [updatedCard] = await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: {
        easinessFactor: result.easinessFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReviewAt: result.nextReviewAt,
        leitnerBox: result.leitnerBox,
      },
    }),
    prisma.review.create({
      data: {
        cardId,
        rating,
      },
    }),
  ]);

  return updatedCard;
}

/**
 * Start a new study session. Returns the session ID
 * so we can track progress during the session.
 */
export async function startSession() {
  const session = await prisma.studySession.create({
    data: {},
  });
  return session;
}

/**
 * Update a session's stats after each card review.
 * Called alongside reviewCard() during a study session.
 */
export async function updateSessionStats(
  sessionId: string,
  wasCorrect: boolean
) {
  await prisma.studySession.update({
    where: { id: sessionId },
    data: {
      cardsStudied: { increment: 1 },
      correctCount: wasCorrect ? { increment: 1 } : undefined,
      incorrectCount: !wasCorrect ? { increment: 1 } : undefined,
    },
  });
}

/**
 * End a study session (set the end time).
 */
export async function endSession(sessionId: string) {
  const session = await prisma.studySession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });
  return session;
}

/**
 * Get summary stats for the dashboard.
 */
export async function getStats() {
  const now = new Date();

  const [totalCards, dueCards, totalReviews, sessions] = await Promise.all([
    prisma.card.count(),
    prisma.card.count({ where: { nextReviewAt: { lte: now } } }),
    prisma.review.count(),
    prisma.studySession.findMany({
      orderBy: { startedAt: "desc" },
      take: 30, // Last 30 sessions for streak calculation
    }),
  ]);

  // Calculate current streak (consecutive days with at least one session)
  const streak = calculateStreak(sessions.map((s) => s.startedAt));

  // Calculate overall retention rate from recent reviews
  const recentReviews = await prisma.review.findMany({
    orderBy: { reviewedAt: "desc" },
    take: 100,
    select: { rating: true },
  });

  const retentionRate =
    recentReviews.length > 0
      ? recentReviews.filter((r) => r.rating >= 3).length /
        recentReviews.length
      : 0;

  return {
    totalCards,
    dueCards,
    totalReviews,
    streak,
    retentionRate: Math.round(retentionRate * 100),
  };
}

/**
 * Calculate how many consecutive days the user has studied.
 *
 * Looks at session dates and counts backwards from today.
 * If you studied today and yesterday but not the day before, streak = 2.
 */
function calculateStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;

  // Get unique days (ignore time, just compare dates)
  const uniqueDays = new Set(
    sessionDates.map((d) => d.toISOString().split("T")[0])
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (uniqueDays.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      // Haven't studied today yet — that's okay, check yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}
