'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
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

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md scanlines font-sans">
      <div className="noise-overlay" />

      {/* ── Top: Scene info ─────── */}
      <div className="w-full p-8 flex justify-between items-start z-10">
        <div>
          <p className="text-[10px] tracking-[0.5em] uppercase text-red-700">BRAWL</p>
          <h2 className="font-display text-4xl text-white tracking-wider drop-shadow-md">{currentScene.name}</h2>
        </div>
      </div>

      {/* ── Center: Canvas ──── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
      <div className="z-10 pointer-events-none mt-20">
        <p className="text-[10px] tracking-[0.4em] uppercase text-gray-500 bg-black/50 px-4 py-1 rounded">
          PRESS SPACE ON THE BEAT
        </p>
      </div>

      {/* ── Bottom: Meters ──────── */}
      <div className="w-full p-8 md:p-12 space-y-6 max-w-xl mx-auto z-10">
        
        {/* Hits landed */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-[10px] tracking-[0.4em] uppercase text-green-600">Hits Landed</span>
            <span className="text-sm font-mono text-green-500 font-bold">
              {hitsLanded} / {TOTAL_BEATS}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-green-900/40">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${(hitsLanded / TOTAL_BEATS) * 100}%`,
                background: 'linear-gradient(90deg, #16a34a, #22c55e)',
              }}
            />
          </div>
        </div>

        {/* Damage taken */}
        <div className={lossMeter > 0 ? 'animate-meterShake' : ''} style={{ animationDuration: '0.15s' }}>
          <div className="flex justify-between mb-2">
            <span className="text-[10px] tracking-[0.4em] uppercase text-red-600">Damage</span>
            <span className="text-sm font-mono text-red-500 font-bold">
              {lossMeter} / {lossMeterSize}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-red-900/40">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${(lossMeter / lossMeterSize) * 100}%`,
                background: 'linear-gradient(90deg, #b91c1c, #ef4444)',
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
