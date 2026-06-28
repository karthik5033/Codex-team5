'use client';
import { useGameState } from '../hooks/useGameState';

export function GameOverScreen() {
  const { dispatch } = useGameState();

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <h1 className="text-6xl font-bold tracking-widest text-red-600 uppercase mb-8 drop-shadow-md">
        Game Over
      </h1>
      <p className="text-gray-300 text-xl mb-12">You didn't survive the street.</p>
      <button 
        onClick={() => dispatch({ type: 'RESTART' })}
        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest uppercase transition-colors"
      >
        Restart
      </button>
    </div>
  );
}
