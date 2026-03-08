import Link from "next/link";
import { getStats } from "@/lib/study-session";

export default async function Home() {
  const stats = await getStats();

  return (
    <div>
      {/* Hero section */}
      <div className="mb-10 rounded-2xl bg-gradient-to-br from-green-light via-white to-cream-dark border border-cream-dark/40 p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-black">Översikt</h1>
        <p className="text-gray">Din inlärning i ett ögonkast.</p>
      </div>

      {/* Statistik */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Att plugga" value={stats.dueCards} highlight />
        <StatCard label="Totalt kort" value={stats.totalCards} />
        <StatCard label="Rätt-andel" value={`${stats.retentionRate}%`} />
        <StatCard label="Dagars streak" value={stats.streak} />
      </div>

      {/* Snabbknappar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {stats.dueCards > 0 ? (
          <Link
            href="/study"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-green to-green-dark px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:shadow-lg hover:shadow-green/30 hover:-translate-y-0.5"
          >
            Börja plugga ({stats.dueCards} kort väntar)
          </Link>
        ) : (
          <div className="rounded-xl bg-gradient-to-r from-green-light to-cream-dark border border-green-muted px-6 py-3.5 text-sm font-medium text-green">
            Inga kort att plugga just nu — bra jobbat!
          </div>
        )}
        <Link
          href="/import"
          className="inline-flex items-center justify-center rounded-xl border border-cream-dark bg-white/70 px-6 py-3.5 text-sm font-semibold text-black shadow-sm transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5"
        >
          Importera kort
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
        highlight
          ? "border-green/30 bg-gradient-to-br from-green-light to-white"
          : "border-cream-dark/60 bg-white/80 backdrop-blur-sm"
      }`}
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray">
        {label}
      </p>
      <p className={`text-3xl font-bold ${highlight ? "text-green" : "text-black"}`}>
        {value}
      </p>
    </div>
  );
}
