import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, Repeat, Repeat1 } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number; // in seconds
  duration: number; // in seconds
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  isShuffle: boolean;
  onShuffleToggle: () => void;
  loopMode: 'none' | 'one' | 'all';
  onLoopModeCycle: () => void;
}

export default function PlayerControls({
  isPlaying,
  onPlayPauseToggle,
  onNext,
  onPrev,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onMuteToggle,
  isShuffle,
  onShuffleToggle,
  loopMode,
  onLoopModeCycle,
}: PlayerControlsProps) {
  // Format time (e.g. 02:45)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value));
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col gap-4" id="player-controls-container">
      {/* Time Timeline Progress Bar */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="relative group w-full flex items-center">
          <input
            id="timeline-slider"
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 outline-none transition-all"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #a855f7 ${currentPercent}%, #1e293b ${currentPercent}%, #1e293b 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls Panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Shuffle and Loop Modes */}
        <div className="flex items-center gap-3">
          {/* Shuffle button */}
          <button
            id="btn-control-shuffle"
            onClick={onShuffleToggle}
            title={isShuffle ? 'Desativar Ordem Aleatória' : 'Ativar Ordem Aleatória'}
            className={`p-2 rounded-lg transition-all border ${
              isShuffle
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-400 shadow shadow-indigo-950'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Loop Cycle Button */}
          <button
            id="btn-control-loop"
            onClick={onLoopModeCycle}
            title={
              loopMode === 'none'
                ? 'Sem repetição (clique para repetir uma)'
                : loopMode === 'one'
                ? 'Repetindo atual (clique para repetir todas)'
                : 'Repetindo todas (clique para desativar)'
            }
            className={`p-2 rounded-lg transition-all border flex items-center gap-1 ${
              loopMode !== 'none'
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-400 shadow shadow-purple-950'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
            }`}
          >
            {loopMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            {loopMode !== 'none' && (
              <span className="text-[9px] font-bold font-mono tracking-wider uppercase">
                {loopMode === 'one' ? '1' : 'TUDO'}
              </span>
            )}
          </button>
        </div>

        {/* Playback action controls */}
        <div className="flex items-center gap-4">
          <button
            id="btn-control-prev"
            onClick={onPrev}
            className="p-3 bg-slate-950/20 border border-slate-800/60 hover:bg-slate-800/30 hover:border-slate-700 text-slate-300 rounded-full transition-all active:scale-95"
            title="Faixa Anterior"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            id="btn-control-play-pause"
            onClick={onPlayPauseToggle}
            className="p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white rounded-full shadow-lg shadow-purple-950/40 transition-all active:scale-95 flex items-center justify-center border border-white/10"
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-[1px]" />}
          </button>

          <button
            id="btn-control-next"
            onClick={onNext}
            className="p-3 bg-slate-950/20 border border-slate-800/60 hover:bg-slate-800/30 hover:border-slate-700 text-slate-300 rounded-full transition-all active:scale-95"
            title="Próxima Faixa"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Volume slider control */}
        <div className="flex items-center gap-2.5 w-full sm:w-32 justify-end">
          <button
            id="btn-control-mute"
            onClick={onMuteToggle}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/20 transition-all shrink-0"
            title={isMuted ? 'Reativar Áudio' : 'Mutar Áudio'}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            id="volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 sm:w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 outline-none"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(isMuted ? 0 : volume) * 100}%, #1e293b ${(isMuted ? 0 : volume) * 100}%, #1e293b 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
