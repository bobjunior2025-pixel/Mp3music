import React, { useState } from 'react';
import { Track } from '../types';
import { Search, Heart, Play, Plus, Trash2, Globe, Music, Sparkles, Upload, Download, Youtube } from 'lucide-react';

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  selectedGenre: string;
  onGenreSelect: (genre: 'Todos' | 'Clássica' | 'Ambient' | 'Favoritos') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddCustomTrack: (track: Omit<Track, 'id'>) => void;
  onAddLocalFile: (file: File) => void;
  onRemoveTrack: (id: string) => void;
}

export default function TrackList({
  tracks,
  currentTrack,
  isPlaying,
  onTrackSelect,
  favorites,
  onFavoriteToggle,
  selectedGenre,
  onGenreSelect,
  searchQuery,
  onSearchChange,
  onAddCustomTrack,
  onAddLocalFile,
  onRemoveTrack,
}: TrackListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newGenre, setNewGenre] = useState<'Clássica' | 'Ambient' | 'Custom'>('Custom');
  const [errorMessage, setErrorMessage] = useState('');

  // --- YouTube Downloader Tab states ---
  const [importTab, setImportTab] = useState<'youtube' | 'direct'>('youtube');
  const [ytUrl, setYtUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [ytError, setYtError] = useState('');

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setYtError('');
    setIsConverting(true);

    if (!ytUrl.trim()) {
      setYtError('O link do YouTube é obrigatório.');
      setIsConverting(false);
      return;
    }

    // Basic URL validation
    if (!ytUrl.includes('youtube.com') && !ytUrl.includes('youtu.be')) {
      setYtError('Por favor, insira um link do YouTube válido.');
      setIsConverting(false);
      return;
    }

    try {
      // POST request to Cobalt API
      const response = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: ytUrl,
          isAudioOnly: true,
          aFormat: 'mp3',
          audioBitrate: '128'
        })
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.text || 'Erro ao processar o link do YouTube.');
      }

      if (!data.url) {
        throw new Error('Não foi possível obter um link direto do áudio.');
      }

      // Try to extract YouTube Video ID for the cover art
      const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };

      const videoId = getYouTubeId(ytUrl);
      const coverUrl = videoId 
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop';

      // Use returned filename/title if available, or extract from url
      const title = data.text || `Música do YouTube (${videoId || 'Sem ID'})`;
      const artist = 'Importado do YouTube';

      onAddCustomTrack({
        title,
        artist,
        url: data.url,
        duration: '04:00', // Default, updated on play
        coverUrl,
        genre: 'Custom',
        description: `Música importada do YouTube via link:\n${ytUrl}\n\nVocê pode escutar a faixa agora mesmo ou baixá-la usando o botão de download.`,
        lyrics: [
          '[00:00] (Áudio do YouTube Importado)',
          `[00:05] Link original: ${ytUrl}`,
          '[00:15] O reprodutor agora suporta download local de qualquer faixa.',
          '[00:30] Use o ícone de download para salvar este MP3 no seu celular.'
        ]
      });

      // Clear fields & close
      setYtUrl('');
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      setYtError(err.message || 'Houve um problema de conexão com o conversor de áudio. Tente novamente.');
    } finally {
      setIsConverting(false);
    }
  };

  const genres: ('Todos' | 'Clássica' | 'Ambient' | 'Favoritos')[] = ['Todos', 'Clássica', 'Ambient', 'Favoritos'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newTitle.trim()) {
      setErrorMessage('O título é obrigatório.');
      return;
    }
    if (!newArtist.trim()) {
      setErrorMessage('O artista é obrigatório.');
      return;
    }
    if (!newUrl.trim() || !newUrl.startsWith('http')) {
      setErrorMessage('Por favor, insira uma URL HTTP/HTTPS válida para o arquivo de áudio.');
      return;
    }

    // Default Unsplash placeholder cover
    const coverUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop';

    onAddCustomTrack({
      title: newTitle,
      artist: newArtist,
      url: newUrl,
      duration: '03:30', // Default mock duration for custom tracks
      coverUrl,
      genre: newGenre,
      description: `Faixa customizada importada diretamente via streaming de: ${newUrl}`,
      lyrics: ['[00:00] (Faixa Customizada Importada)', '[00:30] Reproduzindo do link fornecido pelo usuário.']
    });

    // Reset Form
    setNewTitle('');
    setNewArtist('');
    setNewUrl('');
    setNewGenre('Custom');
    setShowAddModal(false);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col h-full" id="tracklist-container">
      {/* Search and Filters */}
      <div className="space-y-3.5 mb-4">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="track-search-input"
            type="text"
            placeholder="Buscar por faixa ou artista..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
          />
        </div>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1.5" id="genre-filters">
          {genres.map((g) => {
            const isActive = selectedGenre === g;
            return (
              <button
                key={g}
                id={`btn-genre-filter-${g}`}
                onClick={() => onGenreSelect(g)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow shadow-indigo-950'
                    : 'bg-slate-950/40 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-slate-800/40'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tracks Container list */}
      <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-1.5 scrollbar-thin">
        {tracks.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-4">
            <Music className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 font-medium text-center">Nenhuma faixa encontrada nesta seção.</p>
          </div>
        ) : (
          tracks.map((track, index) => {
            const isCurrent = currentTrack.id === track.id;
            const isFav = favorites.includes(track.id);

            return (
              <div
                key={track.id}
                id={`track-item-${track.id}`}
                className={`group flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-100 shadow-md shadow-indigo-950/10'
                    : 'bg-slate-950/20 border-slate-900 hover:bg-slate-800/20 text-slate-400'
                }`}
              >
                {/* Visual Play / Track Number Index */}
                <div 
                  className="w-7 h-7 shrink-0 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-center cursor-pointer hover:bg-indigo-600 hover:text-white transition-all"
                  onClick={() => onTrackSelect(track)}
                >
                  {isCurrent && isPlaying ? (
                    /* Elegant live soundwave EQ visualizer animation */
                    <div className="flex gap-[2px] items-end h-3 justify-center">
                      <span className="w-[2px] bg-indigo-400 rounded-full animate-[bounce_0.8s_infinite_100ms] h-3" />
                      <span className="w-[2px] bg-indigo-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-2" />
                      <span className="w-[2px] bg-indigo-400 rounded-full animate-[bounce_0.7s_infinite_200ms] h-3.5" />
                    </div>
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
                  )}
                </div>

                {/* Cover Thumb */}
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 object-cover rounded-xl shrink-0 bg-slate-800"
                />

                {/* Track text metadata */}
                <div className="flex-1 min-w-0">
                  <h4 
                    onClick={() => onTrackSelect(track)}
                    className={`text-xs font-bold truncate cursor-pointer hover:text-indigo-300 transition-colors ${
                      isCurrent ? 'text-indigo-100' : 'text-slate-200'
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{track.artist}</p>
                </div>

                {/* Right utility items: Fav & Delete & Time */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">{track.duration}</span>
                  
                  {/* Download button */}
                  <button
                    id={`btn-download-${track.id}`}
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = track.url;
                      a.download = `${track.title}.mp3`;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-indigo-400 transition-all shrink-0"
                    title="Baixar MP3"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Favorite toggle */}
                  <button
                    id={`btn-fav-${track.id}`}
                    onClick={() => onFavoriteToggle(track.id)}
                    className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-red-400 transition-all shrink-0"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  {/* Delete Option for Custom Tracks */}
                  {track.genre === 'Custom' && (
                    <button
                      id={`btn-delete-${track.id}`}
                      onClick={() => onRemoveTrack(track.id)}
                      className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-red-400 transition-all shrink-0"
                      title="Excluir Faixa Customizada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Button to toggle add form */}
      <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-col gap-2.5">
        <button
          id="btn-toggle-add-track"
          onClick={() => setShowAddModal(!showAddModal)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-950/60 border border-slate-800 hover:bg-indigo-600/10 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-xs font-bold rounded-2xl transition-all shadow"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          Importar Faixa Customizada (URL)
        </button>

        {/* Local device file selector and drag & drop zone */}
        <label 
          id="local-dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-indigo-500/80', 'bg-indigo-950/20');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-indigo-500/80', 'bg-indigo-950/20');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-indigo-500/80', 'bg-indigo-950/20');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              for (let i = 0; i < e.dataTransfer.files.length; i++) {
                const f = e.dataTransfer.files[i];
                if (f.type.startsWith('audio/') || f.name.endsWith('.mp3') || f.name.endsWith('.wav') || f.name.endsWith('.ogg') || f.name.endsWith('.m4a')) {
                  onAddLocalFile(f);
                }
              }
            }
          }}
          className="flex flex-col items-center justify-center border border-dashed border-slate-800/80 hover:border-indigo-500/40 hover:bg-indigo-950/10 rounded-2xl p-4 cursor-pointer transition-all text-center group bg-slate-950/20"
        >
          <input
            id="input-local-file"
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                for (let i = 0; i < e.target.files.length; i++) {
                  onAddLocalFile(e.target.files[i]);
                }
              }
            }}
          />
          <Upload className="w-5 h-5 text-indigo-400 group-hover:text-purple-400 group-hover:scale-110 transition-all mb-1.5" />
          <span className="text-xs font-bold text-slate-200 group-hover:text-white">Carregar do Dispositivo</span>
          <span className="text-[9px] text-slate-500 font-medium mt-0.5">Solte arquivos de áudio aqui ou clique para selecionar</span>
        </label>
      </div>

      {/* In-app modal / Accordion form to add custom song */}
      {showAddModal && (
        <div className="mt-3 p-4 bg-slate-950/90 border border-indigo-500/20 rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
            <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Importar Nova Música
            </h5>
            <button
              id="btn-close-add-modal"
              onClick={() => {
                setShowAddModal(false);
                setYtError('');
                setErrorMessage('');
              }}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-bold"
            >
              Fechar
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-3">
            <button
              type="button"
              id="tab-select-youtube"
              onClick={() => setImportTab('youtube')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                importTab === 'youtube'
                  ? 'bg-gradient-to-r from-red-500/10 to-purple-600/10 border border-red-500/30 text-red-400 shadow-sm shadow-red-950/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              Link do YouTube
            </button>
            <button
              type="button"
              id="tab-select-direct"
              onClick={() => setImportTab('direct')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                importTab === 'direct'
                  ? 'bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-500/30 text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              URL Direta (MP3)
            </button>
          </div>

          {/* YouTube Tab Form */}
          {importTab === 'youtube' ? (
            <form onSubmit={handleYoutubeSubmit} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Link do Vídeo no YouTube</label>
                <div className="relative">
                  <input
                    id="input-youtube-url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    disabled={isConverting}
                    className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-red-500/40 transition-all font-mono disabled:opacity-50"
                  />
                  <Youtube className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                </div>
                <span className="text-[8px] text-slate-500 mt-1 block leading-relaxed">
                  Pode ser um link de música, clipe, podcast ou vídeo. Extrairemos o áudio de alta qualidade automaticamente!
                </span>
              </div>

              {ytError && (
                <p className="text-[10px] text-red-400 font-semibold mt-1 bg-red-950/20 p-2 rounded-lg border border-red-900/30">
                  {ytError}
                </p>
              )}

              {isConverting ? (
                <div className="flex flex-col items-center justify-center py-3 bg-slate-900/50 rounded-xl border border-dashed border-red-500/20">
                  {/* Rotating loader */}
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-[10px] text-slate-300 font-bold">Processando link do YouTube...</span>
                  <span className="text-[8px] text-slate-500 font-medium mt-0.5">Isso leva de 5 a 15 segundos.</span>
                </div>
              ) : (
                <button
                  id="btn-submit-youtube-import"
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow shadow-red-950 transition-all active:scale-95"
                >
                  Converter & Importar MP3
                </button>
              )}
            </form>
          ) : (
            /* Direct URL Tab Form (Original) */
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Título</label>
                <input
                  id="input-add-title"
                  type="text"
                  placeholder="Ex: Minha Música Ambient"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Artista</label>
                <input
                  id="input-add-artist"
                  type="text"
                  placeholder="Ex: DJ Kevin"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">URL Direta do Áudio (MP3)</label>
                <input
                  id="input-add-url"
                  type="text"
                  placeholder="https://exemplo.com/musica.mp3"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                />
                <span className="text-[8px] text-slate-600 mt-1 block">
                  Insira uma URL direta para um arquivo de áudio público hospedado na web.
                </span>
              </div>

              {errorMessage && (
                <p className="text-[10px] text-red-400 font-semibold mt-1 bg-red-950/20 p-2 rounded-lg border border-red-900/30">
                  {errorMessage}
                </p>
              )}

              <button
                id="btn-submit-add-track"
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-xl shadow shadow-purple-950 transition-all active:scale-95"
              >
                Adicionar à Playlist
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
