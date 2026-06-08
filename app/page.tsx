import Link from "next/link";
import { TrendingUp, BarChart2, Brain, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-2xl mx-auto w-full border-b border-white/5">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-400" />
          <span className="font-bold text-sm">Investment Tracker</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Open dashboard <ArrowRight size={14} />
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-xl mx-auto w-full py-20">
        <div
          className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-8"
          style={{ animation: "fadeUp 0.5s ease both" }}
        >
          <BarChart2 size={28} className="text-emerald-400" />
        </div>

        <h1
          className="text-4xl font-bold leading-tight mb-4 tracking-tight"
          style={{ animation: "fadeUp 0.5s 0.08s ease both" }}
        >
          Portfolio intelligence,
          <br />
          <span className="text-emerald-400">not just portfolio data</span>
        </h1>

        <p
          className="text-base text-gray-400 leading-relaxed max-w-sm mb-10"
          style={{ animation: "fadeUp 0.5s 0.16s ease both" }}
        >
          Combines analyst consensus, fundamentals, and AI-generated investment theses for every holding — in one place.
        </p>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-full px-8 py-3.5 text-sm transition-colors shadow-lg shadow-emerald-500/20"
          style={{ animation: "fadeUp 0.5s 0.24s ease both" }}
        >
          Open dashboard
          <ArrowRight size={16} />
        </Link>
      </main>

      {/* Feature strip */}
      <section
        className="px-6 pb-16 max-w-xl mx-auto w-full"
        style={{ animation: "fadeUp 0.5s 0.36s ease both" }}
      >
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BarChart2, label: "Analyst consensus", desc: "Aggregated buy/hold/sell ratings." },
            { icon: TrendingUp, label: "Fundamentals", desc: "P/E, EPS, revenue trends." },
            { icon: Brain, label: "AI thesis", desc: "Claude generates per-holding insights." },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-white/4 border border-white/8 rounded-2xl p-4 flex flex-col gap-2 hover:bg-white/6 transition-colors"
            >
              <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Icon size={18} className="text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-white leading-tight">{label}</p>
              <p className="text-[11px] text-gray-500 leading-tight">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center pb-8 text-xs text-gray-700">
        Personal tool · Not financial advice
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
