'use client';
import { useEffect } from 'react';
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
  // Single useSceneManager instance — outcome/timeElapsed flow through here to UIOverlay
  const { evaluateTap, currentScene, timeElapsed, outcome } = useSceneManager();

  useInputHandler(
    state.currentState === GameState.DECISION_WINDOW,
    (type) => {
      if (type === 'tap') {
        evaluateTap();
      } else {
        dispatch({ type: 'TRANSITION', payload: GameState.FIGHT_INIT });
      }
    }
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none">
      <GameCanvas />
      <UIOverlay
        currentScene={currentScene}
        timeElapsed={timeElapsed}
        outcome={outcome}
      />

      {state.currentState === GameState.FIGHT_INIT && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-900">
          <h1 className="text-6xl font-black italic uppercase text-white tracking-tighter animate-pulse">
            FIGHT
          </h1>
          <FightTransition />
        </div>
      )}

      {state.currentState === GameState.FIGHT_ACTIVE && <FightMinigame />}

      {state.currentState === GameState.SCENE_END && (
        <SceneEndTransition sceneId={state.currentSceneId} />
      )}

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

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'TRANSITION', payload: GameState.FIGHT_ACTIVE });
    }, 1500);
    return () => clearTimeout(timer);
  }, [dispatch]);

  return null;
}

function SceneEndTransition({ sceneId }: { sceneId: number }) {
  const { dispatch } = useGameState();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sceneId >= 3) {
        dispatch({ type: 'TRANSITION', payload: GameState.GAME_WIN });
      } else {
        dispatch({ type: 'NEXT_SCENE' });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [sceneId, dispatch]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <p className="text-3xl text-white tracking-widest uppercase font-bold animate-pulse">
        You survived.
      </p>
    </div>
  );
}
