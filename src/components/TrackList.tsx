import React, { useState } from 'react';
import { Track, CustomPlaylist } from '../types';
import { Search, Heart, Play, Plus, Trash2, Globe, Music, Sparkles, Upload, Download, Youtube, ListMusic, ListPlus, FolderPlus, Folder, X, ChevronRight, Check } from 'lucide-react';

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

  // Custom Playlists props
  customPlaylists: CustomPlaylist[];
  selectedPlaylistId: string | null;
  onPlaylistSelect: (id: string | null) => void;
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddTrackToPlaylist: (playlistId: string, trackId: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  allPlaylistTracks: Track[];
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

  customPlaylists,
  selectedPlaylistId,
  onPlaylistSelect,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
  allPlaylistTracks,
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

  // --- Custom Playlists tab states ---
  const [activeTab, setActiveTab] = useState<'songs' | 'playlists'>('songs');
  const [playlistMenuTrackId, setPlaylistMenuTrackId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreatePlaylistInput, setShowCreatePlaylistInput] = useState(false);

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
      // POST request to local proxy endpoint to bypass CORS and frame restrictions
      const response = await fetch('/api/proxy-cobalt', {
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
      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-slate-950/60 border border-slate-800 rounded-2xl mb-4 shrink-0" id="playlist-tabs">
        <button
          type="button"
          id="tab-songs-btn"
          onClick={() => setActiveTab('songs')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'songs'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          Músicas
        </button>
        <button
          type="button"
          id="tab-playlists-btn"
          onClick={() => setActiveTab('playlists')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'playlists'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          Playlists {customPlaylists.length > 0 && <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0">{customPlaylists.length}</span>}
        </button>
      </div>

      {activeTab === 'songs' ? (
        <>
          {/* Active Playlist Header Banner */}
          {selectedPlaylistId && (
            <div className="flex items-center justify-between p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl mb-3 shrink-0 animate-fade-in" id="active-playlist-banner">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300 truncate">
                  Playlist: {customPlaylists.find(p => p.id === selectedPlaylistId)?.name || 'Personalizada'}
                </span>
              </div>
              <button
                type="button"
                id="btn-clear-playlist-filter"
                onClick={() => onPlaylistSelect(null)}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
              >
                Ver Todas
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="space-y-3.5 mb-4 shrink-0">
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
                const isActive = !selectedPlaylistId && selectedGenre === g;
                return (
                  <button
                    key={g}
                    type="button"
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
                    <div className="flex items-center gap-2 relative">
                      <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">{track.duration}</span>
                      
                      {/* Download button */}
                      <button
                        type="button"
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
                        type="button"
                        id={`btn-fav-${track.id}`}
                        onClick={() => onFavoriteToggle(track.id)}
                        className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-red-400 transition-all shrink-0"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {/* Add to Custom Playlist button */}
                      <div className="relative shrink-0 flex items-center">
                        <button
                          type="button"
                          id={`btn-add-to-playlist-trigger-${track.id}`}
                          onClick={() => setPlaylistMenuTrackId(playlistMenuTrackId === track.id ? null : track.id)}
                          className={`p-1 rounded-lg hover:bg-slate-800/30 transition-all ${playlistMenuTrackId === track.id ? 'text-indigo-400 bg-slate-800/30' : 'text-slate-500 hover:text-indigo-400'}`}
                          title="Adicionar à Playlist"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>

                        {playlistMenuTrackId === track.id && (
                          <div className="absolute right-0 bottom-full mb-2 z-50 w-48 bg-slate-950/95 border border-slate-800/80 rounded-2xl shadow-2xl p-2 space-y-1">
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase px-2.5 py-1.5 border-b border-slate-800/40 mb-1 tracking-wider">
                              Playlists:
                            </div>
                            {customPlaylists.length === 0 ? (
                              <div className="px-2.5 py-2 text-[10px] text-slate-500 text-center leading-relaxed">
                                Nenhuma playlist criada. Toque na aba "Playlists" para criar.
                              </div>
                            ) : (
                              <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
                                {customPlaylists.map((pl) => {
                                  const isAlreadyIn = pl.trackIds.includes(track.id);
                                  return (
                                    <button
                                      key={pl.id}
                                      type="button"
                                      id={`btn-toggle-track-${track.id}-pl-${pl.id}`}
                                      onClick={() => {
                                        if (isAlreadyIn) {
                                          onRemoveTrackFromPlaylist(pl.id, track.id);
                                        } else {
                                          onAddTrackToPlaylist(pl.id, track.id);
                                        }
                                        setPlaylistMenuTrackId(null);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-600/10 rounded-xl text-[10px] font-bold flex items-center justify-between transition-colors text-slate-200 hover:text-white"
                                    >
                                      <span className="truncate mr-2">{pl.name}</span>
                                      {isAlreadyIn ? (
                                        <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                      ) : (
                                        <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Remove from Active Playlist or Complete Exclude option */}
                      {selectedPlaylistId ? (
                        <button
                          type="button"
                          id={`btn-remove-from-playlist-${track.id}`}
                          onClick={() => onRemoveTrackFromPlaylist(selectedPlaylistId, track.id)}
                          className="p-1 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all shrink-0"
                          title="Remover desta Playlist"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      ) : (
                        track.genre === 'Custom' && (
                          <button
                            type="button"
                            id={`btn-delete-${track.id}`}
                            onClick={() => onRemoveTrack(track.id)}
                            className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-red-400 transition-all shrink-0"
                            title="Excluir Faixa Customizada"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Button to toggle add form */}
          <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-col gap-2.5 shrink-0">
            <button
              type="button"
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
        </>
      ) : (
        /* Playlists management tab */
        <div className="flex flex-col flex-1 min-h-0 animate-fade-in">
          {/* Create new playlist container */}
          <div className="mb-4 shrink-0">
            {!showCreatePlaylistInput ? (
              <button
                type="button"
                id="btn-show-create-playlist"
                onClick={() => setShowCreatePlaylistInput(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950/40 border border-slate-800 hover:bg-indigo-600/15 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-2xl transition-all shadow"
              >
                <FolderPlus className="w-4 h-4" />
                Nova Playlist Personalizada
              </button>
            ) : (
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Criar Nova Playlist</h5>
                <div className="flex gap-2">
                  <input
                    id="input-playlist-name"
                    type="text"
                    placeholder="Nome da playlist (ex: Relaxar, Treino...)"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  />
                  <button
                    type="button"
                    id="btn-create-playlist-submit"
                    onClick={() => {
                      if (newPlaylistName.trim()) {
                        onCreatePlaylist(newPlaylistName.trim());
                        setNewPlaylistName('');
                        setShowCreatePlaylistInput(false);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-xl shadow active:scale-95 transition-all"
                  >
                    Criar
                  </button>
                  <button
                    type="button"
                    id="btn-create-playlist-cancel"
                    onClick={() => {
                      setShowCreatePlaylistInput(false);
                      setNewPlaylistName('');
                    }}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* List of Custom Playlists */}
          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1 scrollbar-thin">
            {customPlaylists.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-4">
                <Folder className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 font-medium text-center">Nenhuma playlist personalizada criada ainda.</p>
                <p className="text-[10px] text-slate-600 font-medium text-center mt-1">Crie uma playlist acima para agrupar suas faixas preferidas!</p>
              </div>
            ) : (
              customPlaylists.map((pl) => {
                const isSelected = selectedPlaylistId === pl.id;
                return (
                  <div
                    key={pl.id}
                    id={`playlist-card-${pl.id}`}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-100 shadow-md shadow-indigo-950/10'
                        : 'bg-slate-950/20 border-slate-900 hover:bg-slate-800/20 text-slate-300'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        onPlaylistSelect(pl.id);
                        setActiveTab('songs'); // switch to songs tab so they instantly see the tracks!
                      }}
                    >
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                        <ListMusic className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 truncate hover:text-indigo-400 transition-colors">
                          {pl.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold">
                          {pl.trackIds.length} {pl.trackIds.length === 1 ? 'música' : 'músicas'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        id={`btn-select-playlist-${pl.id}`}
                        onClick={() => {
                          onPlaylistSelect(pl.id);
                          setActiveTab('songs');
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-800/30 text-indigo-400 hover:text-indigo-300 transition-all text-[10px] font-bold flex items-center gap-1"
                        title="Ver Músicas"
                      >
                        <span>Ver</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        id={`btn-delete-playlist-${pl.id}`}
                        onClick={() => onDeletePlaylist(pl.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                        title="Excluir Playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

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
