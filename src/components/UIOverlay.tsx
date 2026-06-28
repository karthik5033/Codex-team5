'use client';
import { useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { GameState } from '../lib/gameState';
import type { SceneConfig } from '../hooks/useSceneManager';

interface UIOverlayProps {
  currentScene: SceneConfig;
  timeElapsed: number;
  outcome: string | null;
}

export function UIOverlay({ currentScene, timeElapsed, outcome }: UIOverlayProps) {
  const { state, dispatch } = useGameState();

  const isIntro = state.currentState === GameState.SCENE_INTRO;
  const isDecision = state.currentState === GameState.DECISION_WINDOW;
  const isOutcomeTap = state.currentState === GameState.OUTCOME_TAP;

  // Auto-advance from intro after 3 seconds — no button click needed
  useEffect(() => {
    if (!isIntro) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'TRANSITION', payload: GameState.DECISION_WINDOW });
    }, 3000);
    return () => clearTimeout(timer);
  }, [isIntro, dispatch]);

  if (!isIntro && !isDecision && !isOutcomeTap) return null;

  const tensionProgress = Math.min((timeElapsed / currentScene.decisionWindow) * 100, 100);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-between pointer-events-none p-8">
      {/* Top HUD */}
      <div className="w-full flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-widest uppercase text-white drop-shadow-md">
            {currentScene.name}
          </h1>
          {isIntro && (
            <p className="mt-2 text-xl text-gray-400 animate-pulse">
              Scene {currentScene.id}
            </p>
          )}
        </div>

        {isDecision && (
          <div className="text-right">
            <div className="text-2xl font-mono text-red-500 font-bold tracking-widest">
              {Math.max(0, (currentScene.decisionWindow - timeElapsed) / 1000).toFixed(1)}s
            </div>
            <div className="w-32 h-2 bg-gray-800 mt-2 rounded overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-75"
                style={{ width: `${tensionProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Center: dialogue + outcome */}
      <div className="max-w-2xl text-center bg-black/60 p-6 rounded-lg backdrop-blur-sm">
        {isIntro && (
          <div>
            <p className="text-2xl text-white italic">
              &ldquo;{currentScene.dialogue.intro}&rdquo;
            </p>
            <p className="text-gray-500 text-xs uppercase tracking-widest mt-4 animate-pulse">
              Preparing&hellip;
            </p>
          </div>
        )}

        {isOutcomeTap && outcome && (
          <div>
            <p className="text-2xl text-white mb-4">
              &ldquo;{currentScene.dialogue[outcome as keyof typeof currentScene.dialogue] ?? '...'}&rdquo;
            </p>

            <div
              className={`inline-block px-4 py-1 font-bold rounded uppercase text-sm tracking-widest ${
                outcome === 'win'
                  ? 'bg-green-600'
                  : outcome === 'partial'
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }`}
            >
              {outcome === 'win'
                ? 'Resolution'
                : outcome === 'partial'
                ? 'Compromise'
                : 'Escalation'}
            </div>

            <div className="mt-8 pointer-events-auto">
              <button
                onClick={() => {
                  if (
                    outcome === 'fail' ||
                    outcome === 'timeout' ||
                    outcome === 'conditional_fail'
                  ) {
                    dispatch({ type: 'TRANSITION', payload: GameState.FIGHT_INIT });
                  } else if (currentScene.id === 3) {
                    dispatch({ type: 'TRANSITION', payload: GameState.GAME_WIN });
                  } else {
                    dispatch({ type: 'NEXT_SCENE' });
                  }
                }}
                className="px-6 py-2 bg-white text-black hover:bg-gray-200 transition font-bold uppercase tracking-widest"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom instructions */}
      <div className="w-full text-center">
        {isDecision && (
          <p className="text-gray-400 tracking-widest text-sm uppercase">
            [TAP] to de-escalate &bull; [HOLD] to fight
          </p>
        )}
      </div>
    </div>
  );
}
