import React from 'react';
import { SleepTimerConfig } from '../types';
import { Timer, TimerOff, Play, Square } from 'lucide-react';

interface SleepTimerProps {
  config: SleepTimerConfig;
  onStartTimer: (minutes: number) => void;
  onStopTimer: () => void;
}

export default function SleepTimer({ config, onStartTimer, onStopTimer }: SleepTimerProps) {
  const PRESETS = [5, 15, 30, 45, 60];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 shadow-lg backdrop-blur-md" id="sleep-timer-container">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide">Temporizador</h3>
        {config.isActive && (
          <span className="ml-auto flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </div>

      {config.isActive ? (
        <div className="flex flex-col items-center bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="text-2xl font-mono font-bold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
            {formatTime(config.timeLeft)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium tracking-wider mt-1 uppercase">
            Tempo para suspensão
          </span>
          <button
            id="btn-cancel-timer"
            onClick={onStopTimer}
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-red-950/40 hover:bg-red-900/40 text-red-300 text-xs font-semibold rounded-lg border border-red-800/40 transition-all"
          >
            <TimerOff className="w-3.5 h-3.5" />
            Cancelar Timer
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-5 gap-1.5">
            {PRESETS.map((minutes) => (
              <button
                key={minutes}
                id={`btn-timer-preset-${minutes}`}
                onClick={() => onStartTimer(minutes)}
                className="py-1.5 px-1 bg-slate-800/50 hover:bg-indigo-600/20 hover:text-indigo-300 hover:border-indigo-500/50 text-slate-300 text-xs font-mono font-bold rounded-lg border border-slate-700/50 transition-all"
              >
                {minutes}'
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center font-medium leading-relaxed">
            Selecione uma opção para pausar a música automaticamente.
          </p>
        </div>
      )}
    </div>
  );
}
