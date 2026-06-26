import React, { useState } from 'react';
import { Track } from '../types';
import { Music, FileText, Info, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CurrentTrackDetailProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number; // in seconds
}

export default function CurrentTrackDetail({ track, isPlaying, currentTime }: CurrentTrackDetailProps) {
  const [tab, setTab] = useState<'info' | 'lyrics'>('info');

  // Format time (e.g. 02:45)
  const formatTimeStr = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to highlight active lyrics based on currentTime
  const parseLyricTime = (lyricLine: string): { time: number; text: string } | null => {
    const match = lyricLine.match(/^\[(\d{2}):(\d{2})\]\s*(.*)/);
    if (!match) return null;
    const mins = parseInt(match[1]);
    const secs = parseInt(match[2]);
    const text = match[3];
    return { time: mins * 60 + secs, text };
  };

  // Find the active lyric line index
  const getActiveLyricIndex = () => {
    if (!track.lyrics) return -1;
    let activeIdx = -1;
    for (let i = 0; i < track.lyrics.length; i++) {
      const parsed = parseLyricTime(track.lyrics[i]);
      if (parsed && currentTime >= parsed.time) {
        activeIdx = i;
      }
    }
    return activeIdx;
  };

  const activeLyricIndex = getActiveLyricIndex();

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row gap-6 items-center" id="track-detail-container">
      {/* Visual Ambient Glow background */}
      <div 
        className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: track.genre === 'Clássica' ? '#a855f7' : '#6366f1' }}
      />
      <div 
        className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: track.genre === 'Clássica' ? '#e9d5ff' : '#818cf8' }}
      />

      {/* Album Cover Column / Interactive Spinning Vinyl */}
      <div className="relative shrink-0 w-44 h-44 flex items-center justify-center">
        {/* Vinyl Shadow Frame */}
        <div className="absolute inset-0 bg-black/40 rounded-full blur-md" />
        
        {/* Animated Vinyl Disc */}
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ ease: 'linear', duration: 15, repeat: Infinity, repeatType: 'loop' }}
          className="relative w-40 h-40 rounded-full bg-slate-950 border-[5px] border-slate-900 shadow-2xl flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(circle, #1e293b 15%, #020617 30%, #000 70%)`,
          }}
        >
          {/* Groove concentric lines */}
          <div className="absolute inset-2 rounded-full border border-slate-800/20" />
          <div className="absolute inset-4 rounded-full border border-slate-800/20" />
          <div className="absolute inset-6 rounded-full border border-slate-800/15" />
          <div className="absolute inset-10 rounded-full border border-slate-800/10" />
          <div className="absolute inset-14 rounded-full border border-slate-800/10" />

          {/* Actual Album Image inside the disc */}
          <div className="w-16 h-16 rounded-full border-[3px] border-slate-950 overflow-hidden relative shadow-inner">
            <img
              src={track.coverUrl}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Center Spindle Hole */}
            <div className="absolute inset-0 m-auto w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 shadow" />
          </div>
        </motion.div>

        {/* Pulse Ripple when playing */}
        {isPlaying && (
          <span className="absolute w-44 h-44 rounded-full border-2 border-indigo-500/20 animate-ping -z-10" />
        )}
      </div>

      {/* Track Info & Interactive Lyrics Column */}
      <div className="flex-1 w-full flex flex-col min-h-[176px]">
        {/* Header Tabs */}
        <div className="flex justify-between items-start border-b border-slate-800/50 pb-2 mb-3">
          <div>
            <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md mb-1.5 ${
              track.genre === 'Clássica' 
                ? 'bg-purple-900/40 text-purple-300 border border-purple-800/30' 
                : track.genre === 'Ambient'
                ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-800/30'
                : 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/30'
            }`}>
              {track.genre}
            </span>
            <h2 className="text-lg font-bold text-slate-100 line-clamp-1 leading-snug">{track.title}</h2>
            <p className="text-xs text-slate-400 font-medium">{track.artist}</p>
          </div>

          <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80 shrink-0">
            <button
              id="tab-detail-info"
              onClick={() => setTab('info')}
              className={`p-1 px-2.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all ${
                tab === 'info'
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info className="w-3 h-3" />
              Info
            </button>
            {track.lyrics && track.lyrics.length > 0 && (
              <button
                id="tab-detail-lyrics"
                onClick={() => setTab('lyrics')}
                className={`p-1 px-2.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all ${
                  tab === 'lyrics'
                    ? 'bg-slate-800 text-slate-100 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3 h-3" />
                Guia
              </button>
            )}
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto max-h-28 pr-1 space-y-2 select-none scrollbar-thin">
          <AnimatePresence mode="wait">
            {tab === 'info' ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="text-[11px] leading-relaxed text-slate-400 font-medium whitespace-pre-line"
              >
                {track.description || 'Nenhuma descrição adicional disponível para esta faixa.'}
                {track.album && (
                  <div className="mt-2 text-slate-500 text-[10px] font-mono">
                    ÁLBUM: {track.album.toUpperCase()}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="lyrics"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-1.5 font-mono"
              >
                {track.lyrics?.map((line, idx) => {
                  const parsed = parseLyricTime(line);
                  const isLineActive = activeLyricIndex === idx;
                  const textToShow = parsed ? parsed.text : line;

                  return (
                    <div
                      key={idx}
                      className={`text-[10px] transition-all duration-300 py-0.5 rounded px-1.5 ${
                        isLineActive
                          ? 'text-indigo-300 bg-indigo-500/10 font-bold scale-[1.01] border-l-2 border-indigo-500'
                          : 'text-slate-500 hover:text-slate-400 font-medium'
                      }`}
                    >
                      {parsed && (
                        <span className="text-[9px] text-slate-600 mr-2 select-none">
                          {formatTimeStr(parsed.time)}
                        </span>
                      )}
                      <span>{textToShow}</span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
