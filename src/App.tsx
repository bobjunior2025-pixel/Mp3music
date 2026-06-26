import React, { useState, useEffect, useRef } from 'react';
import { Track, EqualizerPreset, SleepTimerConfig } from './types';
import { PRELOADED_TRACKS } from './data';
import Visualizer from './components/Visualizer';
import SleepTimer from './components/SleepTimer';
import AudioPresets from './components/AudioPresets';
import CurrentTrackDetail from './components/CurrentTrackDetail';
import PlayerControls from './components/PlayerControls';
import TrackList from './components/TrackList';
import { Music, AlertCircle, Headphones, Volume2, Sparkles, Compass, Smartphone, Download } from 'lucide-react';

export default function App() {
  // --- Persistent Storage Loading ---
  const [playlist, setPlaylist] = useState<Track[]>(() => {
    const saved = localStorage.getItem('reprodutor_playlist');
    return saved ? JSON.parse(saved) : PRELOADED_TRACKS;
  });

  // --- PWA Installation State ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [isInstallDismissed, setIsInstallDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if running as standalone PWA already
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setShowInstallBtn(false);
    } else {
      // Also check if iOS to display helpful add to home screen tip
      const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosTip(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Instalação decidida pelo usuário: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };


  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('reprodutor_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTrack, setCurrentTrack] = useState<Track>(() => {
    const savedId = localStorage.getItem('reprodutor_current_track_id');
    const savedTrack = playlist.find(t => t.id === savedId);
    return savedTrack || playlist[0];
  });

  // --- Audio State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('reprodutor_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [loopMode, setLoopMode] = useState<'none' | 'one' | 'all'>('all');

  // --- Filtering & Sorting ---
  const [selectedGenre, setSelectedGenre] = useState<'Todos' | 'Clássica' | 'Ambient' | 'Favoritos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Equalizer Preset ---
  const [equalizerPreset, setEqualizerPreset] = useState<EqualizerPreset>('flat');

  // --- Sleep Timer ---
  const [sleepTimer, setSleepTimer] = useState<SleepTimerConfig>({
    isActive: false,
    timeLeft: 0,
    duration: 15
  });

  // --- Audio Ref ---
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Sync storage ---
  useEffect(() => {
    localStorage.setItem('reprodutor_playlist', JSON.stringify(playlist));
  }, [playlist]);

  useEffect(() => {
    localStorage.setItem('reprodutor_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('reprodutor_current_track_id', currentTrack.id);
  }, [currentTrack]);

  useEffect(() => {
    localStorage.setItem('reprodutor_volume', volume.toString());
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // --- Handle Audio Load & Src Changes ---
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Update player source
    audioRef.current.src = currentTrack.url;
    audioRef.current.load();
    
    // Auto-play if isPlaying is true
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.log('Audio autoplay blocked or failed:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack]);

  // --- Trigger actual Play/Pause ---
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.log('Audio playback failed:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // --- Sleep Timer Interval Thread ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (sleepTimer.isActive && sleepTimer.timeLeft > 0 && isPlaying) {
      interval = setInterval(() => {
        setSleepTimer(prev => {
          if (prev.timeLeft <= 1) {
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
            return { ...prev, isActive: false, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else if (!isPlaying && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sleepTimer.isActive, isPlaying]);

  // --- Media Session API (Background audio controls & OS Lockscreen integration) ---
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      // Synchronize media metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Estúdio de Áudio',
        artwork: [
          { src: currentTrack.coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      // Synchronize playback state
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (e) {
      console.log('MediaSession metadata setting failed:', e);
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        skipTrack('prev');
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        skipTrack('next');
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    } catch (error) {
      console.log('MediaSession action registration failed:', error);
    }

    return () => {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [playlist, currentTrack, isShuffle, selectedGenre, favorites]);

  // --- Handle Custom Track Insertion ---
  const handleAddCustomTrack = (newTrack: Omit<Track, 'id'>) => {
    const trackWithId: Track = {
      ...newTrack,
      id: `custom-${Date.now()}`
    };
    setPlaylist(prev => [...prev, trackWithId]);
  };

  // --- Handle local file upload with auto duration extraction ---
  const handleAddLocalFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    
    // Extract metadata from file name
    const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    let title = fileName;
    let artist = 'Arquivo Local';
    
    const parts = fileName.split('-');
    if (parts.length > 1) {
      artist = parts[0].trim();
      title = parts.slice(1).join('-').trim();
    }

    const localCovers = [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400&auto=format&fit=crop'
    ];
    const randomCover = localCovers[Math.floor(Math.random() * localCovers.length)];

    // Create a temporary Audio element to extract the exact track duration
    const tempAudio = new Audio(objectUrl);
    tempAudio.addEventListener('loadedmetadata', () => {
      const durationSeconds = tempAudio.duration;
      const mins = Math.floor(durationSeconds / 60);
      const secs = Math.floor(durationSeconds % 60);
      const durationStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      const trackWithId: Track = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title,
        artist,
        url: objectUrl,
        duration: durationStr,
        coverUrl: randomCover,
        genre: 'Custom',
        description: `Música importada do seu dispositivo: ${file.name}.\n\nEsta música suporta reprodução contínua e em segundo plano com integração de tela de bloqueio (Media Session API).`,
        lyrics: [
          '[00:00] (Áudio Local Carregado com Sucesso)',
          `[00:05] Nome do arquivo: ${file.name}`,
          '[00:15] Você pode mudar de aba ou bloquear a tela, o som continuará tocando!',
          '[00:30] Controle a reprodução pelos botões do seu fone de ouvido ou teclado.'
        ]
      };

      setPlaylist(prev => [...prev, trackWithId]);
      setCurrentTrack(trackWithId);
      setIsPlaying(true);
    });
  };

  // --- Remove custom track ---
  const handleRemoveTrack = (id: string) => {
    setPlaylist(prev => {
      const updated = prev.filter(t => t.id !== id);
      // If deleted track was current track, reset to first track of remaining
      if (currentTrack.id === id) {
        setCurrentTrack(updated[0] || PRELOADED_TRACKS[0]);
        setIsPlaying(false);
      }
      return updated;
    });
  };

  // --- Toggle Favorites list ---
  const handleFavoriteToggle = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  // --- Next/Prev skipping Logic ---
  const getFilteredTracksList = () => {
    return playlist.filter((track) => {
      // Genre filter
      if (selectedGenre === 'Clássica' && track.genre !== 'Clássica') return false;
      if (selectedGenre === 'Ambient' && track.genre !== 'Ambient') return false;
      if (selectedGenre === 'Favoritos' && !favorites.includes(track.id)) return false;

      // Search match
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        return (
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const skipTrack = (direction: 'next' | 'prev') => {
    const list = getFilteredTracksList();
    if (list.length <= 1) {
      // If only one, replay it
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    // Shuffle active selection
    if (isShuffle && direction === 'next') {
      const otherTracks = list.filter(t => t.id !== currentTrack.id);
      const randomIndex = Math.floor(Math.random() * otherTracks.length);
      setCurrentTrack(otherTracks[randomIndex]);
      setIsPlaying(true);
      return;
    }

    const currentIndex = list.findIndex(t => t.id === currentTrack.id);
    let targetIndex = 0;

    if (direction === 'next') {
      targetIndex = currentIndex + 1;
      if (targetIndex >= list.length) {
        targetIndex = 0; // wrap to start
      }
    } else {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) {
        targetIndex = list.length - 1; // wrap to end
      }
    }

    setCurrentTrack(list[targetIndex]);
    setIsPlaying(true);
  };

  // --- Handle audio events ---
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    if (loopMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else if (loopMode === 'all') {
      skipTrack('next');
    } else {
      // mode is 'none'
      const list = getFilteredTracksList();
      const currentIndex = list.findIndex(t => t.id === currentTrack.id);
      if (currentIndex < list.length - 1) {
        skipTrack('next');
      } else {
        setIsPlaying(false); // end of list
      }
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // --- Sleep Timer Trigger Actions ---
  const handleStartSleepTimer = (minutes: number) => {
    setSleepTimer({
      isActive: true,
      timeLeft: minutes * 60,
      duration: minutes
    });
  };

  const handleStopSleepTimer = () => {
    setSleepTimer(prev => ({
      ...prev,
      isActive: false,
      timeLeft: 0
    }));
  };

  const handleLoopModeCycle = () => {
    setLoopMode(prev => {
      if (prev === 'none') return 'one';
      if (prev === 'one') return 'all';
      return 'none';
    });
  };

  // Filters for display
  const filteredTracks = getFilteredTracksList();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 font-sans antialiased overflow-x-hidden relative selection:bg-indigo-500/30">
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Decorative Blur Background Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Main Container Wrapper */}
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
        {/* Navigation / Top Header bar */}
        <header className="flex items-center justify-between bg-slate-900/30 border border-slate-800/40 rounded-3xl px-6 py-4 backdrop-blur-md shadow-lg" id="app-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-950/40">
              <Headphones className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                REPRODUTOR DE MÚSICA
              </h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-0.5">Estúdio de Áudio Digital</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-2xl">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold font-mono text-slate-300">
              {playlist.length} FAIXAS CARREGADAS
            </span>
          </div>
        </header>

        {/* PWA Install Banner */}
        {showInstallBtn && !isInstallDismissed && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-900/40 border border-indigo-500/30 p-4.5 rounded-3xl backdrop-blur-md shadow-xl" id="pwa-install-banner">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shrink-0">
                <Smartphone className="w-5 h-5 text-indigo-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100">Instalar no seu celular ou computador!</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">Instale este app para escutar suas músicas com facilidade na tela inicial, com suporte a áudio contínuo e em segundo plano.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                id="btn-dismiss-install"
                onClick={() => setIsInstallDismissed(true)}
                className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-all"
              >
                Agora não
              </button>
              <button
                id="btn-trigger-install"
                onClick={handleInstallApp}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-[11px] font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar Aplicativo
              </button>
            </div>
          </div>
        )}

        {/* iOS installation guidance */}
        {showIosTip && !isInstallDismissed && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/20 to-slate-900/40 border border-indigo-500/20 p-4 rounded-3xl backdrop-blur-md" id="pwa-ios-banner">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl shrink-0">
                <Smartphone className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Como instalar no seu iPhone / iPad:</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-medium">
                  Toque no botão de <strong className="text-indigo-300">Compartilhar</strong> (ícone de quadrado com seta para cima) no Safari e escolha <strong className="text-indigo-300">"Adicionar à Tela de Início"</strong> para escutar em segundo plano!
                </p>
              </div>
            </div>
            <button
              id="btn-dismiss-ios-tip"
              onClick={() => setIsInstallDismissed(true)}
              className="px-3 py-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 shrink-0"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Dynamic Warning Alert Banner if no tracks are present */}
        {playlist.length === 0 && (
          <div className="flex items-center gap-3 bg-amber-950/20 border border-amber-900/30 p-4 rounded-2xl" id="empty-playlist-alert">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300 font-medium">
              Sua lista de reprodução está vazia. Importe uma faixa customizada ou reinicie a página para recuperar os dados padrão.
            </p>
          </div>
        )}

        {/* Primary Content Grid Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="main-grid">
          {/* LEFT COLUMN: Player visualizer, controls, presets, sleep timer (7 cols) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            {/* Active Song Information Card */}
            <CurrentTrackDetail
              track={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
            />

            {/* Playback Progress Slider and Action Buttons */}
            <PlayerControls
              isPlaying={isPlaying}
              onPlayPauseToggle={() => setIsPlaying(!isPlaying)}
              onNext={() => skipTrack('next')}
              onPrev={() => skipTrack('prev')}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              volume={volume}
              onVolumeChange={setVolume}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
              isShuffle={isShuffle}
              onShuffleToggle={() => setIsShuffle(!isShuffle)}
              loopMode={loopMode}
              onLoopModeCycle={handleLoopModeCycle}
            />

            {/* High-fidelity Equalizer Spectrum Visualizer */}
            <Visualizer
              isPlaying={isPlaying}
              preset={equalizerPreset}
              genre={currentTrack.genre}
              volume={isMuted ? 0 : volume}
            />

            {/* Equalizer Sound Presets & Sleep Timer Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AudioPresets
                currentPreset={equalizerPreset}
                onPresetChange={setEqualizerPreset}
              />
              <SleepTimer
                config={sleepTimer}
                onStartTimer={handleStartSleepTimer}
                onStopTimer={handleStopSleepTimer}
              />
            </div>
          </section>

          {/* RIGHT COLUMN: Interactive Track list panel (5 cols) */}
          <section className="lg:col-span-5 h-full">
            <TrackList
              tracks={filteredTracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTrackSelect={(track) => {
                setCurrentTrack(track);
                setIsPlaying(true);
              }}
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
              selectedGenre={selectedGenre}
              onGenreSelect={setSelectedGenre}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAddCustomTrack={handleAddCustomTrack}
              onAddLocalFile={handleAddLocalFile}
              onRemoveTrack={handleRemoveTrack}
            />
          </section>
        </main>

        {/* Footer info brand */}
        <footer className="text-center py-4 border-t border-slate-900 mt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-600 font-medium" id="app-footer">
          <div className="flex items-center gap-1.5 justify-center">
            <Compass className="w-3.5 h-3.5 text-slate-600" />
            <span>Reprodutor de Música Digital © 2026. Feito com amor e áudio de alta fidelidade.</span>
          </div>
          <div className="mt-2 sm:mt-0 font-mono text-slate-700">
            AUDIO_API_MODE: HTML5_MEDIA_ELEMENT
          </div>
        </footer>
      </div>
    </div>
  );
}
