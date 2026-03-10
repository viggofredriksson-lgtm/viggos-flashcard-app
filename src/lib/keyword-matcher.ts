// ============================================
// ANSWER SCORER — Combined keyword + semantic scoring
// ============================================
// Two complementary approaches:
//
// 1. KEYWORD MATCHING (fast, specific):
//    Checks if the user mentioned key terms from the answer.
//    Good at: verifying specific facts ("ATP", "cellandning").
//    Bad at: understanding rephrased explanations.
//
// 2. SEMANTIC SIMILARITY (smart, general):
//    Uses AI embeddings to compare the *meaning* of the spoken
//    answer vs the correct answer. Understands synonyms and
//    rephrasing.
//    Good at: "same meaning, different words".
//    Bad at: distinguishing which specific terms were used.
//
// Combined: keyword score catches specific terms, semantic score
// catches overall understanding. Weighted 40/60 to favor meaning
// over exact wording — because understanding > memorization.

import { semanticSimilarity, isModelReady } from "./embeddings";

// ============================================
// KEYWORD MATCHING
// ============================================

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\såäö]/g, "")
    .trim();
}

function keywordFound(keyword: string, spokenText: string): boolean {
  const normalizedKeyword = normalize(keyword);
  const normalizedSpoken = normalize(spokenText);

  if (normalizedSpoken.includes(normalizedKeyword)) return true;

  const keywordWords = normalizedKeyword.split(/\s+/);
  if (keywordWords.length > 1) {
    const matched = keywordWords.filter((w) => normalizedSpoken.includes(w));
    return matched.length >= Math.ceil(keywordWords.length * 0.7);
  }

  if (normalizedKeyword.length >= 5) {
    const prefix = normalizedKeyword.slice(
      0,
      Math.ceil(normalizedKeyword.length * 0.75)
    );
    const spokenWords = normalizedSpoken.split(/\s+/);
    return spokenWords.some(
      (w) => w.startsWith(prefix) || prefix.startsWith(w)
    );
  }

  return false;
}

// ============================================
// TYPES
// ============================================

export interface MatchResult {
  score: number; // 0-5 SM-2 scale
  matchedKeywords: string[];
  missedKeywords: string[];
  percentage: number; // 0-100 combined score, or -1 if can't score
  semanticPercentage: number; // 0-100 semantic only, or -1
  keywordPercentage: number; // 0-100 keyword only, or -1
}

// ============================================
// SCORING
// ============================================

function percentageToSm2(percentage: number): number {
  if (percentage >= 85) return 5;
  if (percentage >= 70) return 4;
  if (percentage >= 50) return 3;
  if (percentage >= 25) return 2;
  return 1;
}

/**
 * Keyword-only scoring (fallback when model isn't loaded).
 */
export function scoreAnswerKeywords(
  spokenText: string,
  keywordsString: string
): MatchResult {
  const keywords = keywordsString
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keywords.length === 0) {
    return {
      score: 3,
      matchedKeywords: [],
      missedKeywords: [],
      percentage: -1,
      semanticPercentage: -1,
      keywordPercentage: -1,
    };
  }

  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];

  for (const keyword of keywords) {
    if (keywordFound(keyword, spokenText)) {
      matchedKeywords.push(keyword);
    } else {
      missedKeywords.push(keyword);
    }
  }

  const keywordPercentage = Math.round(
    (matchedKeywords.length / keywords.length) * 100
  );

  return {
    score: percentageToSm2(keywordPercentage),
    matchedKeywords,
    missedKeywords,
    percentage: keywordPercentage,
    semanticPercentage: -1,
    keywordPercentage,
  };
}

/**
 * Combined keyword + semantic scoring.
 *
 * The semantic similarity from the model gives a raw cosine value
 * roughly in the range [-0.1, 1.0] for Swedish text. We map this
 * to a 0-100% scale, then combine:
 *
 *   combined = 40% keyword + 60% semantic
 *
 * If keywords are missing, we use 100% semantic.
 * If the model isn't loaded, we fall back to keywords only.
 */
export async function scoreAnswerCombined(
  spokenText: string,
  correctAnswer: string,
  keywordsString: string
): Promise<MatchResult> {
  const keywords = keywordsString
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  // Keyword matching
  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];

  for (const keyword of keywords) {
    if (keywordFound(keyword, spokenText)) {
      matchedKeywords.push(keyword);
    } else {
      missedKeywords.push(keyword);
    }
  }

  const keywordPercentage =
    keywords.length > 0
      ? Math.round((matchedKeywords.length / keywords.length) * 100)
      : -1;

  // Semantic similarity
  let semanticPercentage = -1;

  if (isModelReady()) {
    const rawSimilarity = await semanticSimilarity(spokenText, correctAnswer);

    // Map cosine similarity to 0-100%.
    // Based on testing with Swedish text:
    //   ~0.65+ = very good answer (same meaning)
    //   ~0.50  = somewhat related
    //   ~0.30  = vaguely related
    //   <0.10  = unrelated / "jag vet inte"
    //
    // We stretch [0.10, 0.75] → [0%, 100%] for a useful spread.
    const minSim = 0.10;
    const maxSim = 0.75;
    const clamped = Math.max(0, Math.min(1, (rawSimilarity - minSim) / (maxSim - minSim)));
    semanticPercentage = Math.round(clamped * 100);
  }

  // Combine scores
  let percentage: number;

  if (semanticPercentage >= 0 && keywordPercentage >= 0) {
    // Both available: 40% keywords, 60% semantic
    percentage = Math.round(keywordPercentage * 0.4 + semanticPercentage * 0.6);
  } else if (semanticPercentage >= 0) {
    // Only semantic (no keywords on card)
    percentage = semanticPercentage;
  } else if (keywordPercentage >= 0) {
    // Only keywords (model not loaded)
    percentage = keywordPercentage;
  } else {
    // Nothing available
    return {
      score: 3,
      matchedKeywords: [],
      missedKeywords: [],
      percentage: -1,
      semanticPercentage: -1,
      keywordPercentage: -1,
    };
  }

  return {
    score: percentageToSm2(percentage),
    matchedKeywords,
    missedKeywords,
    percentage,
    semanticPercentage,
    keywordPercentage,
  };
}
