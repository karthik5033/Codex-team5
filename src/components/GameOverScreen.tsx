'use client';

export function GameOverScreen() {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black scanlines">
      <div className="noise-overlay" />
      <div className="vignette" />

      <div className="z-10 text-center">
        <h1
          className="font-display text-7xl md:text-8xl tracking-[0.2em] text-red-600 drop-shadow-[0_0_60px_rgba(220,38,38,0.6)] animate-fadeIn"
          style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
        >
          GAME OVER
        </h1>

        <p
          className="mt-6 text-lg text-gray-600 italic animate-fadeIn"
          style={{ animationDelay: '1.2s', animationFillMode: 'both' }}
        >
          You didn&apos;t survive the street.
        </p>

        <div className="mt-3 flex items-center justify-center gap-1 animate-fadeIn" style={{ animationDelay: '1.8s', animationFillMode: 'both' }}>
          <div className="w-12 h-px bg-gray-800" />
          <span className="text-[9px] tracking-[0.5em] uppercase text-gray-700">No second chances</span>
          <div className="w-12 h-px bg-gray-800" />
        </div>

        {/* Visual-only prompt */}
        <div
          className="mt-14 animate-fadeIn"
          style={{ animationDelay: '2.5s', animationFillMode: 'both' }}
        >
          <div className="inline-block px-10 py-3 border border-red-900/50 text-red-500 font-display text-2xl tracking-[0.3em] uppercase animate-pulseGlow">
            PRESS SPACE
          </div>
        </div>
      </div>
    </div>
  );
}
