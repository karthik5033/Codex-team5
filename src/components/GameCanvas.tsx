'use client';
import { useEffect, useRef } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useSceneManager } from '../hooks/useSceneManager';
import { GameState } from '../lib/gameState';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useGameState();
  const { currentScene, timeElapsed } = useSceneManager();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Resize handling (simplified)
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Clear screen
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // We only draw scene background and tension elements here.
      // If we are in the fight minigame, FightMinigame component might handle its own canvas,
      // or we handle it here. For now, Scene background.
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw background based on scene
      if (currentScene.id === 1) {
        // Scene 1: Night corner
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, canvas.height - 200, canvas.width, 200); // ground
        ctx.fillStyle = '#4a4e69';
        ctx.fillRect(cx - 100, cy - 100, 50, 200); // opponent silhouette placeholder
        ctx.fillRect(cx + 50, cy - 80, 50, 180); // player silhouette placeholder
      } else if (currentScene.id === 2) {
        // Scene 2: Daytime crew
        ctx.fillStyle = '#f4a261'; // warm sky
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#264653';
        ctx.fillRect(0, canvas.height - 150, canvas.width, 150); // ground
        // 3 guys
        ctx.fillStyle = '#e76f51';
        ctx.fillRect(cx - 150, cy - 50, 40, 150); 
        ctx.fillStyle = '#2a9d8f';
        ctx.fillRect(cx - 50, cy - 60, 40, 160); 
        ctx.fillStyle = '#e9c46a';
        ctx.fillRect(cx + 50, cy - 40, 40, 140);
        // Player
        ctx.fillStyle = '#264653';
        ctx.fillRect(cx + 200, cy - 80, 50, 180);
      } else if (currentScene.id === 3) {
        // Scene 3: Rooftop evening
        ctx.fillStyle = '#9b5de5'; // evening sky
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00f5d4';
        ctx.fillRect(100, canvas.height - 100, canvas.width - 200, 100); // roof edge
        // Opponent
        ctx.fillStyle = '#f15bb5';
        ctx.fillRect(cx - 100, cy - 100, 40, 180);
        // Player
        ctx.fillStyle = '#fee440';
        ctx.fillRect(cx + 100, cy - 80, 40, 160);
      }

      // Draw tension visual (e.g. vignette or shaking based on timeElapsed)
      if (state.currentState === GameState.DECISION_WINDOW) {
        const tensionRatio = timeElapsed / currentScene.decisionWindow;
        ctx.fillStyle = `rgba(255, 0, 0, ${tensionRatio * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state.currentState, currentScene, timeElapsed]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
