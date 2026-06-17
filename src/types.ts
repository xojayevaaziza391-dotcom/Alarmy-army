export type SoundType = 'binaural' | 'whisper' | 'chime' | 'pulse' | 'nature' | 'bts_dynamite' | 'bts_butter' | 'bts_spring' | 'bts_lgo' | 'bts_bwl' | 'bts_fakelove' | 'bts_dna' | 'bts_ptd' | 'bts_piedpiper' | 'bts_arirang' | 'bts_comeover';

export interface Alarm {
  id: string;
  time: string; // HH:MM string format (24-hour style)
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  label: string;
  isEnabled: boolean;
  soundType: SoundType;
  snoozeDuration: number; // in minutes (default 5)
  crescendoSeconds: number; // sleep volume raise delay (default 30)
  isSnoozed: boolean;
  snoozedUntil: string | null; // ISO timestamp or HH:MM of next trigger
  heavySleeperMode?: boolean; // Requires a mini-game challenge (catching purple hearts) to dismiss
}

export interface CalibrationState {
  hasLeftTested: boolean;
  hasRightTested: boolean;
  hasConfirmedIsolation: boolean;
  hasConfirmedVolume: boolean;
  lastTestTimestamp: number | null;
}

export interface AmbientTrack {
  id: string;
  name: string;
  description: string;
  soundType: SoundType;
}
