'use client';
import Image from 'next/image';
export function GameOverScreen() {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black scanlines overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src="/assets/bg_game_over.png"
          alt="Game Over Background"
          fill
          className="object-cover opacity-60 mix-blend-multiply brightness-75 contrast-125"
          priority
        />
      </div>
      <div className="noise-overlay z-10" />
      <div className="vignette z-10" />

      <div className="z-20 text-center">
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
          <div className="inline-block px-10 py-3 border-2 border-red-900/80 bg-black/80 backdrop-blur-md text-red-500 font-display text-2xl tracking-[0.3em] uppercase animate-pulseGlow shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            PRESS SPACE
          </div>
        </div>
      </div>
    </div>
  );
}
