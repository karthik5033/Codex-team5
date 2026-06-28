'use client';
import { useEffect, useState, useCallback } from 'react';
import scenesData from '../../public/scenes.json';
import { useGameState } from './useGameState';
import { GameState } from '../lib/gameState';

export type SceneConfig = typeof scenesData[0];

export function useSceneManager() {
  const { state, dispatch } = useGameState();
  const [currentScene, setCurrentScene] = useState<SceneConfig>(scenesData[0]);
  const [sceneStartTime, setSceneStartTime] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [outcome, setOutcome] = useState<string | null>(null);

  // Load current scene
  useEffect(() => {
    const scene = scenesData.find((s) => s.id === state.currentSceneId);
    if (scene) {
      setCurrentScene(scene);
    }
  }, [state.currentSceneId]);

  // Manage timer during DECISION_WINDOW
  useEffect(() => {
    if (state.currentState !== GameState.DECISION_WINDOW) {
      return;
    }

    const start = Date.now();
    setSceneStartTime(start);
    setTimeElapsed(0);
    setOutcome(null);

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setTimeElapsed(elapsed);

      // Check timeout
      if (elapsed >= currentScene.decisionWindow) {
        clearInterval(interval);
        handleTimeout();
      }
    }, 50); // High frequency for smooth UI updates

    return () => clearInterval(interval);
  }, [state.currentState, currentScene]);

  const handleTimeout = useCallback(() => {
    setOutcome('timeout');
    dispatch({ type: 'TRANSITION', payload: GameState.OUTCOME_TAP });
    
    // Scene 3 conditional logic: if conditional_fail or timeout, check scene 2
    if (currentScene.id === 3) {
      if (state.scene2Won) {
        setOutcome('win');
      } else {
        setOutcome('fail');
      }
    }
  }, [dispatch, currentScene, state.scene2Won]);

  const evaluateTap = useCallback(() => {
    if (state.currentState !== GameState.DECISION_WINDOW) return;

    const elapsed = Date.now() - sceneStartTime;
    
    // Find matching window
    const window = currentScene.tapWindows.find(
      (w) => elapsed >= w.start && elapsed <= w.end
    );

    let result = window ? window.outcome : 'fail';

    // Scene 3 conditional logic
    if (currentScene.id === 3 && result === 'conditional_fail') {
      result = state.scene2Won ? 'win' : 'fail';
    }

    setOutcome(result);

    // If fail in scene 1 or 2 due to bad tap, it usually auto-triggers fight per PRD
    // Or we show dialogue and then transition to fight. Let's just go to OUTCOME_TAP and handle fight transition there.
    dispatch({ type: 'TRANSITION', payload: GameState.OUTCOME_TAP });
    
    // Record if scene 2 was won cleanly
    if (currentScene.id === 2 && result === 'win') {
      dispatch({ type: 'SET_SCENE2_WON', payload: true });
    }
  }, [state, sceneStartTime, currentScene, dispatch]);

  return {
    currentScene,
    timeElapsed,
    outcome,
    evaluateTap,
  };
}
