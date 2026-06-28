'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useGameState } from '../hooks/useGameState';
import { useSceneManager } from '../hooks/useSceneManager';
import { GameState } from '../lib/gameState';

const TOTAL_BEATS = 12;
const HIT_WINDOW = 150; // ms

type Beat = {
  timestamp: number;
  hit: boolean;
  missed: boolean;
  pulsed: boolean;
};

function generateBeats(bpm: number, patternType: string): number[] {
  const interval = 60000 / bpm;
  const out: number[] = [];

  if (patternType === 'two-track') {
    let count = 0;
    for (let i = 1; count < TOTAL_BEATS; i++) {
      out.push(i * interval);
      count++;
      if (count < TOTAL_BEATS) {
        out.push(i * interval + 200);
        count++;
      }
    }
    out.sort((a, b) => a - b);
  } else if (patternType === 'irregular') {
    let t = 0;
    for (let i = 0; i < TOTAL_BEATS; i++) {
      const v = 0.7 + Math.random() * 0.6; // ±30% of interval
      t += interval * v;
      out.push(t);
    }
  } else {
    // regular
    for (let i = 1; i <= TOTAL_BEATS; i++) {
      out.push(i * interval);
    }
  }

  return out.slice(0, TOTAL_BEATS);
}

export function FightMinigame() {
  const { dispatch } = useGameState();
  const { currentScene } = useSceneManager();

  const [hitsLanded, setHitsLanded] = useState(0);
  const [lossMeter, setLossMeter] = useState(0);

  // Animation states for the portraits
  const [playerState, setPlayerState] = useState<'idle' | 'attack' | 'damage'>('idle');
  const [antagState, setAntagState] = useState<'idle' | 'attack' | 'damage'>('idle');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatsRef = useRef<Beat[]>([]);
  const startRef = useRef(0);
  const hitsRef = useRef(0);
  const lossRef = useRef(0);
  const animRef = useRef(0);
  const lastPulseElapsed = useRef(-9999);
  const hitFlashElapsed = useRef(-9999);
  const missFlashElapsed = useRef(-9999);
  const endDispatched = useRef(false);

  const { bpm, patternType, lossMeterSize } = currentScene.fightConfig;

  // Init beats on mount
  useEffect(() => {
    const timestamps = generateBeats(bpm, patternType);
    beatsRef.current = timestamps.map(ts => ({
      timestamp: ts,
      hit: false,
      missed: false,
      pulsed: false,
    }));
    startRef.current = Date.now();
    hitsRef.current = 0;
    lossRef.current = 0;
    endDispatched.current = false;
    lastPulseElapsed.current = -9999;
    hitFlashElapsed.current = -9999;
    missFlashElapsed.current = -9999;

    return () => cancelAnimationFrame(animRef.current);
  }, [bpm, patternType]);

  // Input handler
  const handleHit = useCallback(() => {
    if (endDispatched.current) return;
    const elapsed = Date.now() - startRef.current;

    let closest: Beat | null = null;
    let minDist = Infinity;
    for (const beat of beatsRef.current) {
      if (beat.hit || beat.missed) continue;
      const dist = Math.abs(elapsed - beat.timestamp);
      if (dist <= HIT_WINDOW && dist < minDist) {
        closest = beat;
        minDist = dist;
      }
    }

    if (closest) {
      closest.hit = true;
      hitsRef.current++;
      hitFlashElapsed.current = elapsed;
      setHitsLanded(hitsRef.current);
      
      // Trigger CSS animations: Player attacks, Antag gets damaged
      setPlayerState('attack');
      setAntagState('damage');
      setTimeout(() => {
        setPlayerState('idle');
        setAntagState('idle');
      }, 200);

      if (hitsRef.current >= TOTAL_BEATS && !endDispatched.current) {
        endDispatched.current = true;
        dispatch({ type: 'TRANSITION', payload: GameState.SCENE_END });
      }
    }
  }, [dispatch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleHit();
      }
    };
    const onMouse = (e: MouseEvent) => {
      if (e.button === 0) handleHit();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onMouse);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onMouse);
    };
  }, [handleHit]);

  // rAF canvas render + beat timing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Sync canvas resolution to CSS size
      if (canvas.width !== canvas.offsetWidth) canvas.width = canvas.offsetWidth;
      if (canvas.height !== canvas.offsetHeight) canvas.height = canvas.offsetHeight;

      const elapsed = Date.now() - startRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      ctx.clearRect(0, 0, W, H);

      // Process each beat
      let allDone = true;
      for (const beat of beatsRef.current) {
        if (!beat.hit && !beat.missed) allDone = false;
        if (beat.hit || beat.missed) continue;

        // Pulse when beat arrives
        if (elapsed >= beat.timestamp && !beat.pulsed) {
          beat.pulsed = true;
          lastPulseElapsed.current = elapsed;
        }

        // Auto-miss when beat passes hit window
        if (elapsed > beat.timestamp + HIT_WINDOW) {
          beat.missed = true;
          lossRef.current++;
          missFlashElapsed.current = elapsed;
          setLossMeter(lossRef.current);

          // Trigger CSS animations: Antag attacks, Player gets damaged
          setAntagState('attack');
          setPlayerState('damage');
          setTimeout(() => {
            setAntagState('idle');
            setPlayerState('idle');
          }, 200);

          if (lossRef.current >= lossMeterSize && !endDispatched.current) {
            endDispatched.current = true;
            dispatch({ type: 'TRANSITION', payload: GameState.GAME_OVER });
            return;
          }
        }
      }

      // All beats resolved without hitting win/lose thresholds
      if (allDone && !endDispatched.current) {
        endDispatched.current = true;
        dispatch({
          type: 'TRANSITION',
          payload: hitsRef.current >= TOTAL_BEATS ? GameState.SCENE_END : GameState.GAME_OVER,
        });
        return;
      }

      // Draw incoming beat ring (contracting toward center circle)
      const nextBeat = beatsRef.current.find(b => !b.hit && !b.missed);
      if (nextBeat) {
        const timeUntil = nextBeat.timestamp - elapsed;
        if (timeUntil > 0 && timeUntil < 1200) {
          const progress = 1 - timeUntil / 1200;
          const ringR = 60 + 130 * (1 - progress);
          const alpha = 0.8 * progress;
          ctx.save();
          ctx.strokeStyle = `rgba(239,68,68,${alpha.toFixed(2)})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Beat pulse scale: 1.8 on pulse, decays to 1.0 over 300ms
      const timeSincePulse = elapsed - lastPulseElapsed.current;
      const pulseScale = timeSincePulse < 300 ? 1.0 + 0.8 * (1 - timeSincePulse / 300) : 1.0;

      // Circle color based on recent events
      const sinceHit = elapsed - hitFlashElapsed.current;
      const sinceMiss = elapsed - missFlashElapsed.current;
      let color: string;
      if (sinceHit < 200) {
        color = '#4ade80'; // green on hit
      } else if (sinceMiss < 200) {
        color = '#ffffff'; // white on miss
      } else {
        color = '#dc2626'; // red default
      }

      // Draw beat cue circle
      const radius = 60 * pulseScale;
      ctx.save();
      ctx.shadowBlur = 40 * pulseScale;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [dispatch, lossMeterSize]);

  // Determine images
  const bgImage = 
    currentScene.id === 1 ? '/assets/bg_scene1.png' :
    currentScene.id === 2 ? '/assets/bg_scene2.png' :
    '/assets/bg_scene3.png';

  const antagonistImage = 
    currentScene.id === 1 ? '/assets/char_stranger.png' :
    currentScene.id === 2 ? '/assets/char_crew.png' :
    '/assets/char_boss.png';

  const antagonistName = 
    currentScene.id === 1 ? 'Stranger' :
    currentScene.id === 2 ? 'The Crew' :
    'The Boss';

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between bg-black/90 scanlines font-sans overflow-hidden">
      
      {/* ── Background ───────────────── */}
      <div className="absolute inset-0 z-0">
         <Image 
           src={bgImage}
           alt="Scene Background"
           fill
           className="object-cover opacity-30"
           priority
         />
      </div>
      <div className="noise-overlay z-10" />

      {/* ── Fighting Game HUD ────────── */}
      <div className="w-full px-8 pt-8 flex justify-between items-start z-20">
        
        {/* Player Health Bar */}
        <div className="w-[40%]">
          <div className="flex justify-between mb-2">
            <span className="text-sm tracking-[0.4em] uppercase text-gray-300 font-bold">You</span>
            <span className="text-sm font-mono text-red-500 font-bold">
              DMG: {lossMeter} / {lossMeterSize}
            </span>
          </div>
          <div className="w-full h-4 bg-gray-900 overflow-hidden border-2 border-gray-700 transform skew-x-[-15deg]">
            <div
              className="h-full transition-all duration-200"
              style={{
                width: `${100 - (lossMeter / lossMeterSize) * 100}%`,
                background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                transformOrigin: 'left'
              }}
            />
          </div>
        </div>

        {/* BRAWL Title */}
        <div className="text-center z-20">
          <p className="text-[10px] tracking-[0.5em] uppercase text-red-700 font-bold">BRAWL</p>
          <h2 className="font-display text-4xl text-white tracking-wider drop-shadow-md">{currentScene.name}</h2>
        </div>

        {/* Antagonist Health Bar */}
        <div className="w-[40%] text-right">
          <div className="flex justify-between flex-row-reverse mb-2">
            <span className="text-sm tracking-[0.4em] uppercase text-red-400 font-bold">{antagonistName}</span>
            <span className="text-sm font-mono text-green-500 font-bold">
              HIT: {hitsLanded} / {TOTAL_BEATS}
            </span>
          </div>
          <div className="w-full h-4 bg-gray-900 overflow-hidden border-2 border-red-900 transform skew-x-[15deg]">
            <div
              className="h-full transition-all duration-200 float-right"
              style={{
                width: `${100 - (hitsLanded / TOTAL_BEATS) * 100}%`,
                background: 'linear-gradient(270deg, #b91c1c, #ef4444)',
                transformOrigin: 'right'
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Fight Arena ──────────────── */}
      <div className="relative flex-1 flex items-center justify-between px-10 md:px-24 z-20 mt-10 pointer-events-none">
        
        {/* Player Sprite */}
        <div 
          className="relative transition-transform duration-75"
          style={{
            transform: playerState === 'attack' ? 'translateX(100px) scale(1.1)' : 'translateX(0) scale(1)',
            filter: playerState === 'damage' ? 'brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5) contrast(1.2)' : 'none'
          }}
        >
          <div className={`relative w-48 h-48 md:w-80 md:h-80 rounded-xl overflow-hidden border-4 border-gray-800 shadow-2xl ${playerState === 'damage' ? 'animate-glitch' : ''}`}>
            <Image 
              src="/assets/char_player.png" 
              alt="Player" 
              fill 
              className="object-cover"
            />
          </div>
        </div>

        {/* Rhythm Canvas (Center) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <canvas ref={canvasRef} className="w-96 h-96 z-30" />
          <div className="mt-4">
            <p className="text-[10px] tracking-[0.4em] uppercase text-gray-400 bg-black/80 border border-gray-700 px-4 py-2 rounded shadow-2xl">
              PRESS SPACE ON THE BEAT
            </p>
          </div>
        </div>

        {/* Antagonist Sprite */}
        <div 
          className="relative transition-transform duration-75"
          style={{
            transform: antagState === 'attack' ? 'translateX(-100px) scale(1.1)' : 'translateX(0) scale(1)',
            filter: antagState === 'damage' ? 'brightness(1.5) contrast(1.5) grayscale(1)' : 'none'
          }}
        >
          <div className={`relative w-48 h-48 md:w-80 md:h-80 rounded-xl overflow-hidden border-4 border-red-900 shadow-2xl ${antagState === 'damage' ? 'animate-glitch' : ''}`}>
            <Image 
              src={antagonistImage} 
              alt={antagonistName} 
              fill 
              className="object-cover"
            />
          </div>
        </div>

      </div>

    </div>
  );
}
