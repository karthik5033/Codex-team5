'use client';

interface MicIndicatorProps {
  micEnabled: boolean;
  volume: number;
  onToggle: () => void;
}

export function MicIndicator({ micEnabled, volume, onToggle }: MicIndicatorProps) {
  return (
    <div
      className="fixed bottom-6 left-6 z-[100] flex items-center gap-3 select-none pointer-events-auto cursor-pointer"
      onClick={onToggle}
      title="Press M to toggle microphone"
    >
      {/* Mic Icon */}
      <div
        className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
          micEnabled
            ? 'border-green-500 bg-green-950/80 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
            : 'border-gray-600 bg-gray-900/80'
        }`}
        style={{
          animation: micEnabled ? 'heartbeat 2s ease-in-out infinite' : 'none',
        }}
      >
        {/* SVG Mic Icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={micEnabled ? '#4ade80' : '#6b7280'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>

        {/* Slash overlay when disabled */}
        {!micEnabled && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[2px] h-8 bg-red-500 rotate-45 rounded-full" />
          </div>
        )}
      </div>

      {/* Volume Meter */}
      {micEnabled && (
        <div className="flex flex-col gap-1">
          <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${Math.min(volume * 100 / 0.7, 100)}%`,
                background:
                  volume >= 0.7
                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                    : volume >= 0.35
                    ? 'linear-gradient(90deg, #eab308, #22c55e)'
                    : 'linear-gradient(90deg, #22c55e, #4ade80)',
              }}
            />
          </div>
          <span className="text-[8px] tracking-[0.3em] uppercase text-gray-500 font-bold">
            {volume >= 0.7 ? 'SHOUT!' : volume >= 0.35 ? 'VOICE' : 'LISTENING'}
          </span>
        </div>
      )}

      {/* Hint */}
      {!micEnabled && (
        <span className="text-[9px] tracking-[0.2em] uppercase text-gray-600 font-bold">
          Press M
        </span>
      )}
    </div>
  );
}
