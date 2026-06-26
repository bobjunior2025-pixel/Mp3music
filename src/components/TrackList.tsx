import React, { useState } from 'react';
import { Track, Playlist } from '../types';
import { 
  Search, Heart, Play, Plus, Trash2, Music, Sparkles, Upload, Download,
  FolderPlus, ListPlus, ListMusic, ArrowLeft, Check, FolderClosed, Music4, FolderHeart, X,
  ChevronUp, ChevronDown
} from 'lucide-react';

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  selectedGenre: string;
  onGenreSelect: (genre: 'Todos' | 'Efeitos' | 'Favoritos') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddLocalFile: (file: File) => void;
  onRemoveTrack: (id: string) => void;
  
  playlists: Playlist[];
  activePlaylistId: string | null;
  onPlaylistSelect: (id: string | null) => void;
  onCreatePlaylist: (name: string, description?: string) => Playlist;
  onDeletePlaylist: (id: string) => void;
  onAddTrackToPlaylist: (playlistId: string, trackId: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  masterTracks: Track[];
  onReorderPlaylistTracks?: (playlistId: string, trackIds: string[]) => void;
  onRestoreDefaults?: () => void;
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
  onAddLocalFile,
  onRemoveTrack,
  
  playlists,
  activePlaylistId,
  onPlaylistSelect,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
  masterTracks,
  onReorderPlaylistTracks,
  onRestoreDefaults,
}: TrackListProps) {
  // --- Personalized Playlists Tab States ---
  const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('library');
  const [viewingPlaylistId, setViewingPlaylistId] = useState<string | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [activeDropdownTrackId, setActiveDropdownTrackId] = useState<string | null>(null);

  const genres: ('Todos' | 'Efeitos' | 'Favoritos')[] = ['Todos', 'Efeitos', 'Favoritos'];

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    if (!onReorderPlaylistTracks || !viewingPlaylistId) return;
    const currentViewingPlaylist = playlists.find(p => p.id === viewingPlaylistId);
    if (!currentViewingPlaylist) return;

    const newTrackIds = [...currentViewingPlaylist.trackIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTrackIds.length) return;
    
    // Swap
    const temp = newTrackIds[index];
    newTrackIds[index] = newTrackIds[targetIndex];
    newTrackIds[targetIndex] = temp;
    
    onReorderPlaylistTracks(viewingPlaylistId, newTrackIds);
  };

  // --- Render Tab Selector Helper ---
  const renderTabSelector = () => (
    <div className="flex gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl mb-4">
      <button
        type="button"
        id="tab-select-library"
        onClick={() => {
          setActiveTab('library');
          setViewingPlaylistId(null);
          onPlaylistSelect(null); // Clear custom playlist context
        }}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'library' && !viewingPlaylistId
            ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
        }`}
      >
        <Music className="w-4 h-4 text-indigo-400" />
        Biblioteca
      </button>
      <button
        type="button"
        id="tab-select-playlists"
        onClick={() => {
          setActiveTab('playlists');
          setViewingPlaylistId(null);
        }}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'playlists' || viewingPlaylistId
            ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
        }`}
      >
        <ListMusic className="w-4 h-4 text-purple-400" />
        Playlists {playlists.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] rounded-full font-mono">{playlists.length}</span>}
      </button>
    </div>
  );

  // --- SCREEN 1: PLAYLIST DETAIL VIEW ---
  if (viewingPlaylistId) {
    const currentViewingPlaylist = playlists.find(p => p.id === viewingPlaylistId);
    
    if (currentViewingPlaylist) {
      const playlistTracks = currentViewingPlaylist.trackIds
        .map(id => masterTracks.find(track => track.id === id))
        .filter((track): track is Track => !!track);
      const otherTracks = masterTracks.filter(track => !currentViewingPlaylist.trackIds.includes(track.id));

      return (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col h-full" id="playlist-detail-container">
          {/* Detail Header */}
          <div className="flex flex-col gap-3.5 mb-4 pb-4 border-b border-slate-800/60">
            <button
              onClick={() => {
                setViewingPlaylistId(null);
                setActiveTab('playlists');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors self-start cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Playlists
            </button>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl border border-indigo-500/30 shrink-0">
                  <FolderHeart className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100">
                    {currentViewingPlaylist.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{currentViewingPlaylist.description || 'Playlist personalizada'}</p>
                  <div className="flex items-center gap-2 mt-1 bg-slate-950/60 border border-slate-800 px-2 py-0.5 rounded-lg w-max">
                    <span className="text-[9px] font-mono font-bold text-slate-400">{playlistTracks.length} {playlistTracks.length === 1 ? 'MÚSICA' : 'MÚSICAS'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {playlistTracks.length > 0 && (
                  <button
                    onClick={() => {
                      onPlaylistSelect(currentViewingPlaylist.id);
                      onTrackSelect(playlistTracks[0]);
                    }}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Tocar Playlist Inteira"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(`Tem certeza de que deseja excluir a playlist "${currentViewingPlaylist.name}"?`)) {
                      onDeletePlaylist(currentViewingPlaylist.id);
                      setViewingPlaylistId(null);
                      setActiveTab('playlists');
                    }
                  }}
                  className="p-2 bg-slate-950/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Excluir Playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tracks List */}
          <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-1.5 scrollbar-thin">
            {playlistTracks.length === 0 ? (
              <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800/60 rounded-2xl p-4">
                <Music className="w-6 h-6 text-slate-600 mb-1" />
                <p className="text-[11px] text-slate-500 font-semibold text-center">Esta playlist está vazia.</p>
                <p className="text-[9px] text-slate-600 font-medium text-center mt-0.5">Adicione músicas listadas abaixo!</p>
              </div>
            ) : (
              playlistTracks.map((track, index) => {
                const isCurrent = currentTrack.id === track.id && activePlaylistId === currentViewingPlaylist.id;
                const isFav = favorites.includes(track.id);

                return (
                  <div
                    key={track.id}
                    className={`group flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-100 shadow-sm'
                        : 'bg-slate-950/10 border-slate-900/60 hover:bg-slate-800/10 text-slate-400'
                    }`}
                  >
                    {/* Play button */}
                    <div 
                      className="w-6.5 h-6.5 shrink-0 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-center cursor-pointer hover:bg-indigo-600 hover:text-white transition-all"
                      onClick={() => {
                        onPlaylistSelect(currentViewingPlaylist.id);
                        onTrackSelect(track);
                      }}
                    >
                      {isCurrent && isPlaying ? (
                        <div className="flex gap-[2px] items-end h-2.5 justify-center">
                          <span className="w-[1.5px] bg-indigo-400 rounded-full animate-[bounce_0.8s_infinite_100ms] h-2.5" />
                          <span className="w-[1.5px] bg-indigo-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-2" />
                          <span className="w-[1.5px] bg-indigo-400 rounded-full animate-[bounce_0.7s_infinite_200ms] h-3" />
                        </div>
                      ) : (
                        <Play className="w-3 h-3 fill-current text-indigo-400" />
                      )}
                    </div>

                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-7.5 h-7.5 object-cover rounded-lg shrink-0 bg-slate-800"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 
                        onClick={() => {
                          onPlaylistSelect(currentViewingPlaylist.id);
                          onTrackSelect(track);
                        }}
                        className={`text-xs font-bold truncate cursor-pointer hover:text-indigo-300 transition-colors ${
                          isCurrent ? 'text-indigo-100' : 'text-slate-200'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-[9px] text-slate-500 truncate font-semibold">{track.artist}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-mono text-slate-500 font-bold mr-1">{track.duration}</span>
                      
                      {/* Move Up Button */}
                      <button
                        onClick={() => moveTrack(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-indigo-400 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all cursor-pointer"
                        title="Mover para Cima"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Move Down Button */}
                      <button
                        onClick={() => moveTrack(index, 'down')}
                        disabled={index === playlistTracks.length - 1}
                        className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-indigo-400 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all cursor-pointer"
                        title="Mover para Baixo"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onRemoveTrackFromPlaylist(currentViewingPlaylist.id, track.id)}
                        className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-red-400 transition-all cursor-pointer ml-1"
                        title="Remover da Playlist"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Add Songs Section */}
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Adicionar Músicas da Biblioteca</h4>
            <div className="overflow-y-auto max-h-[140px] space-y-1.5 pr-1 scrollbar-thin">
              {otherTracks.length === 0 ? (
                <p className="text-[9px] text-slate-600 font-bold text-center py-2">Todas as músicas da biblioteca já estão nesta playlist.</p>
              ) : (
                otherTracks.map((track) => (
                  <div key={track.id} className="flex items-center justify-between gap-2 p-1.5 bg-slate-950/10 border border-slate-900/60 rounded-xl hover:bg-slate-950/30 transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={track.coverUrl} alt={track.title} referrerPolicy="no-referrer" className="w-6.5 h-6.5 object-cover rounded-md shrink-0 bg-slate-800" />
                      <div className="min-w-0">
                        <h5 className="text-[10px] font-bold text-slate-200 truncate">{track.title}</h5>
                        <p className="text-[8px] text-slate-500 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddTrackToPlaylist(currentViewingPlaylist.id, track.id)}
                      className="p-1.5 bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-850 rounded-lg text-indigo-400 transition-all cursor-pointer shrink-0"
                      title="Adicionar à playlist"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  // --- SCREEN 2: PLAYLISTS OVERVIEW TAB ---
  if (activeTab === 'playlists') {
    return (
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col h-full" id="playlists-tab-container">
        {/* Tab Selector */}
        {renderTabSelector()}

        {/* Playlist creation trigger */}
        {isCreatingPlaylist ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (newPlaylistName.trim()) {
                const created = onCreatePlaylist(newPlaylistName.trim());
                setNewPlaylistName('');
                setIsCreatingPlaylist(false);
                setViewingPlaylistId(created.id); // Open playlist details immediately
              }
            }}
            className="mb-4 p-3.5 bg-slate-950/60 border border-indigo-500/30 rounded-2xl space-y-2.5"
          >
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nome da Playlist</label>
              <input
                type="text"
                placeholder="Ex: Foco no Trabalho, Relaxar, Treino..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
              />
            </div>
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingPlaylist(false);
                  setNewPlaylistName('');
                }}
                className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold rounded-lg shadow transition-all active:scale-95 cursor-pointer"
              >
                Criar Playlist
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingPlaylist(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-4 bg-slate-950/60 border border-slate-800 hover:bg-indigo-600/10 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-2xl transition-all shadow cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            Nova Playlist Personalizada
          </button>
        )}

        {/* List of Playlists */}
        <div className="flex-1 overflow-y-auto max-h-[340px] pr-1 space-y-2 scrollbar-thin">
          {playlists.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800/60 rounded-2xl p-4">
              <FolderClosed className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 font-semibold text-center">Nenhuma playlist personalizada criada.</p>
              <p className="text-[10px] text-slate-600 font-medium text-center mt-1">Crie uma playlist acima para agrupar suas faixas favoritas!</p>
            </div>
          ) : (
            playlists.map((pl) => {
              const plTracks = masterTracks.filter(t => pl.trackIds.includes(t.id));
              const isCurrentPlaying = activePlaylistId === pl.id;

              return (
                <div
                  key={pl.id}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                    isCurrentPlaying
                      ? 'bg-gradient-to-r from-indigo-950/10 to-purple-950/10 border-indigo-500/30 shadow-md'
                      : 'bg-slate-950/20 border-slate-900 hover:bg-slate-800/15'
                  }`}
                >
                  <div 
                    onClick={() => setViewingPlaylistId(pl.id)}
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 group"
                  >
                    <div className="p-2.5 bg-slate-900 border border-slate-800 group-hover:border-indigo-500/30 group-hover:bg-indigo-950/10 rounded-xl transition-all shrink-0">
                      <ListMusic className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                        {pl.name} {isCurrentPlaying && <span className="ml-1 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] rounded-full uppercase font-bold tracking-wider">Ativa</span>}
                      </h4>
                      <p className="text-[9px] text-slate-500 truncate font-semibold">{plTracks.length} {plTracks.length === 1 ? 'música' : 'músicas'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {plTracks.length > 0 && (
                      <button
                        onClick={() => {
                          onPlaylistSelect(pl.id);
                          onTrackSelect(plTracks[0]);
                        }}
                        className="p-2 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition-all active:scale-95 cursor-pointer"
                        title="Tocar tudo"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => setViewingPlaylistId(pl.id)}
                      className="px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-300 rounded-lg transition-all cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --- SCREEN 3: GENERAL CATALOG / LIBRARY TAB ---
  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col h-full" id="tracklist-container">
      {/* Tab Selector */}
      {renderTabSelector()}

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
                className={`py-1.5 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
          tracks.map((track) => {
            const isCurrent = currentTrack.id === track.id && !activePlaylistId;
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
                <div className="flex items-center gap-1.5 shrink-0 relative">
                  <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0 mr-1">{track.duration}</span>
                  
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
                    className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-indigo-400 transition-all shrink-0 cursor-pointer"
                    title="Baixar MP3"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Add to Custom Playlist button */}
                  <div className="relative">
                    <button
                      id={`btn-add-to-pl-${track.id}`}
                      onClick={() => setActiveDropdownTrackId(activeDropdownTrackId === track.id ? null : track.id)}
                      className={`p-1 rounded-lg hover:bg-slate-800/30 transition-all shrink-0 cursor-pointer ${
                        activeDropdownTrackId === track.id ? 'text-indigo-400 bg-slate-800/30' : 'text-slate-500 hover:text-indigo-400'
                      }`}
                      title="Adicionar à playlist..."
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>

                    {activeDropdownTrackId === track.id && (
                      <div className="absolute right-0 top-full mt-1.5 z-40 w-48 bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-100">
                        <div className="text-[8px] font-bold text-slate-500 uppercase px-2 py-1 border-b border-slate-900 tracking-wider">Adicionar a:</div>
                        <div className="max-h-32 overflow-y-auto mt-1 space-y-0.5 scrollbar-thin">
                          {playlists.length === 0 ? (
                            <button
                              onClick={() => {
                                setActiveDropdownTrackId(null);
                                setActiveTab('playlists');
                                setIsCreatingPlaylist(true);
                              }}
                              className="w-full text-left px-2 py-1.5 text-[9px] font-bold text-indigo-400 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Criar playlist...
                            </button>
                          ) : (
                            playlists.map((pl) => {
                              const alreadyIn = pl.trackIds.includes(track.id);
                              return (
                                <button
                                  key={pl.id}
                                  onClick={() => {
                                    if (alreadyIn) {
                                      onRemoveTrackFromPlaylist(pl.id, track.id);
                                    } else {
                                      onAddTrackToPlaylist(pl.id, track.id);
                                    }
                                    setActiveDropdownTrackId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 text-[9.5px] font-bold hover:bg-slate-900 rounded-lg transition-colors flex items-center justify-between gap-1.5 text-slate-300 cursor-pointer"
                                >
                                  <span className="truncate">{pl.name}</span>
                                  {alreadyIn ? (
                                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                  ) : (
                                    <Plus className="w-3 h-3 text-slate-600 shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Favorite toggle */}
                  <button
                    id={`btn-fav-${track.id}`}
                    onClick={() => onFavoriteToggle(track.id)}
                    className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-red-400 transition-all shrink-0 cursor-pointer"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  {/* Delete Option */}
                  <button
                    id={`btn-delete-${track.id}`}
                    onClick={() => onRemoveTrack(track.id)}
                    className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-500 hover:text-red-400 transition-all shrink-0 cursor-pointer"
                    title="Excluir Faixa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Local device file selector and drag & drop zone */}
      <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-col gap-2.5">
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

        {/* Restore Defaults Button */}
        {onRestoreDefaults && masterTracks.length < 6 && (
          <button
            id="btn-restore-defaults"
            onClick={onRestoreDefaults}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-4 bg-slate-950/20 border border-dashed border-slate-800 hover:bg-indigo-950/10 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold rounded-2xl transition-all cursor-pointer mt-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Restaurar Músicas de Exemplo Originais
          </button>
        )}
      </div>
    </div>
  );
}
