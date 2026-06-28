'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useGameState } from '../hooks/useGameState';
import { useInputHandler } from '../hooks/useInputHandler';
import { useSceneManager } from '../hooks/useSceneManager';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { GameState } from '../lib/gameState';
import { UIOverlay } from './UIOverlay';
import { FightMinigame } from './FightMinigame';
import { GameOverScreen } from './GameOverScreen';
import { MicIndicator } from './MicIndicator';

/**
 * ONE BUTTON ARCHITECTURE
 * ──────────────────────
 * Every screen transition is controlled by Spacebar or Left-Click.
 * No mouse-targeted buttons exist anywhere — only visual prompts
 * telling the player to press the one button.
 */

export function GameContainer() {
  const { state, dispatch } = useGameState();
  const { evaluateTap, currentScene, timeElapsed, outcome } = useSceneManager();
  const [showTitle, setShowTitle] = useState(true);
  const [introIndex, setIntroIndex] = useState(0);

  // Reset intro index when scene changes
  useEffect(() => {
    setIntroIndex(0);
  }, [state.currentSceneId]);

  const lockedUntilRef = useRef(0);

  const lockInput = useCallback((ms: number) => {
    lockedUntilRef.current = Date.now() + ms;
  }, []);

  const isLocked = useCallback(() => Date.now() < lockedUntilRef.current, []);

  // ── Central one-button handler ──────────
  const handleInput = useCallback(
    (type: 'tap' | 'hold') => {
      if (isLocked()) return;

      const s = state.currentState;

      // SCENE_INTRO → advance dialogue, then go to DECISION_WINDOW
      if (s === GameState.SCENE_INTRO) {
        lockInput(300);
        if (introIndex < currentScene.dialogue.intro.length - 1) {
          setIntroIndex(prev => prev + 1);
        } else {
          dispatch({ type: 'TRANSITION', payload: GameState.DECISION_WINDOW });
        }
        return;
      }

      // DECISION_WINDOW → tap = evaluate, hold = fight
      if (s === GameState.DECISION_WINDOW) {
        lockInput(500);
        if (type === 'tap') {
          evaluateTap();
        } else if (type === 'hold') {
          dispatch({ type: 'TRANSITION', payload: GameState.FIGHT_INIT });
        }
        return;
      }

      // OUTCOME_TAP → advance (win/partial/intimidate → next scene, fail/timeout → fight)
      if (s === GameState.OUTCOME_TAP) {
        lockInput(500);
        if (shoutOutcome || outcome === 'win' || outcome === 'partial') {
          if (currentScene.id >= 5) {
            dispatch({ type: 'TRANSITION', payload: GameState.GAME_WIN });
          } else {
            dispatch({ type: 'NEXT_SCENE' });
          }
        } else {
          // fail or timeout → fight
          dispatch({ type: 'TRANSITION', payload: GameState.FIGHT_INIT });
        }
        return;
      }

      // SCENE_END (after winning a fight) → next scene
      if (s === GameState.SCENE_END) {
        lockInput(500);
        if (currentScene.id >= 5) {
          dispatch({ type: 'TRANSITION', payload: GameState.GAME_WIN });
        } else {
          dispatch({ type: 'NEXT_SCENE' });
        }
        return;
      }

      // GAME_OVER → restart
      if (s === GameState.GAME_OVER) {
        lockInput(600);
        dispatch({ type: 'RESTART' });
        return;
      }

      // GAME_WIN → restart
      if (s === GameState.GAME_WIN) {
        lockInput(600);
        dispatch({ type: 'RESTART' });
        return;
      }
    },
    [state.currentState, evaluateTap, outcome, currentScene, dispatch, lockInput, isLocked, introIndex]
  );

  // Active for every state EXCEPT fight active (FightMinigame has its own handler)
  // and fight init (auto-transitions)
  const inputActive =
    !showTitle &&
    state.currentState !== GameState.FIGHT_ACTIVE &&
    state.currentState !== GameState.FIGHT_INIT;

  useInputHandler(inputActive, handleInput);

  // ── Voice input (shout = intimidate during decision) ──
  const handleVoiceTap = useCallback(() => {
    handleInput('tap');
  }, [handleInput]);

  const handleVoiceShout = useCallback(() => {
    if (isLocked()) return;
    const s = state.currentState;
    if (s === GameState.DECISION_WINDOW) {
      // Intimidation shout — special outcome!
      lockInput(500);
      // Set outcome to 'intimidate' and go to OUTCOME_TAP
      dispatch({ type: 'TRANSITION', payload: GameState.OUTCOME_TAP });
      // We need to signal this is an intimidate — use a ref
      shoutTriggeredRef.current = true;
    } else {
      // Outside decision window, shout acts as a tap
      handleInput('tap');
    }
  }, [state.currentState, handleInput, dispatch, lockInput, isLocked]);

  const shoutTriggeredRef = useRef(false);

  // Track shout outcome for display
  const [shoutOutcome, setShoutOutcome] = useState(false);
  useEffect(() => {
    if (shoutTriggeredRef.current && state.currentState === GameState.OUTCOME_TAP) {
      setShoutOutcome(true);
      shoutTriggeredRef.current = false;
    } else if (state.currentState !== GameState.OUTCOME_TAP) {
      setShoutOutcome(false);
    }
  }, [state.currentState]);

  const voiceInputActive = !showTitle && state.currentState !== GameState.FIGHT_ACTIVE && state.currentState !== GameState.FIGHT_INIT;
  const { micEnabled, volume, toggleMic } = useVoiceInput(voiceInputActive, {
    onTap: handleVoiceTap,
    onShout: handleVoiceShout,
  });

  // ── Title screen uses its own space listener ──
  useEffect(() => {
    if (!showTitle) return;

    let ready = false;
    const readyTimer = setTimeout(() => {
      ready = true;
    }, 1200); // prevent accidental skip

    const handler = (e: KeyboardEvent | MouseEvent) => {
      if (!ready) return;
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;
      if (e instanceof MouseEvent && e.button !== 0) return;
      setShowTitle(false);
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('mousedown', handler);
    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('mousedown', handler);
    };
  }, [showTitle]);

  // Lock input briefly when entering a new state so the player reads the screen
  useEffect(() => {
    const st = state.currentState;
    if (st === GameState.OUTCOME_TAP) lockInput(1200);
    if (st === GameState.SCENE_END) lockInput(1000);
    if (st === GameState.GAME_OVER) lockInput(2000);
    if (st === GameState.GAME_WIN) lockInput(3000);
  }, [state.currentState, lockInput]);

  if (showTitle) {
    return <TitleScreen />;
  }

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black text-white select-none scanlines font-sans"
    >
      <div className="noise-overlay" />
      <div className="vignette" />

      <UIOverlay 
        currentScene={currentScene}
        timeElapsed={timeElapsed}
        outcome={shoutOutcome ? 'intimidate' : outcome}
        introIndex={introIndex}
        micEnabled={micEnabled}
      />

      {state.currentState === GameState.FIGHT_INIT && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black">
          <div
            className="absolute inset-0 bg-red-900/80"
            style={{ animation: 'fightFlash 1.5s ease-out forwards' }}
          />
          <h1
            className="relative z-10 font-display text-[10rem] text-white tracking-[0.2em] drop-shadow-[0_0_80px_rgba(220,38,38,1)]"
            style={{ animation: 'heartbeat 0.6s ease-in-out infinite' }}
          >
            FIGHT
          </h1>
          <FightTransition />
        </div>
      )}

      {state.currentState === GameState.FIGHT_ACTIVE && <FightMinigame />}

      {state.currentState === GameState.SCENE_END && (
        <SceneEndTransition />
      )}

      {state.currentState === GameState.GAME_OVER && <GameOverScreen />}
      
      {state.currentState === GameState.GAME_WIN && <GameWinScreen />}

      {/* Mic Indicator — always visible */}
      <MicIndicator micEnabled={micEnabled} volume={volume} onToggle={toggleMic} />
    </div>
  );
}

/* ── Title Screen ─────────────────────────── */
function TitleScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col items-center justify-center scanlines">
      <div className="noise-overlay" />
      <div className="vignette" />

      <div className="z-10 text-center">
        <h1
          className="font-display text-8xl md:text-9xl tracking-[0.15em] text-white drop-shadow-[0_0_40px_rgba(220,38,38,0.5)] animate-fadeIn"
          style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
        >
          COLD BLOOD
        </h1>
        <p
          className="mt-4 text-sm tracking-[0.4em] uppercase text-gray-500 animate-fadeIn"
          style={{ animationDelay: '1s', animationFillMode: 'both' }}
        >
          One Button &nbsp;·&nbsp; Street Confrontation &nbsp;·&nbsp; No Escape
        </p>

        <div
          className="mt-16 animate-fadeIn"
          style={{ animationDelay: '1.8s', animationFillMode: 'both' }}
        >
          <div className="inline-block px-10 py-3 border border-red-900/60 text-red-500 font-display text-2xl tracking-[0.3em] uppercase animate-pulseGlow">
            PRESS SPACE
          </div>
        </div>

        <p
          className="mt-20 text-[10px] tracking-[0.5em] uppercase text-gray-700 animate-fadeIn"
          style={{ animationDelay: '2.5s', animationFillMode: 'both' }}
        >
          Buildathon 2026
        </p>
      </div>
    </div>
  );
}

/* ── Fight Transition Helper ──────────────── */
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

/* ── Scene End Screen ─────────────────────── */
function SceneEndTransition() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src="/assets/bg_scene_end.png"
          alt="Scene End Background"
          fill
          className="object-cover opacity-40 mix-blend-luminosity"
          priority
        />
      </div>
      <div className="noise-overlay z-10" />
      <div className="vignette z-10" />

      <div className="z-20 text-center flex flex-col items-center">
        <p className="font-display text-5xl md:text-7xl text-green-500 tracking-widest uppercase font-bold animate-pulse mb-4 drop-shadow-2xl">
          You survived.
        </p>
        
        {/* Visual-only prompt */}
        <div
          className="mt-16 animate-fadeIn"
          style={{ animationDelay: '1s', animationFillMode: 'both' }}
        >
          <div className="inline-block px-10 py-3 border-2 border-gray-700 bg-black/60 backdrop-blur-md text-gray-300 font-display text-xl tracking-[0.3em] uppercase shadow-2xl">
            PRESS SPACE
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Game Win Screen ──────────────────────── */
function GameWinScreen() {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black scanlines overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src="/assets/bg_game_win.png"
          alt="Game Win Background"
          fill
          className="object-cover opacity-50"
          priority
        />
      </div>
      <div className="noise-overlay z-10" />
      <div className="vignette z-10" />

      <div className="z-20 text-center">
        <h1
          className="font-display text-6xl md:text-8xl tracking-[0.2em] text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] animate-fadeIn"
          style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
        >
          You walked away.
        </h1>
        <p
          className="mt-6 text-xl text-gray-400 italic animate-fadeIn drop-shadow-md"
          style={{ animationDelay: '2s', animationFillMode: 'both' }}
        >
          Cold but intact.
        </p>

        {/* Visual-only prompt */}
        <div
          className="mt-20 animate-fadeIn"
          style={{ animationDelay: '3.5s', animationFillMode: 'both' }}
        >
          <div className="inline-block px-10 py-3 border-2 border-gray-600 bg-black/70 backdrop-blur-md text-gray-300 font-display text-xl tracking-[0.3em] uppercase shadow-2xl">
            PRESS SPACE
          </div>
        </div>
      </div>
    </div>
  );
}
