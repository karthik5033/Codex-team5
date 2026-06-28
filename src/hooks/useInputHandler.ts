'use client';
import { useEffect, useRef } from 'react';

type InputCallback = (type: 'tap' | 'hold') => void;

export function useInputHandler(isActive: boolean, onInput: InputCallback) {
  const pressStartTime = useRef<number | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      pressStartTime.current = null;
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      return;
    }

    const handlePressStart = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;
      if (e instanceof MouseEvent && e.button !== 0) return;
      if (e instanceof KeyboardEvent && e.repeat) return; // Ignore hold repeats

      if (pressStartTime.current === null) {
        pressStartTime.current = Date.now();
        
        // Trigger 'hold' automatically after 300ms of being held down
        holdTimeoutRef.current = setTimeout(() => {
          if (pressStartTime.current !== null) {
            pressStartTime.current = null;
            onInput('hold');
          }
        }, 300);
      }
    };

    const handlePressEnd = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;
      if (e instanceof MouseEvent && e.button !== 0) return;

      // If pressStartTime is still set, it means the key was released BEFORE the 300ms hold timeout
      if (pressStartTime.current !== null) {
        pressStartTime.current = null;
        if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
        onInput('tap');
      }
    };

    window.addEventListener('keydown', handlePressStart);
    window.addEventListener('keyup', handlePressEnd);
    window.addEventListener('mousedown', handlePressStart);
    window.addEventListener('mouseup', handlePressEnd);

    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      window.removeEventListener('keydown', handlePressStart);
      window.removeEventListener('keyup', handlePressEnd);
      window.removeEventListener('mousedown', handlePressStart);
      window.removeEventListener('mouseup', handlePressEnd);
    };
  }, [isActive, onInput]);
}
