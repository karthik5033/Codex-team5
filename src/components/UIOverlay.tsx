'use client';
import { useEffect, useMemo } from 'react';
import Image from 'next/image';
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
  const isOutcome = state.currentState === GameState.OUTCOME_TAP;

  // Auto-advance from intro after 3 seconds
  useEffect(() => {
    if (!isIntro) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'TRANSITION', payload: GameState.DECISION_WINDOW });
    }, 3000);
    return () => clearTimeout(timer);
  }, [isIntro, dispatch]);

  const tensionRatio = useMemo(
    () => (isDecision ? Math.min(timeElapsed / currentScene.decisionWindow, 1) : 0),
    [isDecision, timeElapsed, currentScene.decisionWindow]
  );

  const remainingSec = useMemo(
    () =>
      isDecision
        ? Math.max((currentScene.decisionWindow - timeElapsed) / 1000, 0).toFixed(1)
        : '0.0',
    [isDecision, currentScene.decisionWindow, timeElapsed]
  );

  if (!isDecision && !isIntro && !isOutcome) return null;

  // Determine current dialogue line based on state
  let currentDialogueObj = null;
  if (isIntro) {
    currentDialogueObj = currentScene.dialogue.intro;
  } else if (isOutcome && outcome) {
    // @ts-ignore - TS might complain about dynamic key access
    currentDialogueObj = currentScene.dialogue[outcome] || currentScene.dialogue.fail;
  }

  // Render Background
  const bgImage = 
    currentScene.id === 1 ? '/assets/bg_scene1.png' :
    currentScene.id === 2 ? '/assets/bg_scene2.png' :
    '/assets/bg_scene3.png';

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-between pointer-events-none">
      
      {/* ── Background Image ─────────────── */}
      <div className="absolute inset-0 z-0">
         <Image 
           src={bgImage}
           alt="Scene Background"
           fill
           className="object-cover opacity-50"
           priority
         />
      </div>

      {/* ── Tension Red Overlay ──────────── */}
      {isDecision && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-100 mix-blend-multiply"
          style={{
            background: `radial-gradient(ellipse at center, rgba(180,20,20,${tensionRatio * 0.5}) 0%, transparent 80%)`,
          }}
        />
      )}

      {/* ── Top HUD ──────────────────────── */}
      <div className="w-full p-6 md:p-10 flex justify-between items-start z-10">
        <div className="animate-fadeIn">
          <p className="text-[10px] tracking-[0.5em] uppercase text-gray-400 mb-1 drop-shadow-md">
            Scene {currentScene.id} of 3
          </p>
          <h1 className="font-display text-4xl md:text-5xl tracking-[0.15em] text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
            {currentScene.name}
          </h1>
        </div>

        {isDecision && (
          <div className="text-right animate-fadeIn">
            <div
              className="font-display text-5xl md:text-6xl tabular-nums drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
              style={{
                color: tensionRatio > 0.7 ? '#ef4444' : tensionRatio > 0.4 ? '#f59e0b' : '#f3f4f6',
                animation: tensionRatio > 0.7 ? 'heartbeat 0.8s ease-in-out infinite' : 'none',
              }}
            >
              {remainingSec}
            </div>
            <div className="w-36 h-1.5 bg-gray-900/80 mt-3 rounded-full overflow-hidden border border-gray-700">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${tensionRatio * 100}%`,
                  background:
                    tensionRatio > 0.7
                      ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                      : tensionRatio > 0.4
                      ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                      : 'linear-gradient(90deg, #9ca3af, #f3f4f6)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Center Content ────────────────── */}
      <div className="flex-1 flex items-center justify-center z-10 w-full">
        {/* We now ALWAYS render ImageScene for Intro, Decision, and Outcome, 
            so characters stay on screen and can speak via speech bubbles. */}
        <div className="w-full text-center animate-fadeIn" style={{ animationDelay: isIntro ? '0s' : '0.3s', animationFillMode: 'both' }}>
          <ImageScene 
            sceneId={currentScene.id} 
            tension={tensionRatio} 
            dialogueObj={currentDialogueObj}
          />
        </div>
      </div>

      {/* ── Bottom Prompts ────────────────── */}
      <div className="w-full p-6 md:p-10 flex justify-center z-10 h-32 items-end">
        {isIntro && (
          <div className="animate-fadeIn">
            <p className="text-gray-400 text-xs uppercase tracking-[0.3em] font-bold animate-pulse drop-shadow-md">
              Get Ready&hellip;
            </p>
          </div>
        )}

        {isDecision && (
          <div className="text-center animate-fadeIn" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            <div className="flex gap-12 items-center bg-black/70 px-8 py-4 rounded-xl backdrop-blur-md border border-gray-800 shadow-2xl">
              <div className="text-center">
                <div className="w-14 h-14 rounded-lg border border-gray-400 bg-gray-800/80 flex items-center justify-center mb-2 animate-heartbeat" style={{ animationDuration: '2s' }}>
                  <span className="text-xs text-white font-bold font-mono drop-shadow">TAP</span>
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-gray-300 font-bold drop-shadow">De-escalate</p>
              </div>
              <div className="text-gray-400 text-2xl font-display opacity-50">or</div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-lg border border-red-500 bg-red-900/80 flex items-center justify-center mb-2">
                  <span className="text-xs text-white font-bold font-mono drop-shadow">HOLD</span>
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-red-400 font-bold drop-shadow">Fight</p>
              </div>
            </div>
          </div>
        )}

        {isOutcome && (
          <OneButtonPrompt
            text={outcome === 'fail' || outcome === 'timeout' || outcome === 'conditional_fail' ? 'PRESS SPACE TO FIGHT' : 'PRESS SPACE TO CONTINUE'}
            delayMs={800}
            glow={outcome === 'fail' || outcome === 'timeout' || outcome === 'conditional_fail'}
          />
        )}
      </div>
    </div>
  );
}

/* ── One Button Prompt ────────────────────── */
function OneButtonPrompt({
  text,
  delayMs = 0,
  glow = false,
}: {
  text: string;
  delayMs?: number;
  glow?: boolean;
}) {
  return (
    <div
      className="animate-fadeIn"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'both' }}
    >
      <div
        className={`inline-block px-8 py-3 border-2 bg-black/80 backdrop-blur-md font-display text-xl tracking-[0.3em] uppercase shadow-2xl
          ${glow
            ? 'border-red-600 text-red-500 animate-pulseGlow'
            : 'border-gray-500 text-white'
          }`}
      >
        {text}
      </div>
    </div>
  );
}

/* ── Comic Speech Bubble ──────────────────── */
function SpeechBubble({ text, speaker }: { text: string; speaker: 'player' | 'antagonist' }) {
  const isPlayer = speaker === 'player';
  
  return (
    <div 
      className={`absolute top-0 -mt-16 md:-mt-24 z-50 max-w-[250px] md:max-w-[320px] 
        ${isPlayer ? 'right-0 -mr-10' : 'left-0 -ml-10'} animate-slideUp`}
      style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }}
    >
      <div className={`relative bg-white text-black p-4 md:p-6 rounded-2xl border-4 border-black font-bold italic leading-tight text-sm md:text-base`}>
        {text}
        
        {/* Tail */}
        <div 
          className={`absolute bottom-[-16px] w-0 h-0 border-l-[12px] border-l-transparent border-t-[16px] border-t-white border-r-[12px] border-r-transparent ${isPlayer ? 'left-8' : 'right-8'}`} 
        />
        {/* Tail Border (underneath) */}
        <div 
          className={`absolute bottom-[-22px] w-0 h-0 border-l-[16px] border-l-transparent border-t-[22px] border-t-black border-r-[16px] border-r-transparent -z-10 ${isPlayer ? 'left-7' : 'right-7'}`} 
        />
      </div>
    </div>
  );
}

/* ── Cartoon Sprite Scene ─────────────────── */
function ImageScene({ 
  sceneId, 
  tension, 
  dialogueObj 
}: { 
  sceneId: number; 
  tension: number; 
  dialogueObj: { speaker: string, text: string } | null;
}) {
  const shakeIntensity = tension > 0.7 ? 'animate-glitch' : '';
  
  // Decide which antagonist image to use based on scene
  const antagonistImage = 
    sceneId === 1 ? '/assets/char_stranger.png' :
    sceneId === 2 ? '/assets/char_crew.png' :
    '/assets/char_boss.png';

  const antagonistName = 
    sceneId === 1 ? 'Stranger' :
    sceneId === 2 ? 'The Crew' :
    'The Boss';

  return (
    <div className={`relative w-full max-w-5xl mx-auto ${shakeIntensity}`}>
      <div className="flex items-center justify-between px-4 md:px-20 relative">
        
        {/* ── Player Sprite ── */}
        <div className="flex flex-col items-center relative">
          {dialogueObj && dialogueObj.speaker === 'player' && (
            <SpeechBubble text={dialogueObj.text} speaker="player" />
          )}
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden border-4 border-gray-800 shadow-2xl"
               style={{ animation: 'slideUp 0.6s ease-out, heartbeat 4s ease-in-out infinite' }}>
            <Image 
              src="/assets/char_player.png" 
              alt="Player" 
              fill 
              className="object-cover"
              style={{ filter: `brightness(${1 - tension * 0.3}) grayscale(${tension * 0.5})` }}
            />
          </div>
          <div className="mt-4 bg-black/80 px-6 py-2 border border-gray-700 rounded backdrop-blur-sm z-10">
            <p className="text-sm font-bold tracking-[0.4em] uppercase text-gray-300">You</p>
          </div>
        </div>

        {/* ── VS text ── */}
        <div className="flex-shrink-0 z-10 px-4 mt-8">
          <div
            className="font-display text-6xl md:text-8xl tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]"
            style={{
              color: `rgba(220,38,38,${0.6 + tension * 0.4})`,
              animation: tension > 0.5 ? 'heartbeat 0.6s ease-in-out infinite' : 'pulseGlow 2s infinite',
              transform: `scale(${1 + tension * 0.3})`
            }}
          >
            VS
          </div>
        </div>

        {/* ── Antagonist Sprite ── */}
        <div className="flex flex-col items-center relative">
          {dialogueObj && dialogueObj.speaker === 'antagonist' && (
            <SpeechBubble text={dialogueObj.text} speaker="antagonist" />
          )}
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden border-4 border-red-900 shadow-2xl"
               style={{ animation: 'fadeIn 0.8s ease-out, heartbeat 3.5s ease-in-out infinite reverse' }}>
            <Image 
              src={antagonistImage} 
              alt={antagonistName} 
              fill 
              className="object-cover"
              style={{ filter: `brightness(${1 + tension * 0.2}) contrast(${1 + tension * 0.5})` }}
            />
          </div>
          <div className="mt-4 bg-red-950/80 px-6 py-2 border border-red-800 rounded backdrop-blur-sm z-10">
            <p className="text-sm font-bold tracking-[0.4em] uppercase text-red-400">{antagonistName}</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
