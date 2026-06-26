import React, { useState } from 'react';
import { Track } from '../types';
import { Info, FileText, Pencil, Sparkles, Save, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CurrentTrackDetailProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number; // in seconds
  onUpdateLyrics: (trackId: string, lyrics: string[]) => void;
}

export default function CurrentTrackDetail({ 
  track, 
  isPlaying, 
  currentTime, 
  onUpdateLyrics 
}: CurrentTrackDetailProps) {
  const [tab, setTab] = useState<'info' | 'lyrics'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editedLyricsText, setEditedLyricsText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState('');

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

  const getActiveLyricText = () => {
    if (activeLyricIndex === -1 || !track.lyrics) return '';
    const line = track.lyrics[activeLyricIndex];
    const parsed = parseLyricTime(line);
    return parsed ? parsed.text : line;
  };

  const activeLyricText = getActiveLyricText();

  const handleStartEditing = () => {
    setEditedLyricsText(track.lyrics ? track.lyrics.join('\n') : '');
    setTranslationError('');
    setLyricsError('');
    setIsEditing(true);
  };

  const handleSaveLyrics = () => {
    const lines = editedLyricsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    onUpdateLyrics(track.id, lines);
    setIsEditing(false);
  };

  const handleGenerateLyricsWithIA = async () => {
    setIsGeneratingLyrics(true);
    setLyricsError('');
    try {
      const response = await fetch('/api/gemini/generate-lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          duration: track.duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar letra com IA.');
      }

      const data = await response.json();
      if (data.lyrics && Array.isArray(data.lyrics)) {
        if (isEditing) {
          setEditedLyricsText(data.lyrics.join('\n'));
        } else {
          onUpdateLyrics(track.id, data.lyrics);
        }
      } else {
        throw new Error('Letras geradas em formato inválido.');
      }
    } catch (err: any) {
      console.error(err);
      setLyricsError(err.message || 'Houve um problema ao gerar as letras.');
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleTranslateWithIA = async () => {
    if (!editedLyricsText.trim()) {
      setTranslationError('Insira alguma letra antes de traduzir.');
      return;
    }

    setIsTranslating(true);
    setTranslationError('');

    try {
      const lines = editedLyricsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const response = await fetch('/api/gemini/translate-lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lyrics: lines,
          targetLanguage: 'Português',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na tradução com IA. Verifique se o servidor está ativo.');
      }

      const data = await response.json();
      if (data.translatedLyrics && Array.isArray(data.translatedLyrics)) {
        setEditedLyricsText(data.translatedLyrics.join('\n'));
      } else {
        throw new Error('Resposta de tradução inválida.');
      }
    } catch (err: any) {
      console.error(err);
      setTranslationError(err.message || 'Houve um problema ao traduzir as letras.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row gap-6 items-center" id="track-detail-container">
      {/* Visual Ambient Glow background */}
      <div 
        className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: track.genre === 'Efeitos' ? '#6366f1' : '#10b981' }}
      />
      <div 
        className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: track.genre === 'Efeitos' ? '#818cf8' : '#34d399' }}
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

        {/* Active Lyric Overlay on the Disc */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <AnimatePresence mode="wait">
            {activeLyricText && (
              <motion.div
                key={activeLyricIndex}
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -15 }}
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[85%] bg-slate-950/95 border border-indigo-500/30 text-indigo-200 text-[10px] font-bold px-3 py-1 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.25)] text-center line-clamp-2 leading-relaxed backdrop-blur-md"
              >
                {activeLyricText}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Track Info & Interactive Lyrics Column */}
      <div className="flex-1 w-full flex flex-col min-h-[176px]">
        {/* Header Tabs */}
        <div className="flex justify-between items-start border-b border-slate-800/50 pb-2 mb-3">
          <div>
            <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md mb-1.5 ${
              track.genre === 'Efeitos' 
                ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-800/30'
                : 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/30'
            }`}>
              {track.genre}
            </span>
            <h2 className="text-lg font-bold text-slate-100 line-clamp-1 leading-snug">{track.title}</h2>
            <p className="text-xs text-slate-400 font-medium">{track.artist}</p>
          </div>

          <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80 shrink-0 items-center">
            <button
              id="tab-detail-info"
              onClick={() => { setTab('info'); setIsEditing(false); }}
              className={`p-1 px-2.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                tab === 'info'
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info className="w-3 h-3" />
              Info
            </button>
            <button
              id="tab-detail-lyrics"
              onClick={() => setTab('lyrics')}
              className={`p-1 px-2.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                tab === 'lyrics'
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              Letras
            </button>
            {tab === 'lyrics' && !isEditing && (
              <div className="flex gap-1 ml-1.5 shrink-0">
                <button
                  onClick={handleGenerateLyricsWithIA}
                  disabled={isGeneratingLyrics}
                  className="p-1 px-2.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 disabled:opacity-50 shadow cursor-pointer shrink-0"
                  title="Gerar letras sincronizadas usando a Inteligência Artificial Gemini"
                >
                  {isGeneratingLyrics ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400" />
                  ) : (
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                  )}
                  {isGeneratingLyrics ? 'Gerando...' : 'IA Letras'}
                </button>
                <button
                  onClick={handleStartEditing}
                  className="p-1 px-2.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow cursor-pointer shrink-0"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  Editar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto max-h-32 pr-1 space-y-2 select-none scrollbar-thin">
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
            ) : isEditing ? (
              <motion.div
                key="edit-lyrics"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                <div className="text-[10px] text-slate-400 flex flex-col gap-1.5">
                  <span className="font-medium text-slate-400">Insira a letra (uma por linha):</span>
                  <textarea
                    value={editedLyricsText}
                    onChange={(e) => setEditedLyricsText(e.target.value)}
                    placeholder="[00:15] Letra da música..."
                    className="w-full h-20 px-2 py-1.5 text-[10px] font-mono bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 scrollbar-thin"
                  />
                  <div className="text-[8px] text-slate-500 leading-snug">
                    Dica: Use formatação <span className="font-mono text-slate-400">[MM:SS]</span> no início das linhas para sincronizar com o tempo do reprodutor!
                  </div>
                </div>

                {translationError && (
                  <p className="text-[9px] text-rose-400 font-medium">{translationError}</p>
                )}
                {lyricsError && (
                  <p className="text-[9px] text-rose-400 font-medium">{lyricsError}</p>
                )}

                <div className="flex flex-wrap gap-1.5 justify-between items-center">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleGenerateLyricsWithIA}
                      disabled={isGeneratingLyrics}
                      className="p-1 px-2.5 rounded bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-bold flex items-center gap-1 hover:bg-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isGeneratingLyrics ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400" />
                      ) : (
                        <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                      )}
                      {isGeneratingLyrics ? 'Gerando...' : 'Gerar com IA'}
                    </button>

                    <button
                      type="button"
                      onClick={handleTranslateWithIA}
                      disabled={isTranslating}
                      className="p-1 px-2.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-bold flex items-center gap-1 hover:bg-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isTranslating ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400" />
                      ) : (
                        <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                      )}
                      {isTranslating ? 'Traduzindo...' : 'Traduzir com IA'}
                    </button>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="p-1 px-2 rounded bg-slate-800 text-slate-300 text-[9px] font-bold hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLyrics}
                      className="p-1 px-2.5 rounded bg-indigo-600 text-white text-[9px] font-bold hover:bg-indigo-500 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Save className="w-2.5 h-2.5" />
                      Salvar
                    </button>
                  </div>
                </div>
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
                {!track.lyrics || track.lyrics.length === 0 ? (
                  <div className="py-5 text-center text-[11px] text-slate-500 font-medium">
                    <p className="mb-2">Nenhuma letra disponível para esta faixa.</p>
                    {lyricsError && (
                      <p className="text-[10px] text-rose-400 mb-2 font-medium">{lyricsError}</p>
                    )}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleStartEditing}
                        className="p-1 px-3 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold hover:bg-slate-700 transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        Digitar Letras
                      </button>
                      <button
                        onClick={handleGenerateLyricsWithIA}
                        disabled={isGeneratingLyrics}
                        className="p-1 px-3 rounded bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        {isGeneratingLyrics ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-2.5 h-2.5" />
                        )}
                        {isGeneratingLyrics ? 'Gerando Letras...' : 'Gerar com IA'}
                      </button>
                    </div>
                  </div>
                ) : (
                  track.lyrics.map((line, idx) => {
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
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
