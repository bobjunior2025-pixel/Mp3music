export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: string; // format "MM:SS"
  url: string;
  coverUrl: string;
  genre: 'Clássica' | 'Ambient' | 'Custom';
  description?: string;
  lyrics?: string[];
}

export interface CustomPlaylist {
  id: string;
  name: string;
  trackIds: string[];
}

export type EqualizerPreset = 'flat' | 'bass' | 'vocal' | 'classic' | 'chill';

export interface SleepTimerConfig {
  isActive: boolean;
  timeLeft: number; // in seconds
  duration: number; // in minutes
}
