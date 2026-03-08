import { NextRequest, NextResponse } from "next/server";
import {
  getDueCards,
  reviewCard,
  startSession,
  updateSessionStats,
  endSession,
} from "@/lib/study-session";

// GET /api/study?deck=optional-deck-id
// Returns cards due for review
export async function GET(request: NextRequest) {
  const deckId = request.nextUrl.searchParams.get("deck") || undefined;

  try {
    const cards = await getDueCards(20, deckId);
    return NextResponse.json({ cards });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch cards";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/study
// Handles review submissions and session management
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "start-session") {
      const session = await startSession();
      return NextResponse.json({ session });
    }

    if (action === "review") {
      const { cardId, rating, sessionId } = body;

      if (!cardId || rating === undefined) {
        return NextResponse.json(
          { error: "cardId and rating are required" },
          { status: 400 }
        );
      }

      const updatedCard = await reviewCard(cardId, rating);

      if (sessionId) {
        await updateSessionStats(sessionId, rating >= 3);
      }

      return NextResponse.json({ card: updatedCard });
    }

    if (action === "end-session") {
      const { sessionId } = body;
      const session = await endSession(sessionId);
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
