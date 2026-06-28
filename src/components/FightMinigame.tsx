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
          ctx.lineWidth = 3;
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

  const tintMap: Record<number, string> = {
    1: 'from-red-950',
    2: 'from-orange-950',
    3: 'from-purple-950',
  };
  const tint = tintMap[currentScene.id] ?? 'from-red-950';

  return (
    <div className={`absolute inset-0 z-30 flex flex-col bg-gradient-to-b ${tint} to-black`}>
      {/* Loss meter */}
      <div className="px-8 pt-6 pb-2">
        <div className="flex justify-between text-xs uppercase tracking-widest text-red-400 mb-1">
          <span>DAMAGE</span>
          <span>{lossMeter} / {lossMeterSize}</span>
        </div>
        <div className="w-full h-3 bg-gray-900 border border-red-900 overflow-hidden">
          <div
            className="h-full bg-red-600 transition-all duration-75"
            style={{ width: `${(lossMeter / lossMeterSize) * 100}%` }}
          />
        </div>
      </div>

      {/* Canvas: beat cue animation */}
      <canvas ref={canvasRef} className="flex-1 w-full" />

      {/* Bottom HUD */}
      <div className="px-8 pb-6 flex flex-col items-center gap-1">
        <p className="text-white font-bold text-3xl tabular-nums">
          {hitsLanded} / {TOTAL_BEATS}
        </p>
        <p className="text-gray-500 text-xs uppercase tracking-widest">HITS LANDED</p>
        <p className="text-gray-400 text-sm uppercase tracking-widest mt-3">
          PRESS SPACE ON THE BEAT
        </p>
      </div>
    </div>
  );
}
