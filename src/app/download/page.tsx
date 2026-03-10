"use client";

import { useState } from "react";

type Platform = "mac" | "windows";

const MAC_COMMAND = `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/viggofredriksson-lgtm/viggos-flashcard-app/main/install.sh)"`;
const WINDOWS_COMMAND = `powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/viggofredriksson-lgtm/viggos-flashcard-app/main/install.ps1 | iex"`;

const TUTORIALS: Record<
  Platform,
  { terminal: string; openInstructions: string; steps: string[] }
> = {
  mac: {
    terminal: "Terminal",
    openInstructions:
      "Tryck Cmd + Mellanslag, skriv \"Terminal\", och tryck Enter.",
    steps: [
      "Öppna Terminal (se ovan).",
      "Kopiera kommandot nedan (klicka på kopiera-knappen).",
      "Klistra in det i Terminal (Cmd + V) och tryck Enter.",
      "Vänta tills installationen är klar (3-5 min). Om en popup dyker upp om \"Command Line Tools\" — klicka Install och vänta.",
      "Klart! Du har nu en genväg på skrivbordet: \"starta-flashcards\". Dubbelklicka på den varje gång du vill plugga.",
    ],
  },
  windows: {
    terminal: "PowerShell",
    openInstructions:
      "Högerklicka på Start-knappen (Windows-ikonen längst ner till vänster) och välj \"PowerShell\" eller \"Terminal\".",
    steps: [
      "Öppna PowerShell (se ovan).",
      "Kopiera kommandot nedan (klicka på kopiera-knappen).",
      "Klistra in det i PowerShell (Ctrl + V) och tryck Enter.",
      "Vänta tills installationen är klar (3-5 min). Allt sker automatiskt.",
      "Klart! Du har nu en genväg på skrivbordet: \"starta-flashcards\". Dubbelklicka på den varje gång du vill plugga.",
    ],
  },
};

export default function DownloadPage() {
  const [platform, setPlatform] = useState<Platform>("mac");
  const [copied, setCopied] = useState(false);

  const tutorial = TUTORIALS[platform];
  const command = platform === "mac" ? MAC_COMMAND : WINDOWS_COMMAND;

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10 rounded-2xl bg-gradient-to-br from-green-light via-white to-cream-dark border border-cream-dark/40 p-8 shadow-sm text-center">
        <h1 className="mb-2 text-3xl font-bold text-black">Ladda ner Flashcards</h1>
        <p className="text-gray">En installation. Sen är du igång.</p>
      </div>

      {/* Plattformsväljare */}
      <div className="mb-8 flex justify-center gap-3">
        <button
          onClick={() => {
            setPlatform("mac");
            setCopied(false);
          }}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
            platform === "mac"
              ? "bg-gradient-to-r from-green to-green-dark text-white shadow-md shadow-green/20"
              : "border border-cream-dark bg-white/80 text-gray hover:border-green/30 hover:-translate-y-0.5"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Mac
        </button>
        <button
          onClick={() => {
            setPlatform("windows");
            setCopied(false);
          }}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
            platform === "windows"
              ? "bg-gradient-to-r from-green to-green-dark text-white shadow-md shadow-green/20"
              : "border border-cream-dark bg-white/80 text-gray hover:border-green/30 hover:-translate-y-0.5"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 12V6.75l8-1.25V12H3zm0 .5h8v6.5l-8-1.25V12.5zM11.5 12V5.35l9.5-1.6V12h-9.5zm0 .5H21v7.75l-9.5-1.6V12.5z" />
          </svg>
          Windows
        </button>
      </div>

      {/* Tutorial */}
      <div className="mb-6 rounded-2xl border border-cream-dark/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-black">
          Steg för steg — {platform === "mac" ? "Mac" : "Windows"}
        </h2>

        {/* Hur man öppnar terminalen */}
        <div className="mb-6 rounded-xl bg-gradient-to-br from-cream to-cream-dark/50 border border-cream-dark/40 p-4">
          <p className="text-sm font-semibold text-black mb-1">
            Hur öppnar jag {tutorial.terminal}?
          </p>
          <p className="text-sm text-gray">{tutorial.openInstructions}</p>
        </div>

        {/* Steg */}
        <ol className="space-y-4">
          {tutorial.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green to-green-dark text-xs font-bold text-white shadow-sm">
                {i + 1}
              </span>
              <p className="text-sm text-black pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Kommando */}
      <div className="rounded-2xl border border-cream-dark/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-black">
            Installationskommando
          </h2>
          <button
            onClick={copyCommand}
            className="rounded-xl bg-gradient-to-r from-green to-green-dark px-5 py-2 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            {copied ? "Kopierat!" : "Kopiera"}
          </button>
        </div>
        <p className="mb-3 text-sm text-gray">
          Klistra in detta i {tutorial.terminal} och tryck Enter:
        </p>
        <pre className="overflow-x-auto rounded-xl bg-gradient-to-br from-cream to-cream-dark p-5 text-sm leading-relaxed text-black border border-cream-dark/40 font-mono">
          {command}
        </pre>
      </div>

      {/* Efteråt */}
      <div className="mt-6 rounded-2xl border border-cream-dark/60 bg-gradient-to-br from-green-light/30 to-white p-6 shadow-sm text-center">
        <p className="text-sm font-semibold text-black mb-1">
          Efter installationen
        </p>
        <p className="text-sm text-gray">
          Dubbelklicka på <strong>&quot;starta-flashcards&quot;</strong> på
          skrivbordet. Webbläsaren öppnas automatiskt.
        </p>
      </div>
    </div>
  );
}
