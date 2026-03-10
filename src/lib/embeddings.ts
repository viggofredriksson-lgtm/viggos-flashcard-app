// ============================================
// EMBEDDINGS — Semantic similarity in the browser
// ============================================
// Uses Transformers.js to run a multilingual embedding model
// directly in the browser (no API, no cost).
//
// The model converts text into a vector (list of numbers) that
// captures its *meaning*. Two sentences that mean the same thing
// will have similar vectors, even if they use completely different words.
//
// We use cosine similarity to compare vectors: 1.0 = identical meaning,
// 0.0 = unrelated, negative = opposite.
//
// Model: paraphrase-multilingual-MiniLM-L12-v2
// - Trained on 50+ languages including Swedish
// - ~120MB download, cached by the browser after first load
// - Each comparison takes ~15-50ms

import { pipeline } from "@huggingface/transformers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<any> | null = null;

/**
 * Load the embedding model. Returns immediately if already loaded.
 * Safe to call multiple times — only loads once.
 */
export async function loadEmbeddingModel(): Promise<void> {
  if (extractor) return;
  if (loadingPromise) {
    await loadingPromise;
    return;
  }

  loadingPromise = pipeline(
    "feature-extraction",
    "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
    { dtype: "fp32" as const }
  );

  extractor = await loadingPromise;
}

/**
 * Check if the model is loaded and ready.
 */
export function isModelReady(): boolean {
  return extractor !== null;
}

/**
 * Compute cosine similarity between two texts.
 * Returns a number roughly between -1 and 1, where:
 *   1.0  = identical meaning
 *   0.5+ = related/similar
 *   0.0  = unrelated
 *  <0    = opposite/irrelevant
 *
 * Must call loadEmbeddingModel() first.
 */
export async function semanticSimilarity(
  textA: string,
  textB: string
): Promise<number> {
  if (!extractor) {
    throw new Error("Embedding model not loaded. Call loadEmbeddingModel() first.");
  }

  const [embA, embB] = await Promise.all([
    extractor(textA, { pooling: "mean", normalize: true }),
    extractor(textB, { pooling: "mean", normalize: true }),
  ]);

  const vecA = embA.data as Float32Array;
  const vecB = embB.data as Float32Array;

  // Cosine similarity = dot product of normalized vectors
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }

  return dot;
}
