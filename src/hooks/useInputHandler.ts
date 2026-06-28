'use client';
import { useEffect, useRef } from 'react';

type InputCallback = (type: 'tap' | 'hold') => void;

export function useInputHandler(isActive: boolean, onInput: InputCallback) {
  const pressStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      pressStartTime.current = null;
      return;
    }

    const handlePressStart = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;
      if (e instanceof MouseEvent && e.button !== 0) return;
      if (e instanceof KeyboardEvent && e.repeat) return; // Ignore hold repeats

      if (pressStartTime.current === null) {
        pressStartTime.current = Date.now();
      }
    };

    const handlePressEnd = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;
      if (e instanceof MouseEvent && e.button !== 0) return;

      if (pressStartTime.current !== null) {
        const duration = Date.now() - pressStartTime.current;
        pressStartTime.current = null;

        if (duration < 300) {
          onInput('tap');
        } else {
          onInput('hold');
        }
      }
    };

    window.addEventListener('keydown', handlePressStart);
    window.addEventListener('keyup', handlePressEnd);
    window.addEventListener('mousedown', handlePressStart);
    window.addEventListener('mouseup', handlePressEnd);

    return () => {
      window.removeEventListener('keydown', handlePressStart);
      window.removeEventListener('keyup', handlePressEnd);
      window.removeEventListener('mousedown', handlePressStart);
      window.removeEventListener('mouseup', handlePressEnd);
    };
  }, [isActive, onInput]);
}
