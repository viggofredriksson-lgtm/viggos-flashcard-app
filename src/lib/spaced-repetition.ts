// ============================================
// SPACED REPETITION ENGINE
// ============================================
// This is the brain of the app. It combines two proven algorithms:
//
// 1. SM-2 (SuperMemo 2) — Calculates WHEN to show a card again.
//    Created by Piotr Wozniak in 1987, it's the algorithm behind Anki
//    and most modern flashcard apps. The core idea: rate how well you
//    remembered (0-5), and the algorithm adjusts the interval.
//
// 2. Leitner System — Visual progress using "boxes" (1-5).
//    Correct → move up a box (longer intervals).
//    Wrong → drop back to box 1 (see it again soon).
//    This gives you a clear sense of progress.
//
// We use SM-2 for the actual scheduling math and Leitner boxes
// for visual feedback. They work together, not against each other.

// The 0-5 rating scale (SM-2 standard):
// 0 = Complete blackout — no idea at all
// 1 = Wrong — but you recognized the answer when shown
// 2 = Wrong — but the answer felt familiar
// 3 = Correct — but took significant effort to recall
// 4 = Correct — with some hesitation
// 5 = Perfect — instant recall

export interface ReviewResult {
  // SM-2 values
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  // Leitner value
  leitnerBox: number;
}

/**
 * The core SM-2 algorithm. Given a card's current state and a rating,
 * it returns the new state (when to review next, new easiness factor, etc.)
 *
 * How SM-2 works, step by step:
 *
 * 1. If you got it WRONG (rating < 3):
 *    - Reset repetitions to 0
 *    - Set interval to 1 day (start over)
 *    - Easiness factor stays the same (don't penalize permanently)
 *
 * 2. If you got it RIGHT (rating >= 3):
 *    - First correct answer → interval = 1 day
 *    - Second correct answer → interval = 6 days
 *    - After that → interval = previous interval × easiness factor
 *    - Increment the repetition counter
 *
 * 3. Always update the easiness factor using this formula:
 *    EF' = EF + (0.1 - (5 - rating) × (0.08 + (5 - rating) × 0.02))
 *    This nudges the EF up for easy cards and down for hard ones.
 *    Minimum EF is 1.3 (prevents intervals from shrinking too fast).
 */
export function calculateSm2(
  rating: number,
  currentEasinessFactor: number,
  currentInterval: number,
  currentRepetitions: number
): { easinessFactor: number; interval: number; repetitions: number } {
  // Clamp rating to 0-5
  const q = Math.max(0, Math.min(5, Math.round(rating)));

  let newEF = currentEasinessFactor;
  let newInterval: number;
  let newRepetitions: number;

  if (q < 3) {
    // Wrong answer — reset progress
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Correct answer — grow the interval
    newRepetitions = currentRepetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1; // First correct: review tomorrow
    } else if (newRepetitions === 2) {
      newInterval = 6; // Second correct: review in 6 days
    } else {
      // After that: multiply by easiness factor
      // A card with EF=2.5 (default) would go: 6 → 15 → 38 → 94 days...
      newInterval = Math.round(currentInterval * currentEasinessFactor);
    }
  }

  // Update easiness factor (the SM-2 formula)
  // This is the magic formula that makes SM-2 work.
  // Breaking it down:
  //   - Rating 5 (perfect): EF increases by +0.10
  //   - Rating 4 (good):    EF stays roughly the same (+0.00)
  //   - Rating 3 (okay):    EF decreases by -0.14
  //   - Rating 2 (wrong):   EF decreases by -0.32
  //   - Rating 1 (wrong):   EF decreases by -0.54
  //   - Rating 0 (blank):   EF decreases by -0.80
  newEF =
    newEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Floor at 1.3 — if EF gets too low, intervals would become
  // impossibly short and the card would never "graduate"
  newEF = Math.max(1.3, newEF);

  return {
    easinessFactor: newEF,
    interval: newInterval,
    repetitions: newRepetitions,
  };
}

/**
 * Leitner box update.
 *
 * Simple rules:
 * - Correct (rating >= 3): Move up one box (max 5)
 * - Wrong (rating < 3): Drop back to box 1
 *
 * The box number gives users a quick visual sense of mastery:
 * Box 1 = "I don't know this yet"
 * Box 5 = "I've nailed this"
 */
export function calculateLeitnerBox(
  rating: number,
  currentBox: number
): number {
  if (rating >= 3) {
    return Math.min(5, currentBox + 1);
  }
  return 1;
}

/**
 * Puts it all together. Takes a card's current spaced repetition state
 * and a rating, returns the complete new state.
 */
export function processReview(
  rating: number,
  currentEasinessFactor: number,
  currentInterval: number,
  currentRepetitions: number,
  currentLeitnerBox: number
): ReviewResult {
  const sm2 = calculateSm2(
    rating,
    currentEasinessFactor,
    currentInterval,
    currentRepetitions
  );

  const leitnerBox = calculateLeitnerBox(rating, currentLeitnerBox);

  // Calculate the next review date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + sm2.interval);

  return {
    ...sm2,
    nextReviewAt,
    leitnerBox,
  };
}
