'use client'

export default function InfoPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🪙</div>
          <h1 className="text-2xl font-bold mb-2">How Bloc Step Works</h1>
          <p className="text-muted text-sm">Building a real-world economy, one quarter at a time</p>
        </div>

        {/* Not an Investment */}
        <div className="card mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="font-bold mb-2">This is Not an Investment</h2>
              <p className="text-sm text-muted leading-relaxed">
                Quarters are <span className="text-white">not designed to be an asset you profit from</span>.
                They're arcade tokens — meant to be spent, shared, lost, and found.
              </p>
            </div>
          </div>
        </div>

        {/* The Quarter */}
        <div className="card mb-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span>🎮</span> The Quarter
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            1 Quarter = 15 minutes of playtime. That's it. Simple arcade economics.
          </p>
          <ul className="text-sm text-muted space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Buy quarters to play games</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Insert a quarter, clock starts ticking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>When time runs out, game over</span>
            </li>
          </ul>
        </div>

        {/* Keep Playing */}
        <div className="card mb-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span>⏱️</span> Keep Playing
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Running low on time? No need to stop your game.
          </p>
          <div className="bg-zinc-900/50 rounded-lg p-3 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👆👆</span>
              <div>
                <div className="text-white font-medium">Double-tap the timer</div>
                <div className="text-muted text-xs">Add another quarter (+15 min) without interrupting your game</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📤</span>
              <div>
                <div className="text-white font-medium">Share your score</div>
                <div className="text-muted text-xs">Timer pauses while the share card is open — take your time</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted mt-3">
            When time is under 2 minutes and you have quarters available,
            you'll see a hint to double-tap for more time.
          </p>
        </div>

        {/* The Lost & Found */}
        <div className="card mb-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span>👻</span> Lost & Found
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Quarters flow through the ecosystem. They get lost, they get found.
            It's the circle of arcade life.
          </p>
          <div className="bg-zinc-900/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Every 8th quarter purchased</span>
              <span className="text-yellow-500">→ Pool</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Abandoned games (&lt;1 min)</span>
              <span className="text-yellow-500">→ Pool</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Voluntary donations</span>
              <span className="text-yellow-500">→ Pool</span>
            </div>
          </div>
          <p className="text-xs text-muted mt-3">
            Players can check the Lost & Found once per hour to see if any quarters are waiting.
            How many you find depends on luck and the pool's current state.
          </p>
        </div>

        {/* The Overflow */}
        <div className="card mb-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span>🌊</span> The Overflow
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            The Lost & Found pool has a cap of 250 quarters. When quarters overflow,
            they don't disappear — they <span className="text-white">automatically</span> feed the ecosystem.
          </p>
          <div className="bg-zinc-900/50 rounded-lg p-3 text-sm">
            <div className="text-center mb-2">
              <span className="text-emerald-400 text-xs font-medium px-2 py-0.5 bg-emerald-400/10 rounded-full">
                ⚡ AUTOMATIC
              </span>
            </div>
            <div className="text-center mb-2 text-muted text-xs">Pool Overflow Distribution</div>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">75%</div>
                <div className="text-xs text-muted">Staking Rewards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">25%</div>
                <div className="text-xs text-muted">Operations</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted mt-3">
            No manual intervention. When overflow happens, 75% <span className="text-white">instantly</span> flows
            to the staking rewards pool. The other 25% keeps the lights on.
          </p>
        </div>

        {/* Staking */}
        <div className="card mb-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span>🥩</span> Staking $BLOC
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Stake $BLOC to earn a share of the overflow. The more the arcade gets used,
            the more rewards flow to stakers.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            But remember: staking rewards come from <span className="text-white">real usage</span>,
            not from token inflation or ponzi mechanics. No usage = no rewards. It's that simple.
          </p>
        </div>

        {/* The Vision */}
        <div className="card mb-4 border-[#8b5cf6]/30">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span>🌍</span> The Bigger Picture
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Bloc Step isn't just an app. It's the foundation for a <span className="text-white">real-world economy</span> being
            built on Base. The quarters, the games, the Lost & Found — they're all pieces of something bigger.
          </p>
          <p className="text-sm text-muted leading-relaxed mb-3">
            We're not here to create another speculative token. We're here to build
            infrastructure for <span className="text-white">local commerce, tipping culture, and community rewards</span> —
            all powered by the simple, familiar concept of an arcade quarter.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Play games. Tip creators. Transact locally. That's the future we're building, one bloc step at a time.
          </p>
        </div>

        {/* TL;DR */}
        <div className="card bg-zinc-900/30">
          <h2 className="font-bold mb-3">TL;DR</h2>
          <ul className="text-sm text-muted space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-zinc-500">1.</span>
              <span>Quarters are for <span className="text-white">spending</span>, not hoarding</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-500">2.</span>
              <span>Lost quarters <span className="text-white">recirculate</span> through the ecosystem</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-500">3.</span>
              <span>Overflow feeds <span className="text-white">staking rewards</span> and operations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-500">4.</span>
              <span>Rewards come from <span className="text-white">real usage</span>, not inflation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-500">5.</span>
              <span>We're building for the <span className="text-white">real world</span>, not speculators</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
