"use client";

import { useState } from "react";
import { FLASHCARD_PROMPT, USAGE_GUIDE } from "@/lib/prompt-template";

export default function ImportPage() {
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function copyPrompt() {
    await navigator.clipboard.writeText(FLASHCARD_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleImport() {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Importen misslyckades");
        return;
      }

      setResult(data.summary);
      setFile(null);
    } catch {
      setError("Något gick fel. Försök igen.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div className="mb-10 rounded-2xl bg-gradient-to-br from-green-light via-white to-cream-dark border border-cream-dark/40 p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-black">Importera kort</h1>
        <p className="text-gray">
          Skapa flashcards med AI, sen importera dem här.
        </p>
      </div>

      {/* Steg-för-steg-guide */}
      <div className="mb-6 rounded-2xl border border-cream-dark/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-black">
          {USAGE_GUIDE.title}
        </h2>
        <ol className="space-y-4">
          {USAGE_GUIDE.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green to-green-dark text-xs font-bold text-white shadow-sm">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-black">{step.title}</p>
                <p className="text-sm text-gray">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Prompt-sektion */}
      <div className="mb-6 rounded-2xl border border-cream-dark/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-black">Flashcard-prompt</h2>
          <button
            onClick={copyPrompt}
            className="rounded-xl bg-gradient-to-r from-green to-green-dark px-5 py-2 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            {copied ? "Kopierad!" : "Kopiera prompt"}
          </button>
        </div>
        <pre className="max-h-64 overflow-auto rounded-xl bg-gradient-to-br from-cream to-cream-dark p-5 text-sm leading-relaxed text-black border border-cream-dark/40">
          {FLASHCARD_PROMPT}
        </pre>
      </div>

      {/* Uppladdning */}
      <div className="rounded-2xl border border-cream-dark/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-black">
          Ladda upp CSV-fil
        </h2>

        <div className="mb-4">
          <label
            htmlFor="csv-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-cream-dark p-10 transition-all hover:border-green hover:bg-gradient-to-br hover:from-green-light/40 hover:to-transparent"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-light">
              <svg
                className="h-6 w-6 text-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="mb-1 text-sm font-semibold text-black">
              {file ? file.name : "Klicka för att välja en CSV-fil"}
            </p>
            <p className="text-xs text-gray">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : "eller dra och släpp"}
            </p>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="rounded-xl bg-gradient-to-r from-green to-green-dark px-6 py-3 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
        >
          {importing ? "Importerar..." : "Importera kort"}
        </button>

        {/* Felmeddelande */}
        {error && (
          <div className="mt-4 rounded-xl bg-gradient-to-r from-red-light to-white border border-red/20 px-5 py-3 text-sm font-medium text-red">
            {error}
          </div>
        )}

        {/* Lyckat */}
        {result && (
          <div className="mt-4 rounded-xl bg-gradient-to-r from-green-light to-white border border-green/20 px-5 py-3 text-sm text-green">
            <p className="font-semibold">
              {result.totalImported} kort importerade!
            </p>
            {result.decks.map((deck: DeckResult) => (
              <p key={deck.name} className="mt-1">
                {deck.name}: {deck.imported} importerade
                {deck.skipped > 0 && `, ${deck.skipped} hoppade över`}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DeckResult {
  name: string;
  imported: number;
  skipped: number;
  errors: string[];
}

interface ImportResult {
  totalImported: number;
  totalSkipped: number;
  decks: DeckResult[];
}
