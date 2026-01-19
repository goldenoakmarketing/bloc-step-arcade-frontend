'use client'

export function Footer() {
  return (
    <footer className="relative py-8 mt-auto">
      <div className="absolute inset-0 bg-gradient-to-t from-arcade-black to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 text-center">
        <p className="font-pixel text-[10px] text-gray-600">
          © 2024 BLOC STEP ARCADE
        </p>
        <p className="font-arcade text-xs text-gray-700 mt-2">
          INSERT COIN TO CONTINUE
        </p>

        {/* Decorative elements */}
        <div className="flex justify-center gap-4 mt-4">
          <span className="text-xl opacity-50">👾</span>
          <span className="text-xl opacity-50">🎮</span>
          <span className="text-xl opacity-50">🕹️</span>
          <span className="text-xl opacity-50">💎</span>
          <span className="text-xl opacity-50">🚀</span>
        </div>
      </div>
    </footer>
  )
}
