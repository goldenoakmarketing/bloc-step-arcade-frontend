'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">

        {/* HERO SECTION */}
        <div className="text-center mb-10">
          {/* BSA Branding */}
          <div className="mb-6">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              BSA
            </h1>
            <p className="text-zinc-500 text-sm tracking-widest uppercase mt-1">
              bloc step arcade
            </p>
          </div>

          {/* Animated arcade icon */}
          <div className="text-5xl mb-4 animate-pulse drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]">
            🕹️
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              YOUR QUARTERS
            </span>
            <br />
            <span className="text-white">ARE WAITING</span>
          </h2>

          {/* Subheadline */}
          <p className="text-zinc-400 text-lg mb-8 max-w-xs mx-auto">
            The arcade where everyone wins. Play games. Find quarters. Stack rewards.
          </p>

          {/* Primary CTA */}
          <Link href="/play">
            <button className="btn btn-primary btn-lg px-12 py-4 text-lg font-bold shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all">
              ▶ START PLAYING
            </button>
          </Link>

          {/* Hook below CTA */}
          <p className="text-zinc-500 text-sm mt-4">
            🎁 Free quarters waiting in the Lost & Found
          </p>
        </div>

        {/* THE ARCADE LOOP - Visual Centerpiece */}
        <div
          className="relative mb-10 p-[2px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
          style={{
            animation: 'border-glow 3s ease-in-out infinite',
          }}
        >
          <style jsx>{`
            @keyframes border-glow {
              0%, 100% {
                box-shadow: 0 0 20px rgba(168,85,247,0.4), 0 0 40px rgba(168,85,247,0.2);
              }
              50% {
                box-shadow: 0 0 30px rgba(236,72,153,0.6), 0 0 60px rgba(236,72,153,0.3);
              }
            }

            /* Orbiting dollar sign - 6 second cycle */
            /* Positions: PLAY (top-left) → FLOW (top-right) → TIP (bottom-right) → GROW (bottom-left) */
            @keyframes orbit-dollar {
              /* At PLAY (top-left corner) */
              0%, 16.67% {
                top: 15%;
                left: 15%;
                transform: translate(-50%, -50%) scale(1.2);
                filter: drop-shadow(0 0 12px rgba(168,85,247,0.9));
              }
              /* Travel to FLOW */
              25% {
                top: 15%;
                left: 85%;
                transform: translate(-50%, -50%) scale(1);
                filter: drop-shadow(0 0 6px rgba(168,85,247,0.5));
              }
              /* At FLOW (top-right corner) */
              25.01%, 41.67% {
                top: 15%;
                left: 85%;
                transform: translate(-50%, -50%) scale(1.2);
                filter: drop-shadow(0 0 12px rgba(236,72,153,0.9));
              }
              /* Travel to TIP */
              50% {
                top: 85%;
                left: 85%;
                transform: translate(-50%, -50%) scale(1);
                filter: drop-shadow(0 0 6px rgba(236,72,153,0.5));
              }
              /* At TIP (bottom-right corner) */
              50.01%, 66.67% {
                top: 85%;
                left: 85%;
                transform: translate(-50%, -50%) scale(1.2);
                filter: drop-shadow(0 0 12px rgba(6,182,212,0.9));
              }
              /* Travel to GROW */
              75% {
                top: 85%;
                left: 15%;
                transform: translate(-50%, -50%) scale(1);
                filter: drop-shadow(0 0 6px rgba(6,182,212,0.5));
              }
              /* At GROW (bottom-left corner) */
              75.01%, 91.67% {
                top: 85%;
                left: 15%;
                transform: translate(-50%, -50%) scale(1.2);
                filter: drop-shadow(0 0 12px rgba(249,115,22,0.9));
              }
              /* Travel back to PLAY */
              100% {
                top: 15%;
                left: 15%;
                transform: translate(-50%, -50%) scale(1);
                filter: drop-shadow(0 0 6px rgba(249,115,22,0.5));
              }
            }

            /* Card pulse animations - synced with orbit */
            @keyframes pulse-play {
              0%, 16.67% {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(168,85,247,0.5);
                border-color: rgba(168,85,247,0.6);
              }
              25%, 100% {
                transform: scale(1);
                box-shadow: none;
                border-color: rgba(255,255,255,0.1);
              }
            }

            @keyframes pulse-flow {
              0%, 24% {
                transform: scale(1);
                box-shadow: none;
                border-color: rgba(255,255,255,0.1);
              }
              25%, 41.67% {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(236,72,153,0.5);
                border-color: rgba(236,72,153,0.6);
              }
              50%, 100% {
                transform: scale(1);
                box-shadow: none;
                border-color: rgba(255,255,255,0.1);
              }
            }

            @keyframes pulse-tip {
              0%, 49% {
                transform: scale(1);
                box-shadow: none;
                border-color: rgba(255,255,255,0.1);
              }
              50%, 66.67% {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(6,182,212,0.5);
                border-color: rgba(6,182,212,0.6);
              }
              75%, 100% {
                transform: scale(1);
                box-shadow: none;
                border-color: rgba(255,255,255,0.1);
              }
            }

            @keyframes pulse-grow {
              0%, 74% {
                transform: scale(1);
                box-shadow: none;
                border-color: rgba(255,255,255,0.1);
              }
              75%, 91.67% {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(249,115,22,0.5);
                border-color: rgba(249,115,22,0.6);
              }
              100% {
                transform: scale(1);
                box-shadow: none;
                border-color: rgba(255,255,255,0.1);
              }
            }

            @keyframes circle-glow {
              0%, 100% {
                opacity: 0.15;
              }
              50% {
                opacity: 0.3;
              }
            }
          `}</style>

          <div className="bg-zinc-950 rounded-2xl p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <span className="text-sm font-black tracking-widest bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                ♻️ THE ARCADE LOOP
              </span>
            </div>

            {/* 2x2 Grid with Orbiting Dollar */}
            <div className="relative">
              {/* Grid of Steps */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* PLAY */}
                <div
                  className="bg-white/5 backdrop-blur rounded-xl p-4 text-center border border-white/10 cursor-default"
                  style={{ animation: 'pulse-play 6s ease-in-out infinite' }}
                >
                  <div className="text-4xl mb-2">🎮</div>
                  <div className="font-black text-white tracking-wide">PLAY</div>
                </div>

                {/* FLOW */}
                <div
                  className="bg-white/5 backdrop-blur rounded-xl p-4 text-center border border-white/10 cursor-default"
                  style={{ animation: 'pulse-flow 6s ease-in-out infinite' }}
                >
                  <div className="text-4xl mb-2">🔄</div>
                  <div className="font-black text-white tracking-wide">FLOW</div>
                </div>

                {/* GROW */}
                <div
                  className="bg-white/5 backdrop-blur rounded-xl p-4 text-center border border-white/10 cursor-default"
                  style={{ animation: 'pulse-grow 6s ease-in-out infinite' }}
                >
                  <div className="text-4xl mb-2">🚀</div>
                  <div className="font-black text-white tracking-wide">GROW</div>
                </div>

                {/* TIP */}
                <div
                  className="bg-white/5 backdrop-blur rounded-xl p-4 text-center border border-white/10 cursor-default"
                  style={{ animation: 'pulse-tip 6s ease-in-out infinite' }}
                >
                  <div className="text-4xl mb-2">💬</div>
                  <div className="font-black text-white tracking-wide">TIP</div>
                </div>
              </div>

              {/* Center Circle Track */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: '50%',
                  left: '50%',
                  width: '70%',
                  height: '70%',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: '2px dashed rgba(168,85,247,0.2)',
                  animation: 'circle-glow 3s ease-in-out infinite',
                }}
              />

              {/* Orbiting Dollar Sign */}
              <div
                className="absolute pointer-events-none text-2xl font-black"
                style={{
                  animation: 'orbit-dollar 6s ease-in-out infinite',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                $
              </div>
            </div>

            {/* Tagline */}
            <div className="text-center">
              <p
                className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent"
                style={{
                  textShadow: '0 0 30px rgba(168,85,247,0.5)',
                  filter: 'drop-shadow(0 0 10px rgba(236,72,153,0.3))'
                }}
              >
                The coin that connects players
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Quarters circulate • Tips flow • Community grows
              </p>
            </div>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {/* PLAY */}
          <Link href="/play" className="group">
            <div className="card h-full bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all">
              <div className="text-3xl mb-2">🎮</div>
              <div className="font-bold text-white mb-1">PLAY</div>
              <p className="text-xs text-zinc-500">Simple & fun games. 1 quarter = 15 min of fun.</p>
            </div>
          </Link>

          {/* FIND */}
          <Link href="/profile" className="group">
            <div className="card h-full bg-zinc-900/80 border border-zinc-800 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] transition-all">
              <div className="text-3xl mb-2">🎁</div>
              <div className="font-bold text-white mb-1">FIND</div>
              <p className="text-xs text-zinc-500">Check Lost & Found. Claim free quarters daily.</p>
            </div>
          </Link>

          {/* STAKE */}
          <Link href="/profile" className="group">
            <div className="card h-full bg-zinc-900/80 border border-zinc-800 hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] transition-all">
              <div className="text-3xl mb-2">💰</div>
              <div className="font-bold text-white mb-1">STAKE</div>
              <p className="text-xs text-zinc-500">Earn rewards from real usage, not inflation.</p>
            </div>
          </Link>

          {/* DONATE */}
          <Link href="/profile" className="group">
            <div className="card h-full bg-zinc-900/80 border border-zinc-800 hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] transition-all">
              <div className="text-3xl mb-2">💸</div>
              <div className="font-bold text-white mb-1">DONATE</div>
              <p className="text-xs text-zinc-500">Leave quarters for others to find.</p>
            </div>
          </Link>

          {/* TIP */}
          <Link href="/info" className="group">
            <div className="card h-full bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all">
              <div className="text-3xl mb-2">💬</div>
              <div className="font-bold text-white mb-1">TIP</div>
              <p className="text-xs text-zinc-500">Send $BLOC to players & creators. No middleman.</p>
            </div>
          </Link>

          {/* COMPETE */}
          <Link href="/leaderboard" className="group">
            <div className="card h-full bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all">
              <div className="text-3xl mb-2">🏆</div>
              <div className="font-bold text-white mb-1">COMPETE</div>
              <p className="text-xs text-zinc-500">Climb the leaderboards. Bragging rights await.</p>
            </div>
          </Link>
        </div>

        {/* BOTTOM CTA */}
        <div className="text-center mb-8">
          <p className="text-zinc-400 mb-6 text-lg">
            Ready to start playing?
          </p>

          <div className="flex gap-3 justify-center">
            <Link href="/play">
              <button className="btn btn-primary px-6">
                Start Now
              </button>
            </Link>
            <Link href="/info">
              <button className="btn btn-secondary px-6">
                Learn More
              </button>
            </Link>
          </div>
        </div>

        {/* TAGLINE */}
        <div className="text-center">
          <p className="text-zinc-600 text-xs font-medium">
            BSA
          </p>
          <p className="text-zinc-700 text-xs">
            Built on Base • Powered by $BLOC
          </p>
        </div>

      </div>
    </div>
  )
}
