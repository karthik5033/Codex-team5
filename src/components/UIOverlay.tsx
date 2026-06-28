'use client';
import { useGameState } from '../hooks/useGameState';
import { useSceneManager } from '../hooks/useSceneManager';
import { GameState } from '../lib/gameState';

export function UIOverlay() {
  const { state, dispatch } = useGameState();
  const { currentScene, timeElapsed, outcome } = useSceneManager();

  const isDecision = state.currentState === GameState.DECISION_WINDOW;
  const isIntro = state.currentState === GameState.SCENE_INTRO;
  const isOutcomeTap = state.currentState === GameState.OUTCOME_TAP;

  if (!isDecision && !isIntro && !isOutcomeTap) return null;

  // Calculate tension percentage for visual feedback
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
            <p className="mt-2 text-xl text-gray-300 animate-pulse">
              Scene {currentScene.id}
            </p>
          )}
        </div>

        {isDecision && (
          <div className="text-right">
            <div className="text-2xl font-mono text-red-500 font-bold tracking-widest">
              {( (currentScene.decisionWindow - timeElapsed) / 1000 ).toFixed(1)}s
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

      {/* Center Dialogue / Narrative Text */}
      <div className="max-w-2xl text-center bg-black/60 p-6 rounded-lg backdrop-blur-sm">
        {isIntro && (
          <p className="text-2xl text-white italic">
            "{currentScene.dialogue.intro}"
          </p>
        )}
        
        {isOutcomeTap && outcome && (
          <div className="animate-fade-in">
            <p className="text-2xl text-white mb-4">
              "{currentScene.dialogue[outcome as keyof typeof currentScene.dialogue] || '...'}"
            </p>
            {/* Show result badge */}
            <div className={`inline-block px-4 py-1 font-bold rounded uppercase ${
              outcome === 'win' ? 'bg-green-600' :
              outcome === 'partial' ? 'bg-yellow-600' : 'bg-red-600'
            }`}>
              {outcome === 'win' ? 'Resolution' : 
               outcome === 'partial' ? 'Compromise' : 'Escalation'}
            </div>

            {/* Next Action Button */}
            <div className="mt-8 pointer-events-auto">
              <button 
                onClick={() => {
                  if (outcome === 'fail' || outcome === 'timeout' || outcome === 'conditional_fail') {
                    dispatch({ type: 'TRANSITION', payload: GameState.FIGHT_INIT });
                  } else if (currentScene.id === 3) {
                    dispatch({ type: 'TRANSITION', payload: GameState.GAME_WIN });
                  } else {
                    dispatch({ type: 'NEXT_SCENE' });
                  }
                }}
                className="px-6 py-2 bg-white text-black hover:bg-gray-200 transition font-bold"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Instructions */}
      <div className="w-full text-center">
        {isIntro && (
          <button 
            className="pointer-events-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest rounded animate-pulse"
            onClick={() => dispatch({ type: 'TRANSITION', payload: GameState.DECISION_WINDOW })}
          >
            START SCENE
          </button>
        )}
        {isDecision && (
          <p className="text-gray-400 tracking-widest text-sm uppercase">
            [TAP] to de-escalate • [HOLD] to fight
          </p>
        )}
      </div>
    </div>
  );
}
