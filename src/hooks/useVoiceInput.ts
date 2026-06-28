'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

type VoiceCallbacks = {
  onTap: () => void;
  onShout: () => void;
};

const TAP_THRESHOLD = 0.35;     // Normalized volume for a tap (clap, voice)
const SHOUT_THRESHOLD = 0.70;   // Normalized volume for a shout (loud yell)
const COOLDOWN_MS = 400;        // Prevent rapid re-firing
const SAMPLE_RATE = 60;         // How often we check volume (ms)

export function useVoiceInput(isActive: boolean, callbacks: VoiceCallbacks) {
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [volume, setVolume] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTriggerRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef(callbacks);
  const isActiveRef = useRef(isActive);

  // Keep refs fresh
  useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      setMicPermission('granted');
      setMicEnabled(true);

      // Start polling volume
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      intervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS volume normalized to 0-1
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += (dataArray[i] / 255) ** 2;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        setVolume(rms);

        // Only trigger if active and not on cooldown
        if (!isActiveRef.current) return;
        const now = Date.now();
        if (now - lastTriggerRef.current < COOLDOWN_MS) return;

        if (rms >= SHOUT_THRESHOLD) {
          lastTriggerRef.current = now;
          callbacksRef.current.onShout();
        } else if (rms >= TAP_THRESHOLD) {
          lastTriggerRef.current = now;
          callbacksRef.current.onTap();
        }
      }, SAMPLE_RATE);
    } catch {
      setMicPermission('denied');
      setMicEnabled(false);
    }
  }, []);

  const stopMic = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setMicEnabled(false);
    setVolume(0);
  }, []);

  const toggleMic = useCallback(() => {
    if (micEnabled) {
      stopMic();
    } else {
      startMic();
    }
  }, [micEnabled, startMic, stopMic]);

  // Listen for 'M' key to toggle mic
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && !e.repeat) {
        e.preventDefault();
        toggleMic();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleMic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMic();
  }, [stopMic]);

  return {
    micPermission,
    micEnabled,
    volume,
    toggleMic,
  };
}
