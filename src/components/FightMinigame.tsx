'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useSceneManager } from '../hooks/useSceneManager';
import { GameState } from '../lib/gameState';

type Beat = {
  id: number;
  time: number;       // ms from fight start when this beat fires
  hit: boolean;       // was it hit?
  missed: boolean;    // was it missed?
  active: boolean;    // is it the current beat?
};

export function FightMinigame() {
  const { state, dispatch } = useGameState();
  const { currentScene } = useSceneManager();

  const [lossMeter, setLossMeter] = useState(0);
  const [beatsHit, setBeatsHit] = useState(0);
  const [totalBeats] = useState(12); // beats needed to win
  const [currentBeatActive, setCurrentBeatActive] = useState(false);
  const [hitFeedback, setHitFeedback] = useState<'none' | 'hit' | 'miss'>('none');
  const [combo, setCombo] = useState(0);
  const fightStartRef = useRef(Date.now());
  const beatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxLoss = currentScene.fightConfig.lossMeterSize;
  const bpm = currentScene.fightConfig.bpm;
  const beatInterval = (60 / bpm) * 1000; // ms between beats

  // Generate beat windows
  useEffect(() => {
    let beatCount = 0;

    beatTimerRef.current = setInterval(() => {
      beatCount++;
      setCurrentBeatActive(true);

      // Auto-miss after hit window closes (300ms)
      setTimeout(() => {
        setCurrentBeatActive((active) => {
          if (active) {
            // Player missed this beat
            setHitFeedback('miss');
            setLossMeter((m) => m + 1);
            setCombo(0);
            setTimeout(() => setHitFeedback('none'), 400);
            return false;
          }
          return false;
        });
      }, 300); // 150ms either side = 300ms window

      if (beatCount >= totalBeats + maxLoss) {
        if (beatTimerRef.current) clearInterval(beatTimerRef.current);
      }
    }, beatInterval);

    return () => {
      if (beatTimerRef.current) clearInterval(beatTimerRef.current);
    };
  }, [beatInterval, totalBeats, maxLoss]);

  // Check win/loss conditions
  useEffect(() => {
    if (lossMeter >= maxLoss) {
      dispatch({ type: 'TRANSITION', payload: GameState.GAME_OVER });
    }
  }, [lossMeter, maxLoss, dispatch]);

  useEffect(() => {
    if (beatsHit >= totalBeats) {
      // Record scene 2 win
      if (currentScene.id === 2) {
        dispatch({ type: 'SET_SCENE2_WON', payload: true });
      }
      dispatch({ type: 'TRANSITION', payload: GameState.SCENE_END });
    }
  }, [beatsHit, totalBeats, dispatch, currentScene.id]);

  // Handle input
  const handleHit = useCallback(() => {
    if (currentBeatActive) {
      setCurrentBeatActive(false);
      setBeatsHit((b) => b + 1);
      setCombo((c) => c + 1);
      setHitFeedback('hit');
      setTimeout(() => setHitFeedback('none'), 300);
    } else {
      // Hit when no beat — penalty
      setLossMeter((m) => m + 1);
      setCombo(0);
      setHitFeedback('miss');
      setTimeout(() => setHitFeedback('none'), 400);
    }
  }, [currentBeatActive]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleHit();
      }
    };
    const mouseHandler = (e: MouseEvent) => {
      if (e.button === 0) handleHit();
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('mousedown', mouseHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('mousedown', mouseHandler);
    };
  }, [handleHit]);

  const lossRatio = lossMeter / maxLoss;
  const hitRatio = beatsHit / totalBeats;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md scanlines">
      <div className="noise-overlay" />

      {/* ── Top: Scene info ─────── */}
      <div className="w-full p-6 flex justify-between items-start">
        <div>
          <p className="text-[10px] tracking-[0.5em] uppercase text-red-900">BRAWL</p>
          <h2 className="font-display text-3xl text-white tracking-wider">{currentScene.name}</h2>
        </div>
        {combo > 1 && (
          <div className="animate-fadeIn">
            <span className="font-display text-4xl text-yellow-400 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]">
              {combo}x
            </span>
          </div>
        )}
      </div>

      {/* ── Center: Beat target ──── */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Beat ring */}
        <div
          className={`relative w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-100
            ${
              hitFeedback === 'hit'
                ? 'border-green-500 bg-green-900/20 scale-110'
                : hitFeedback === 'miss'
                ? 'border-red-500 bg-red-900/20 animate-meterShake'
                : currentBeatActive
                ? 'border-red-500 bg-red-950/30'
                : 'border-gray-800 bg-gray-950/30'
            }`}
          style={{
            animation: currentBeatActive ? 'beatPulse 0.3s ease-in-out' : 'none',
            boxShadow: currentBeatActive
              ? '0 0 60px rgba(220,38,38,0.5), inset 0 0 30px rgba(220,38,38,0.2)'
              : hitFeedback === 'hit'
              ? '0 0 60px rgba(34,197,94,0.5)'
              : 'none',
          }}
        >
          {currentBeatActive ? (
            <span className="font-display text-5xl text-red-500">HIT</span>
          ) : hitFeedback === 'hit' ? (
            <span className="font-display text-4xl text-green-400">✓</span>
          ) : hitFeedback === 'miss' ? (
            <span className="font-display text-4xl text-red-400">✗</span>
          ) : (
            <span className="font-display text-3xl text-gray-700">···</span>
          )}
        </div>

        <p className="mt-6 text-[10px] tracking-[0.4em] uppercase text-gray-600">
          PRESS SPACE ON THE BEAT
        </p>
      </div>

      {/* ── Bottom: Meters ──────── */}
      <div className="w-full p-6 md:p-10 space-y-4 max-w-xl mx-auto">
        {/* Hits landed */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] tracking-[0.4em] uppercase text-green-700">Hits Landed</span>
            <span className="text-xs font-mono text-green-600">
              {beatsHit}/{totalBeats}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-green-900/30">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${hitRatio * 100}%`,
                background: 'linear-gradient(90deg, #166534, #22c55e)',
              }}
            />
          </div>
        </div>

        {/* Damage taken */}
        <div className={lossMeter > 0 ? 'animate-meterShake' : ''} style={{ animationDuration: '0.15s' }}>
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] tracking-[0.4em] uppercase text-red-800">Damage</span>
            <span className="text-xs font-mono text-red-600">
              {lossMeter}/{maxLoss}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-red-900/30">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${lossRatio * 100}%`,
                background: 'linear-gradient(90deg, #991b1b, #ef4444)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
