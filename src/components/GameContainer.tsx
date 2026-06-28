'use client';
import { useGameState } from '../hooks/useGameState';
import { useInputHandler } from '../hooks/useInputHandler';
import { useSceneManager } from '../hooks/useSceneManager';
import { GameState } from '../lib/gameState';
import { GameCanvas } from './GameCanvas';
import { UIOverlay } from './UIOverlay';
import { FightMinigame } from './FightMinigame';
import { GameOverScreen } from './GameOverScreen';

export function GameContainer() {
  const { state, dispatch } = useGameState();
  const { evaluateTap } = useSceneManager();

  // Handle tap vs hold globally depending on state
  useInputHandler(
    state.currentState === GameState.DECISION_WINDOW || state.currentState === GameState.FIGHT_ACTIVE,
    (type) => {
      if (state.currentState === GameState.DECISION_WINDOW) {
        if (type === 'tap') {
          evaluateTap();
        } else if (type === 'hold') {
          dispatch({ type: 'TRANSITION', payload: GameState.FIGHT_INIT });
        }
      } else if (state.currentState === GameState.FIGHT_ACTIVE) {
        // Fight minigame inputs are handled inside the FightMinigame component or passed down
        // If we handle it here, we'd need a fight engine hook. 
        // We'll let FightMinigame handle its own input or just pass a global event.
      }
    }
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none">
      <GameCanvas />
      <UIOverlay />
      
      {state.currentState === GameState.FIGHT_INIT && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-900 animate-pulse">
          <h1 className="text-6xl font-black italic uppercase text-white tracking-tighter">
            FIGHT
          </h1>
          {/* Auto transition to ACTIVE after a short delay */}
          <FightTransition />
        </div>
      )}

      {state.currentState === GameState.FIGHT_ACTIVE && <FightMinigame />}
      
      {state.currentState === GameState.GAME_OVER && <GameOverScreen />}

      {state.currentState === GameState.GAME_WIN && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
          <h1 className="text-4xl font-bold tracking-widest uppercase text-white mb-8">
            You walked away.
          </h1>
          <p className="text-gray-400">The end.</p>
          <button 
            onClick={() => dispatch({ type: 'RESTART' })}
            className="mt-8 px-6 py-2 border border-white hover:bg-white hover:text-black transition uppercase font-bold"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

function FightTransition() {
  const { dispatch } = useGameState();
  
  import('react').then(({ useEffect }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        dispatch({ type: 'TRANSITION', payload: GameState.FIGHT_ACTIVE });
      }, 1500);
      return () => clearTimeout(timer);
    }, [dispatch]);
  });

  return null;
}
