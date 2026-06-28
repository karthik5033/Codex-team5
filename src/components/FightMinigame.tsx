'use client';
import { useEffect, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useSceneManager } from '../hooks/useSceneManager';
import { GameState } from '../lib/gameState';

export function FightMinigame() {
  const { dispatch } = useGameState();
  const { currentScene } = useSceneManager();
  
  const [lossMeter, setLossMeter] = useState(0);
  const [beatsHit, setBeatsHit] = useState(0);
  
  // A simple simulated fight logic for the prototype
  useEffect(() => {
    // We auto-progress the fight based on random inputs for now 
    // or just require the user to hit space quickly.
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setBeatsHit(b => b + 1);
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
  
  useEffect(() => {
    if (beatsHit > 10) {
      dispatch({ type: 'TRANSITION', payload: GameState.SCENE_END });
    }
  }, [beatsHit, dispatch]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate taking damage if not hitting beats
      setLossMeter(m => m + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (lossMeter >= currentScene.fightConfig.lossMeterSize) {
      dispatch({ type: 'TRANSITION', payload: GameState.GAME_OVER });
    }
  }, [lossMeter, currentScene.fightConfig.lossMeterSize, dispatch]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-8 bg-black/80 backdrop-blur">
      <div className="w-full text-center">
        <h2 className="text-4xl text-red-500 font-bold uppercase italic tracking-widest">
          BRAWL
        </h2>
        <p className="text-white mt-2">MASH SPACE TO FIGHT!</p>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-64 h-8 bg-gray-900 border-2 border-red-900 relative">
          <div 
            className="absolute left-0 top-0 h-full bg-red-600 transition-all"
            style={{ width: `${(lossMeter / currentScene.fightConfig.lossMeterSize) * 100}%` }}
          />
        </div>
        <p className="text-red-500 font-bold uppercase mt-2">Damage Taken</p>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="w-64 h-8 bg-gray-900 border-2 border-green-900 relative">
          <div 
            className="absolute left-0 top-0 h-full bg-green-600 transition-all"
            style={{ width: `${(beatsHit / 11) * 100}%` }}
          />
        </div>
        <p className="text-green-500 font-bold uppercase mt-2">Hits Landed</p>
      </div>
    </div>
  );
}
